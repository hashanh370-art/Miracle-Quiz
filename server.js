const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

function checkSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function encodeFilter(value) {
  return encodeURIComponent(String(value));
}

async function readSupabaseError(response) {
  try {
    return await response.text();
  } catch {
    return "Unknown Supabase error";
  }
}

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    supabaseConfigured: checkSupabaseConfig()
  });
});

// ======================================================
// CREATE COUPLE
// ======================================================

app.post("/api/couples/create", async (req, res) => {
  try {
    if (!checkSupabaseConfig()) {
      return res.status(500).json({
        message: "Supabase configuration is missing."
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and Password are required."
      });
    }

    const cleanUsername = username.trim();

    const usernameCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/couples?username=eq.${encodeFilter(
        cleanUsername
      )}&select=id&limit=1`,
      {
        headers: supabaseHeaders()
      }
    );

    if (!usernameCheck.ok) {
      const errorText = await readSupabaseError(usernameCheck);
      console.error("Username check failed:", errorText);

      return res.status(500).json({
        message: "Could not check username."
      });
    }

    const existingUsers = await usernameCheck.json();

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Username already exists."
      });
    }

    const coupleId = crypto.randomUUID();

    let coupleCode;
    let codeExists = true;

    while (codeExists) {
      coupleCode = crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();

      const codeCheck = await fetch(
        `${SUPABASE_URL}/rest/v1/couples?couple_code=eq.${encodeFilter(
          coupleCode
        )}&select=id&limit=1`,
        {
          headers: supabaseHeaders()
        }
      );

      if (!codeCheck.ok) {
        const errorText = await readSupabaseError(codeCheck);
        console.error("Couple code check failed:", errorText);

        return res.status(500).json({
          message: "Could not generate Couple Code."
        });
      }

      const existingCodes = await codeCheck.json();
      codeExists = existingCodes.length > 0;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const coupleResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/couples`,
      {
        method: "POST",
        headers: supabaseHeaders({
          Prefer: "return=representation"
        }),
        body: JSON.stringify({
          id: coupleId,
          couple_code: coupleCode,
          username: cleanUsername,
          password_hash: passwordHash,
          partners: 1,
          status: "Waiting for partner",
          option_sets: {}
        })
      }
    );

    if (!coupleResponse.ok) {
      const errorText = await readSupabaseError(coupleResponse);
      console.error("Create couple Supabase error:", errorText);

      return res.status(500).json({
        message: "Could not create Couple Account."
      });
    }

    const partnerResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/partners`,
      {
        method: "POST",
        headers: supabaseHeaders({
          Prefer: "return=representation"
        }),
        body: JSON.stringify({
          couple_id: coupleId,
          partner_number: 1,
          role: "Partner 1",
          language: null,
          gender: null,
          order_index: null,
          actual_answers: {},
          guesses: {},
          page4_completed: false,
          page5_completed: false,
          question_order: [],
          connected: true,
          female_partner_name: "",
          male_partner_name: ""
        })
      }
    );

    if (!partnerResponse.ok) {
      const errorText = await readSupabaseError(partnerResponse);
      console.error("Create Partner 1 error:", errorText);

      await fetch(
        `${SUPABASE_URL}/rest/v1/couples?id=eq.${encodeFilter(
          coupleId
        )}`,
        {
          method: "DELETE",
          headers: supabaseHeaders()
        }
      );

      return res.status(500).json({
        message: "Could not create Partner profile."
      });
    }

    res.status(201).json({
      message: "Couple Account created successfully ❤️",
      coupleId,
      coupleCode,
      username: cleanUsername,
      partnerId: 1,
      partnerNumber: 1,
      status: "Waiting for partner"
    });
  } catch (error) {
    console.error("Create couple error:", error);

    res.status(500).json({
      message: "Server error."
    });
  }
});

// ======================================================
// JOIN COUPLE
// ======================================================

app.post("/api/couples/join", async (req, res) => {
  try {
    if (!checkSupabaseConfig()) {
      return res.status(500).json({
        message: "Supabase configuration is missing."
      });
    }

    const { coupleCode } = req.body;

    if (!coupleCode) {
      return res.status(400).json({
        message: "Please enter your Couple Code."
      });
    }

    const cleanCode = coupleCode.trim().toUpperCase();

    const coupleResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/couples?couple_code=eq.${encodeFilter(
        cleanCode
      )}&select=*&limit=1`,
      {
        headers: supabaseHeaders()
      }
    );

    if (!coupleResponse.ok) {
      const errorText = await readSupabaseError(coupleResponse);
      console.error("Join lookup error:", errorText);

      return res.status(500).json({
        message: "Could not find Couple Account."
      });
    }

    const couples = await coupleResponse.json();

    if (couples.length === 0) {
      return res.status(404).json({
        message: "Invalid Couple Code."
      });
    }

    const couple = couples[0];

    if (Number(couple.partners) >= 2) {
      return res.status(403).json({
        message: "This Couple Account is already full."
      });
    }

    const existingPartnerResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/partners?couple_id=eq.${encodeFilter(
        couple.id
      )}&partner_number=eq.2&select=id&limit=1`,
      {
        headers: supabaseHeaders()
      }
    );

    if (!existingPartnerResponse.ok) {
      const errorText = await readSupabaseError(
        existingPartnerResponse
      );

      console.error("Partner 2 lookup error:", errorText);

      return res.status(500).json({
        message: "Could not check Partner 2."
      });
    }

    const existingPartner =
      await existingPartnerResponse.json();

    if (existingPartner.length === 0) {
      const partnerResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/partners`,
        {
          method: "POST",
          headers: supabaseHeaders({
            Prefer: "return=representation"
          }),
          body: JSON.stringify({
            couple_id: couple.id,
            partner_number: 2,
            role: "Partner 2",
            language: null,
            gender: null,
            order_index: null,
            actual_answers: {},
            guesses: {},
            page4_completed: false,
            page5_completed: false,
            question_order: [],
            connected: true,
            female_partner_name: "",
            male_partner_name: ""
          })
        }
      );

      if (!partnerResponse.ok) {
        const errorText = await readSupabaseError(partnerResponse);
        console.error("Create Partner 2 error:", errorText);

        return res.status(500).json({
          message: "Could not connect Partner 2."
        });
      }
    }

    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/couples?id=eq.${encodeFilter(
        couple.id
      )}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(),
        body: JSON.stringify({
          partners: 2,
          status: "Our Couple is Connected ❤️"
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await readSupabaseError(updateResponse);
      console.error("Update couple status error:", errorText);

      return res.status(500).json({
        message: "Could not update Couple status."
      });
    }

    res.json({
      message: "Our Couple is Connected ❤️",
      coupleId: couple.id,
      coupleCode: couple.couple_code,
      username: couple.username,
      partnerId: 2,
      partnerNumber: 2,
      status: "Our Couple is Connected ❤️"
    });
  } catch (error) {
    console.error("Join couple error:", error);

    res.status(500).json({
      message: "Server error."
    });
  }
});

// ======================================================
// TOTAL COUPLES COUNT
// ======================================================

app.get("/api/couples/count", async (req, res) => {
  try {
    if (!checkSupabaseConfig()) {
      return res.status(500).json({
        message: "Supabase configuration is missing."
      });
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/couples?select=id`,
      {
        method: "HEAD",
        headers: supabaseHeaders({
          Prefer: "count=exact"
        })
      }
    );

    if (!response.ok) {
      const errorText = await readSupabaseError(response);
      console.error("Count error:", errorText);

      return res.status(500).json({
        message: "Could not read couples from Supabase."
      });
    }

    const contentRange =
      response.headers.get("content-range");

    let totalCouples = 0;

    if (contentRange) {
      const total = contentRange.split("/")[1];

      if (total && total !== "*") {
        totalCouples = Number(total);
      }
    }

    res.json({
      totalCouples
    });
  } catch (error) {
    console.error("Couples count error:", error);

    res.status(500).json({
      message: "Server error."
    });
  }
});

// ======================================================
// GET COUPLE STATUS
// ======================================================

app.get(
  "/api/couples/:coupleId/status",
  async (req, res) => {
    try {
      if (!checkSupabaseConfig()) {
        return res.status(500).json({
          message: "Supabase configuration is missing."
        });
      }

      const { coupleId } = req.params;

      const coupleResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/couples?id=eq.${encodeFilter(
          coupleId
        )}&select=*&limit=1`,
        {
          headers: supabaseHeaders()
        }
      );

      if (!coupleResponse.ok) {
        const errorText = await readSupabaseError(coupleResponse);
        console.error("Get status error:", errorText);

        return res.status(500).json({
          message: "Could not read Couple status."
        });
      }

      const couples = await coupleResponse.json();

      if (couples.length === 0) {
        return res.status(404).json({
          message: "Couple not found."
        });
      }

      const couple = couples[0];

      const partnerResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/partners?couple_id=eq.${encodeFilter(
          coupleId
        )}&select=*&order=partner_number.asc`,
        {
          headers: supabaseHeaders()
        }
      );

      if (!partnerResponse.ok) {
        const errorText = await readSupabaseError(partnerResponse);
        console.error("Get partners error:", errorText);

        return res.status(500).json({
          message: "Could not read Partners."
        });
      }

      const partners = await partnerResponse.json();

      const partner1 = partners.find(
        (p) => Number(p.partner_number) === 1
      );

      const partner2 = partners.find(
        (p) => Number(p.partner_number) === 2
      );

      res.json({
        coupleId: couple.id,
        coupleCode: couple.couple_code,
        username: couple.username,
        status: couple.status,
        partners: couple.partners,

        partner1: partner1
          ? {
              connected: partner1.connected,
              language: partner1.language,
              gender: partner1.gender
            }
          : {
              connected: false,
              language: null,
              gender: null
            },

        partner2: partner2
          ? {
              connected: partner2.connected,
              language: partner2.language,
              gender: partner2.gender
            }
          : {
              connected: false,
              language: null,
              gender: null
            }
      });
    } catch (error) {
      console.error("Get couple status error:", error);

      res.status(500).json({
        message: "Server error."
      });
    }
  }
);

// ======================================================
// SAVE PARTNER PROFILE
// ======================================================

app.post(
  "/api/couples/:coupleId/profile",
  async (req, res) => {
    try {
      if (!checkSupabaseConfig()) {
        return res.status(500).json({
          message: "Supabase configuration is missing."
        });
      }

      const { coupleId } = req.params;

      const {
        partnerId,
        language,
        gender,
        malePartnerName,
        femalePartnerName
      } = req.body;

      const id = Number(partnerId);

      if (id !== 1 && id !== 2) {
        return res.status(400).json({
          message: "Invalid Partner ID."
        });
      }

      const allowedLanguages = [
        "English",
        "தமிழ்",
        "සිංහල"
      ];

      const allowedGenders = [
        "Male",
        "Female"
      ];

      if (!allowedLanguages.includes(language)) {
        return res.status(400).json({
          message: "Invalid language."
        });
      }

      if (!allowedGenders.includes(gender)) {
        return res.status(400).json({
          message: "Invalid gender."
        });
      }

      if (!malePartnerName || !femalePartnerName) {
        return res.status(400).json({
          message: "Both partner names are required."
        });
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/partners?couple_id=eq.${encodeFilter(
          coupleId
        )}&partner_number=eq.${id}`,
        {
          method: "PATCH",
          headers: supabaseHeaders({
            Prefer: "return=representation"
          }),
          body: JSON.stringify({
            language,
            gender,
            male_partner_name:
              malePartnerName.trim(),
            female_partner_name:
              femalePartnerName.trim(),
            connected: true,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        const errorText = await readSupabaseError(response);
        console.error("Save profile error:", errorText);

        return res.status(500).json({
          message: "Could not save Partner profile."
        });
      }

      const rows = await response.json();

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Partner not found."
        });
      }

      res.json({
        message: "Partner profile saved successfully ❤️",
        coupleId,
        partnerId: id,
        profile: {
          language,
          gender,
          malePartnerName:
            malePartnerName.trim(),
          femalePartnerName:
            femalePartnerName.trim()
        }
      });
    } catch (error) {
      console.error("Save profile error:", error);

      res.status(500).json({
        message: "Server error."
      });
    }
  }
);

// ======================================================
// GET PARTNER PROFILE
// ======================================================

app.get(
  "/api/couples/:coupleId/profile/:partnerId",
  async (req, res) => {
    try {
      if (!checkSupabaseConfig()) {
        return res.status(500).json({
          message: "Supabase configuration is missing."
        });
      }

      const {
        coupleId,
        partnerId
      } = req.params;

      const id = Number(partnerId);

      if (id !== 1 && id !== 2) {
        return res.status(400).json({
          message: "Invalid Partner ID."
        });
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/partners?couple_id=eq.${encodeFilter(
          coupleId
        )}&partner_number=eq.${id}&select=*&limit=1`,
        {
          headers: supabaseHeaders()
        }
      );

      if (!response.ok) {
        const errorText = await readSupabaseError(response);
        console.error("Get profile error:", errorText);

        return res.status(500).json({
          message: "Could not read Partner profile."
        });
      }

      const partners = await response.json();

      if (partners.length === 0) {
        return res.status(404).json({
          message: "Partner not found."
        });
      }

      const partner = partners[0];

      res.json({
        partnerId: id,
        connected: partner.connected,
        language: partner.language,
        gender: partner.gender,
        malePartnerName:
          partner.male_partner_name || "",
        femalePartnerName:
          partner.female_partner_name || ""
      });
    } catch (error) {
      console.error("Get profile error:", error);

      res.status(500).json({
        message: "Server error."
      });
    }
  }
);

// ======================================================
// SAVE PAGE 4 ACTUAL ANSWERS
// ======================================================

app.post(
  "/api/couples/:coupleId/page4",
  async (req, res) => {
    try {
      if (!checkSupabaseConfig()) {
        return res.status(500).json({
          message: "Supabase configuration is missing."
        });
      }

      const { coupleId } = req.params;

      const {
        partnerId,
        answers
      } = req.body;

      const id = Number(partnerId);

      if (id !== 1 && id !== 2) {
        return res.status(400).json({
          message: "Invalid Partner ID."
        });
      }

      if (
        !answers ||
        typeof answers !== "object" ||
        Array.isArray(answers)
      ) {
        return res.status(400).json({
          message: "Invalid answers."
        });
      }

      // Make sure all 20 questions are answered
      for (let i = 1; i <= 20; i++) {
        const questionId = `q${i}`;

        if (
          answers[questionId] === undefined ||
          answers[questionId] === null ||
          String(answers[questionId]).trim() === ""
        ) {
          return res.status(400).json({
            message: `Answer for ${questionId} is required.`
          });
        }
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/partners?couple_id=eq.${encodeFilter(
          coupleId
        )}&partner_number=eq.${id}`,
        {
          method: "PATCH",
          headers: supabaseHeaders({
            Prefer: "return=representation"
          }),
          body: JSON.stringify({
            actual_answers: answers,
            page4_completed: true,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        const errorText = await readSupabaseError(response);

        console.error(
          "Save Page 4 answers error:",
          errorText
        );

        return res.status(500).json({
          message: "Could not save Page 4 answers."
        });
      }

      const rows = await response.json();

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Partner not found."
        });
      }

      res.json({
        message: "Your answers have been saved ❤️",
        coupleId,
        partnerId: id,
        page4Completed: true
      });
    } catch (error) {
      console.error(
        "Save Page 4 answers error:",
        error
      );

      res.status(500).json({
        message: "Server error."
      });
    }
  }
);

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {
  console.log(
    `Magic Miracle Couple Quiz server is running on port ${PORT}`
  );

  if (checkSupabaseConfig()) {
    console.log(
      "Supabase environment configuration detected."
    );
  } else {
    console.log(
      "WARNING: Supabase environment variables are missing."
    );
  }
});
