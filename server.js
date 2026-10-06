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
      const errorText =
        await readSupabaseError(existingPartnerResponse);

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
        const errorText =
          await readSupabaseError(partnerResponse);

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
      const errorText =
        await readSupabaseError(updateResponse);

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
        const errorText =
          await readSupabaseError(coupleResponse);

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
        const errorText =
          await readSupabaseError(partnerResponse);

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
        const errorText =
          await readSupabaseError(response);

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
        const errorText =
          await readSupabaseError(response);

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
        answers,
        optionSets
      } = req.body;

      const id = Number(partnerId);

      if (id !== 1 && id !== 2) {
        return res.status(400).json({
          message: "Invalid Partner ID."
        });
      }

      if (!answers || typeof answers !== "object") {
        return res.status(400).json({
          message: "Answers are required."
        });
      }

      // Save this partner's actual answers
      const partnerResponse = await fetch(
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

      if (!partnerResponse.ok) {
        const errorText =
          await readSupabaseError(partnerResponse);

        console.error(
          "Save Page 4 answers error:",
          errorText
        );

        return res.status(500).json({
          message: "Could not save Page 4 answers."
        });
      }

      const partnerRows =
        await partnerResponse.json();

      if (partnerRows.length === 0) {
        return res.status(404).json({
          message: "Partner not found."
        });
      }

      // Get current couple option_sets
      const coupleReadResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/couples?id=eq.${encodeFilter(
          coupleId
        )}&select=option_sets&limit=1`,
        {
          headers: supabaseHeaders()
        }
      );

      if (!coupleReadResponse.ok) {
        const errorText =
          await readSupabaseError(coupleReadResponse);

        console.error(
          "Read option sets error:",
          errorText
        );

        return res.status(500).json({
          message: "Could not read option sets."
        });
      }

      const coupleRows =
        await coupleReadResponse.json();

      if (coupleRows.length === 0) {
        return res.status(404).json({
          message: "Couple not found."
        });
      }

      const currentOptionSets =
        coupleRows[0].option_sets || {};

      const updatedOptionSets = {
        ...currentOptionSets,
        [`partner${id}`]:
          optionSets && typeof optionSets === "object"
            ? optionSets
            : {}
      };

      const coupleUpdateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/couples?id=eq.${encodeFilter(
          coupleId
        )}`,
        {
          method: "PATCH",
          headers: supabaseHeaders({
            Prefer: "return=representation"
          }),
          body: JSON.stringify({
            option_sets: updatedOptionSets
          })
        }
      );

      if (!coupleUpdateResponse.ok) {
        const errorText =
          await readSupabaseError(coupleUpdateResponse);

        console.error(
          "Save option sets error:",
          errorText
        );

        return res.status(500).json({
          message: "Could not save Page 4 option sets."
        });
      }

      res.json({
        message:
          "Page 4 answers saved successfully ❤️",
        coupleId,
        partnerId: id,
        page4Completed: true
      });

    } catch (error) {
      console.error(
        "Save Page 4 error:",
        error
      );

      res.status(500).json({
        message: "Server error."
      });
    }
  }
);

// ======================================================
// GET PAGE 5 DATA
// ======================================================

app.get(
  "/api/couples/:coupleId/page5/:partnerId",
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

      const otherPartnerId =
        id === 1 ? 2 : 1;

      // Current partner
      const currentResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/partners?couple_id=eq.${encodeFilter(
          coupleId
        )}&partner_number=eq.${id}&select=*&limit=1`,
        {
          headers: supabaseHeaders()
        }
      );

      if (!currentResponse.ok) {
        const errorText =
          await readSupabaseError(currentResponse);

        console.error(
          "Page 5 current partner error:",
          errorText
        );

        return res.status(500).json({
          message:
            "Could not read current Partner."
        });
      }

      const currentRows =
        await currentResponse.json();

      if (currentRows.length === 0) {
        return res.status(404).json({
          message: "Current Partner not found."
        });
      }

      const currentPartner =
        currentRows[0];

      // Other partner
      const otherResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/partners?couple_id=eq.${encodeFilter(
          coupleId
        )}&partner_number=eq.${otherPartnerId}&select=*&limit=1`,
        {
          headers: supabaseHeaders()
        }
      );

      if (!otherResponse.ok) {
        const errorText =
          await readSupabaseError(otherResponse);

        console.error(
          "Page 5 other partner error:",
          errorText
        );

        return res.status(500).json({
          message:
            "Could not read the other Partner."
        });
      }

      const otherRows =
        await otherResponse.json();

      if (otherRows.length === 0) {
        return res.status(409).json({
          message:
            "Your partner has not connected yet."
        });
      }

      const otherPartner =
        otherRows[0];

      if (!otherPartner.page4_completed) {
        return res.status(409).json({
          message:
            "Your partner has not completed Page 4 yet."
        });
      }

      // Couple option sets
      const coupleResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/couples?id=eq.${encodeFilter(
          coupleId
        )}&select=option_sets&limit=1`,
        {
          headers: supabaseHeaders()
        }
      );

      if (!coupleResponse.ok) {
        const errorText =
          await readSupabaseError(coupleResponse);

        console.error(
          "Page 5 option sets error:",
          errorText
        );

        return res.status(500).json({
          message: "Could not read option sets."
        });
      }

      const coupleRows =
        await coupleResponse.json();

      if (coupleRows.length === 0) {
        return res.status(404).json({
          message: "Couple not found."
        });
      }

      const allOptionSets =
        coupleRows[0].option_sets || {};

      const partnerOptionSets =
        allOptionSets[
          `partner${otherPartnerId}`
        ] || {};

      // Question order
      let questionOrder =
        Array.isArray(currentPartner.question_order)
          ? currentPartner.question_order
          : [];

      const allQuestionIds =
        Array.from(
          { length: 20 },
          (_, index) => `q${index + 1}`
        );

      if (questionOrder.length !== 20) {
        questionOrder = [...allQuestionIds];

        for (
          let i = questionOrder.length - 1;
          i > 0;
          i--
        ) {
          const j =
            Math.floor(Math.random() * (i + 1));

          [
            questionOrder[i],
            questionOrder[j]
          ] = [
            questionOrder[j],
            questionOrder[i]
          ];
        }

        // Avoid original 1 -> 20 order
        const isOriginal =
          questionOrder.every(
            (q, index) =>
              q === allQuestionIds[index]
          );

        if (isOriginal) {
          [
            questionOrder[0],
            questionOrder[1]
          ] = [
            questionOrder[1],
            questionOrder[0]
          ];
        }

        const saveOrderResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/partners?couple_id=eq.${encodeFilter(
            coupleId
          )}&partner_number=eq.${id}`,
          {
            method: "PATCH",
            headers: supabaseHeaders(),
            body: JSON.stringify({
              question_order: questionOrder,
              updated_at:
                new Date().toISOString()
            })
          }
        );

        if (!saveOrderResponse.ok) {
          const errorText =
            await readSupabaseError(
              saveOrderResponse
            );

          console.error(
            "Save question order error:",
            errorText
          );

          return res.status(500).json({
            message:
              "Could not save question order."
          });
        }
      }

      res.json({
        coupleId,
        partnerId: id,
        targetPartnerId: otherPartnerId,
        questionOrder,
        optionSets: partnerOptionSets,
        guesses:
          currentPartner.guesses || {},
        page5Completed:
          Boolean(currentPartner.page5_completed)
      });

    } catch (error) {
      console.error(
        "Get Page 5 data error:",
        error
      );

      res.status(500).json({
        message: "Server error."
      });
    }
  }
);

// ======================================================
// SAVE PAGE 5 GUESSES
// ======================================================

app.post(
  "/api/couples/:coupleId/page5",
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
        guesses
      } = req.body;

      const id = Number(partnerId);

      if (id !== 1 && id !== 2) {
        return res.status(400).json({
          message: "Invalid Partner ID."
        });
      }

      if (!guesses || typeof guesses !== "object") {
        return res.status(400).json({
          message: "Guesses are required."
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
            guesses,
            page5_completed: true,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        const errorText =
          await readSupabaseError(response);

        console.error(
          "Save Page 5 guesses error:",
          errorText
        );

        return res.status(500).json({
          message:
            "Could not save Page 5 guesses."
        });
      }

      const rows = await response.json();

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Partner not found."
        });
      }

      res.json({
        message:
          "Partner Quiz completed successfully ❤️",
        coupleId,
        partnerId: id,
        page5Completed: true
      });

    } catch (error) {
      console.error(
        "Save Page 5 error:",
        error
      );

      res.status(500).json({
        message: "Server error."
      });
    }
  }
);

// ======================================================
// NORMALIZE ANSWERS FOR SCORE COMPARISON
// ======================================================

function normalizeAnswer(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// ======================================================
// GET RESULT
// ======================================================

app.get(
  "/api/couples/:coupleId/result",
  async (req, res) => {
    try {
      if (!checkSupabaseConfig()) {
        return res.status(500).json({
          message: "Supabase configuration is missing."
        });
      }

      const { coupleId } = req.params;

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/partners?couple_id=eq.${encodeFilter(
          coupleId
        )}&select=*&order=partner_number.asc`,
        {
          headers: supabaseHeaders()
        }
      );

      if (!response.ok) {
        const errorText =
          await readSupabaseError(response);

        console.error(
          "Result partner lookup error:",
          errorText
        );

        return res.status(500).json({
          message:
            "Could not read Partner results."
        });
      }

      const partners = await response.json();

      const partner1 = partners.find(
        (p) =>
          Number(p.partner_number) === 1
      );

      const partner2 = partners.find(
        (p) =>
          Number(p.partner_number) === 2
      );

      if (!partner1 || !partner2) {
        return res.status(409).json({
          message:
            "Both partners must be connected."
        });
      }

      if (
        !partner1.page4_completed ||
        !partner2.page4_completed
      ) {
        return res.status(409).json({
          message:
            "Both partners must complete Page 4."
        });
      }

      if (
        !partner1.page5_completed ||
        !partner2.page5_completed
      ) {
        return res.status(409).json({
          message:
            "Both partners must complete the Partner Quiz."
        });
      }

      const p1Actual =
        partner1.actual_answers || {};

      const p2Actual =
        partner2.actual_answers || {};

      const p1Guesses =
        partner1.guesses || {};

      const p2Guesses =
        partner2.guesses || {};

      const questionIds =
        Array.from(
          { length: 20 },
          (_, index) => `q${index + 1}`
        );

      let partner1Score = 0;
      let partner2Score = 0;

      const partner1Details = {};
      const partner2Details = {};

      for (const questionId of questionIds) {

        // Partner 1 guesses Partner 2 answers
        const p1Guess =
          normalizeAnswer(
            p1Guesses[questionId]
          );

        const p2Answer =
          normalizeAnswer(
            p2Actual[questionId]
          );

        const p1Correct =
          p1Guess !== "" &&
          p1Guess === p2Answer;

        if (p1Correct) {
          partner1Score++;
        }

        partner1Details[questionId] = {
          correct: p1Correct
        };

        // Partner 2 guesses Partner 1 answers
        const p2Guess =
          normalizeAnswer(
            p2Guesses[questionId]
          );

        const p1Answer =
          normalizeAnswer(
            p1Actual[questionId]
          );

        const p2Correct =
          p2Guess !== "" &&
          p2Guess === p1Answer;

        if (p2Correct) {
          partner2Score++;
        }

        partner2Details[questionId] = {
          correct: p2Correct
        };
      }

      const totalCorrect =
        partner1Score +
        partner2Score;

      const totalQuestions = 40;

      const percentage =
        Math.round(
          (totalCorrect / totalQuestions) *
          100
        );

      res.json({
        coupleId,

        partner1: {
          score: partner1Score,
          total: 20,
          percentage:
            Math.round(
              (partner1Score / 20) * 100
            ),
          details: partner1Details
        },

        partner2: {
          score: partner2Score,
          total: 20,
          percentage:
            Math.round(
              (partner2Score / 20) * 100
            ),
          details: partner2Details
        },

        combined: {
          score: totalCorrect,
          total: totalQuestions,
          percentage
        }
      });

    } catch (error) {
      console.error(
        "Result calculation error:",
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
