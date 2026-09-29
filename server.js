const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));


// ======================================================
// DATA
// ======================================================

const couples = new Map();


// ======================================================
// HELPER FUNCTIONS
// ======================================================

function getCouple(coupleId) {
  return couples.get(coupleId);
}


function validPartnerId(partnerId) {

  const id = Number(partnerId);

  if (id !== 1 && id !== 2) {
    return null;
  }

  return id;
}


function cleanAnswers(answers) {

  const result = {};

  for (let i = 1; i <= 20; i++) {

    const key = "q" + i;

    result[key] =
      String(answers?.[key] ?? "").trim();
  }

  return result;
}


// Capital / Simple letters do not matter
// Hasan = HASAN = hasan

function normalizeAnswer(value) {

  return String(value ?? "")
    .trim()
    .toLowerCase();
}


function compareAnswers(guess, actual) {

  let correct = 0;

  for (let i = 1; i <= 20; i++) {

    const key = "q" + i;

    const guessAnswer =
      normalizeAnswer(guess?.[key]);

    const actualAnswer =
      normalizeAnswer(actual?.[key]);

    if (
      guessAnswer &&
      actualAnswer &&
      guessAnswer === actualAnswer
    ) {
      correct++;
    }
  }

  return correct;
}


function scorePercent(correct) {

  return Math.round(
    (correct / 20) * 100
  );
}


// ======================================================
// CREATE COUPLE
// ======================================================

app.post(
  "/api/couples/create",
  async (req, res) => {

    try {

      const {
        username,
        password
      } = req.body;


      if (!username || !password) {

        return res.status(400).json({
          message:
            "Username and Password are required."
        });
      }


      const coupleId =
        crypto.randomUUID();


      const coupleCode =
        crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase();


      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );


      couples.set(
        coupleId,
        {

          coupleId,

          coupleCode,

          username:
            username.trim(),

          passwordHash,

          partners: 1,

          status:
            "Waiting for partner",


          // -----------------------------
          // PARTNER 1
          // -----------------------------

          partner1: {

            connected: true,

            language: null,

            gender: null,

            malePartnerName: "",

            femalePartnerName: "",


            // Page 4
            actualAnswers: null,


            // Page 5
            guesses: null,


            page4Completed: false,

            page5Completed: false

          },


          // -----------------------------
          // PARTNER 2
          // -----------------------------

          partner2: {

            connected: false,

            language: null,

            gender: null,

            malePartnerName: "",

            femalePartnerName: "",


            // Page 4
            actualAnswers: null,


            // Page 5
            guesses: null,


            page4Completed: false,

            page5Completed: false

          },


          createdAt:
            new Date().toISOString()

        }
      );


      res.status(201).json({

        message:
          "Couple Account created successfully ❤️",

        coupleId,

        coupleCode,

        username:
          username.trim(),

        partnerId: 1,

        status:
          "Waiting for partner"

      });

    }
    catch (error) {

      console.error(
        "CREATE COUPLE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error."
      });
    }
  }
);


// ======================================================
// JOIN COUPLE
// ======================================================

app.post(
  "/api/couples/join",
  (req, res) => {

    try {

      const {
        coupleCode
      } = req.body;


      if (!coupleCode) {

        return res.status(400).json({
          message:
            "Please enter your Couple Code."
        });
      }


      const code =
        coupleCode
          .trim()
          .toUpperCase();


      const couple =
        Array
          .from(couples.values())
          .find(
            item =>
              item.coupleCode === code
          );


      if (!couple) {

        return res.status(404).json({
          message:
            "Invalid Couple Code."
        });
      }


      if (couple.partners >= 2) {

        return res.status(403).json({
          message:
            "This Couple Account is already full."
        });
      }


      couple.partners = 2;

      couple.partner2.connected =
        true;

      couple.status =
        "Our Couple is Connected ❤️";


      res.json({

        message:
          "Our Couple is Connected ❤️",

        coupleId:
          couple.coupleId,

        coupleCode:
          couple.coupleCode,

        username:
          couple.username,

        partnerId: 2,

        status:
          couple.status

      });

    }
    catch (error) {

      console.error(
        "JOIN COUPLE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error."
      });
    }
  }
);


// ======================================================
// GET TOTAL COUPLES COUNT
// ======================================================

app.get(
  "/api/couples/count",
  (req, res) => {

    try {

      res.json({
        totalCouples:
          couples.size
      });

    }
    catch (error) {

      console.error(
        error
      );

      res.status(500).json({
        message:
          "Server error."
      });
    }
  }
);


// ======================================================
// GET COUPLE STATUS
// ======================================================

app.get(
  "/api/couples/:coupleId/status",
  (req, res) => {

    try {

      const {
        coupleId
      } = req.params;


      const couple =
        getCouple(coupleId);


      if (!couple) {

        return res.status(404).json({
          message:
            "Couple not found."
        });
      }


      res.json({

        coupleId:
          couple.coupleId,

        status:
          couple.status,

        partners:
          couple.partners,


        partner1: {

          connected:
            couple.partner1.connected,

          language:
            couple.partner1.language,

          gender:
            couple.partner1.gender

        },


        partner2: {

          connected:
            couple.partner2.connected,

          language:
            couple.partner2.language,

          gender:
            couple.partner2.gender

        }

      });

    }
    catch (error) {

      console.error(
        error
      );

      res.status(500).json({
        message:
          "Server error."
      });
    }
  }
);


// ======================================================
// SAVE PARTNER PROFILE
// ======================================================

app.post(
  "/api/couples/:coupleId/profile",
  (req, res) => {

    try {

      const {
        coupleId
      } = req.params;


      const {

        partnerId,

        language,

        gender,

        malePartnerName,

        femalePartnerName

      } = req.body;


      const couple =
        getCouple(coupleId);


      if (!couple) {

        return res.status(404).json({
          message:
            "Couple not found."
        });
      }


      const id =
        validPartnerId(
          partnerId
        );


      if (!id) {

        return res.status(400).json({
          message:
            "Invalid Partner ID."
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


      if (
        !allowedLanguages.includes(
          language
        )
      ) {

        return res.status(400).json({
          message:
            "Invalid language."
        });
      }


      if (
        !allowedGenders.includes(
          gender
        )
      ) {

        return res.status(400).json({
          message:
            "Invalid gender."
        });
      }


      if (
        !malePartnerName ||
        !femalePartnerName
      ) {

        return res.status(400).json({
          message:
            "Both partner names are required."
        });
      }


      const partner =
        id === 1
          ? couple.partner1
          : couple.partner2;


      partner.language =
        language;

      partner.gender =
        gender;

      partner.malePartnerName =
        malePartnerName.trim();

      partner.femalePartnerName =
        femalePartnerName.trim();


      res.json({

        message:
          "Partner profile saved successfully ❤️",

        coupleId:
          couple.coupleId,

        partnerId:
          id,

        profile: {

          language:
            partner.language,

          gender:
            partner.gender,

          malePartnerName:
            partner.malePartnerName,

          femalePartnerName:
            partner.femalePartnerName

        }

      });

    }
    catch (error) {

      console.error(
        "PROFILE SAVE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error."
      });
    }
  }
);


// ======================================================
// GET PARTNER PROFILE
// ======================================================

app.get(
  "/api/couples/:coupleId/profile/:partnerId",
  (req, res) => {

    try {

      const {
        coupleId,
        partnerId
      } = req.params;


      const couple =
        getCouple(coupleId);


      if (!couple) {

        return res.status(404).json({
          message:
            "Couple not found."
        });
      }


      const id =
        validPartnerId(
          partnerId
        );


      if (!id) {

        return res.status(400).json({
          message:
            "Invalid Partner ID."
        });
      }


      const partner =
        id === 1
          ? couple.partner1
          : couple.partner2;


      res.json({

        partnerId:
          id,

        connected:
          partner.connected,

        language:
          partner.language,

        gender:
          partner.gender,

        malePartnerName:
          partner.malePartnerName,

        femalePartnerName:
          partner.femalePartnerName

      });

    }
    catch (error) {

      console.error(
        error
      );

      res.status(500).json({
        message:
          "Server error."
      });
    }
  }
);


// ======================================================
// PAGE 4
// SAVE ACTUAL ANSWERS
// ======================================================

app.post(
  "/api/couples/:coupleId/quiz/actual",
  (req, res) => {

    try {

      const {
        coupleId
      } = req.params;


      const {
        partnerId,
        answers
      } = req.body;


      const couple =
        getCouple(coupleId);


      if (!couple) {

        return res.status(404).json({
          message:
            "Couple not found."
        });
      }


      const id =
        validPartnerId(
          partnerId
        );


      if (!id) {

        return res.status(400).json({
          message:
            "Invalid Partner ID."
        });
      }


      if (
        !answers ||
        typeof answers !== "object"
      ) {

        return res.status(400).json({
          message:
            "Answers are required."
        });
      }


      const partner =
        id === 1
          ? couple.partner1
          : couple.partner2;


      partner.actualAnswers =
        cleanAnswers(
          answers
        );


      partner.page4Completed =
        true;


      res.json({

        message:
          "Page 4 answers saved successfully ❤️",

        coupleId,

        partnerId:
          id,

        page4Completed:
          true

      });

    }
    catch (error) {

      console.error(
        "PAGE 4 SAVE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error."
      });
    }
  }
);


// ======================================================
// PAGE 5
// SAVE PARTNER GUESSES
// ======================================================

app.post(
  "/api/couples/:coupleId/quiz/guesses",
  (req, res) => {

    try {

      const {
        coupleId
      } = req.params;


      const {
        partnerId,
        guesses
      } = req.body;


      const couple =
        getCouple(coupleId);


      if (!couple) {

        return res.status(404).json({
          message:
            "Couple not found."
        });
      }


      const id =
        validPartnerId(
          partnerId
        );


      if (!id) {

        return res.status(400).json({
          message:
            "Invalid Partner ID."
        });
      }


      if (
        !guesses ||
        typeof guesses !== "object"
      ) {

        return res.status(400).json({
          message:
            "Guesses are required."
        });
      }


      const partner =
        id === 1
          ? couple.partner1
          : couple.partner2;


      partner.guesses =
        cleanAnswers(
          guesses
        );


      partner.page5Completed =
        true;


      res.json({

        message:
          "Page 5 guesses saved successfully ❤️",

        coupleId,

        partnerId:
          id,

        page5Completed:
          true

      });

    }
    catch (error) {

      console.error(
        "PAGE 5 SAVE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error."
      });
    }
  }
);


// ======================================================
// QUIZ RESULT
// PAGE 6 USES THIS
// ======================================================

app.get(
  "/api/couples/:coupleId/quiz-result",
  (req, res) => {

    try {

      const {
        coupleId
      } = req.params;


      const couple =
        getCouple(coupleId);


      if (!couple) {

        return res.status(404).json({
          message:
            "Couple not found."
        });
      }


      const p1 =
        couple.partner1;

      const p2 =
        couple.partner2;


      const bothCompleted =
        Boolean(

          p1.page4Completed &&

          p2.page4Completed &&

          p1.page5Completed &&

          p2.page5Completed &&

          p1.actualAnswers &&

          p2.actualAnswers &&

          p1.guesses &&

          p2.guesses

        );


      // -----------------------------------
      // IF ONE PARTNER IS STILL NOT DONE
      // -----------------------------------

      if (!bothCompleted) {

        return res.json({

          bothCompleted:
            false,

          partner1Completed:
            Boolean(
              p1.page5Completed
            ),

          partner2Completed:
            Boolean(
              p2.page5Completed
            ),

          message:
            "Waiting for both partners to finish ❤️"

        });
      }


      // -----------------------------------
      // REAL SCORE
      // -----------------------------------

      // Partner 1 guesses
      // VS Partner 2 actual answers

      const partner1Correct =
        compareAnswers(
          p1.guesses,
          p2.actualAnswers
        );


      // Partner 2 guesses
      // VS Partner 1 actual answers

      const partner2Correct =
        compareAnswers(
          p2.guesses,
          p1.actualAnswers
        );


      const partner1Score =
        scorePercent(
          partner1Correct
        );


      const partner2Score =
        scorePercent(
          partner2Correct
        );


      const overallScore =
        Math.round(
          (
            (
              partner1Score +
              partner2Score
            ) / 2
          ) * 10
        ) / 10;


      // -----------------------------------
      // NAMES
      // -----------------------------------

      const maleName =

        p1.malePartnerName ||

        p2.malePartnerName ||

        "Partner 1";


      const femaleName =

        p1.femalePartnerName ||

        p2.femalePartnerName ||

        "Partner 2";


      // -----------------------------------
      // SEND RESULT TO PAGE 6
      // -----------------------------------

      res.json({

        bothCompleted:
          true,


        maleName,

        femaleName,


        partner1Actual:
          p1.actualAnswers,

        partner2Actual:
          p2.actualAnswers,


        partner1Guesses:
          p1.guesses,

        partner2Guesses:
          p2.guesses,


        partner1Correct,

        partner2Correct,


        partner1Score,

        partner2Score,

        overallScore

      });

    }
    catch (error) {

      console.error(
        "QUIZ RESULT ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error."
      });
    }
  }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  () => {

    console.log(
      `Magic Miracle Couple Quiz server is running on http://localhost:${PORT}`
    );

  }
);