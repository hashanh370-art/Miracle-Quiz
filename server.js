const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const couples = new Map();


// ==========================================
// CREATE COUPLE
// ==========================================

app.post("/api/couples/create", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and Password are required."
      });
    }

    const coupleId = crypto.randomUUID();

    const coupleCode = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

    const passwordHash = await bcrypt.hash(password, 10);

    couples.set(coupleId, {
      coupleId,
      coupleCode,
      username,
      passwordHash,

      partners: 1,

      status: "Waiting for partner",

      partner1: {
        connected: true,
        language: null,
        gender: null,
        malePartnerName: "",
        femalePartnerName: ""
      },

      partner2: {
        connected: false,
        language: null,
        gender: null,
        malePartnerName: "",
        femalePartnerName: ""
      },

      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      message: "Couple Account created successfully ❤️",
      coupleId,
      coupleCode,
      username,
      partnerId: 1,
      status: "Waiting for partner"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error."
    });
  }
});


// ==========================================
// JOIN COUPLE
// ==========================================

app.post("/api/couples/join", (req, res) => {
  try {
    const { coupleCode } = req.body;

    if (!coupleCode) {
      return res.status(400).json({
        message: "Please enter your Couple Code."
      });
    }

    const couple = Array.from(couples.values()).find(
      (item) =>
        item.coupleCode === coupleCode.trim().toUpperCase()
    );

    if (!couple) {
      return res.status(404).json({
        message: "Invalid Couple Code."
      });
    }

    if (couple.partners >= 2) {
      return res.status(403).json({
        message: "This Couple Account is already full."
      });
    }

    couple.partners = 2;
    couple.partner2.connected = true;
    couple.status = "Our Couple is Connected ❤️";

    res.json({
      message: "Our Couple is Connected ❤️",
      coupleId: couple.coupleId,
      coupleCode: couple.coupleCode,
      username: couple.username,
      partnerId: 2,
      status: couple.status
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error."
    });
  }
});


// ==========================================
// GET TOTAL COUPLES COUNT
// ==========================================

app.get("/api/couples/count", (req, res) => {
  try {
    res.json({
      totalCouples: couples.size
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error."
    });
  }
});


// ==========================================
// GET COUPLE STATUS
// ==========================================

app.get("/api/couples/:coupleId/status", (req, res) => {
  try {
    const { coupleId } = req.params;

    const couple = couples.get(coupleId);

    if (!couple) {
      return res.status(404).json({
        message: "Couple not found."
      });
    }

    res.json({
      coupleId: couple.coupleId,
      status: couple.status,
      partners: couple.partners,

      partner1: {
        connected: couple.partner1.connected,
        language: couple.partner1.language,
        gender: couple.partner1.gender
      },

      partner2: {
        connected: couple.partner2.connected,
        language: couple.partner2.language,
        gender: couple.partner2.gender
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error."
    });
  }
});


// ==========================================
// SAVE PARTNER PROFILE
// ==========================================

app.post("/api/couples/:coupleId/profile", (req, res) => {
  try {
    const { coupleId } = req.params;

    const {
      partnerId,
      language,
      gender,
      malePartnerName,
      femalePartnerName
    } = req.body;

    const couple = couples.get(coupleId);

    if (!couple) {
      return res.status(404).json({
        message: "Couple not found."
      });
    }

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

    const partner =
      id === 1
        ? couple.partner1
        : couple.partner2;

    partner.language = language;
    partner.gender = gender;

    partner.malePartnerName =
      malePartnerName.trim();

    partner.femalePartnerName =
      femalePartnerName.trim();

    res.json({
      message: "Partner profile saved successfully ❤️",

      coupleId: couple.coupleId,

      partnerId: id,

      profile: {
        language: partner.language,
        gender: partner.gender,
        malePartnerName: partner.malePartnerName,
        femalePartnerName: partner.femalePartnerName
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error."
    });
  }
});


// ==========================================
// GET PARTNER PROFILE
// ==========================================

app.get(
  "/api/couples/:coupleId/profile/:partnerId",
  (req, res) => {

    try {
      const { coupleId, partnerId } = req.params;

      const couple = couples.get(coupleId);

      if (!couple) {
        return res.status(404).json({
          message: "Couple not found."
        });
      }

      const id = Number(partnerId);

      if (id !== 1 && id !== 2) {
        return res.status(400).json({
          message: "Invalid Partner ID."
        });
      }

      const partner =
        id === 1
          ? couple.partner1
          : couple.partner2;

      res.json({
        partnerId: id,
        connected: partner.connected,
        language: partner.language,
        gender: partner.gender,
        malePartnerName: partner.malePartnerName,
        femalePartnerName: partner.femalePartnerName
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error."
      });
    }
  }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Magic Miracle Couple Quiz server is running on http://localhost:${PORT}`
  );
});