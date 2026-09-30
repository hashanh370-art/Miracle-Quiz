const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const couples = new Map();

const optionPools = {
    q4: [
        ["Mango", "images/mango.jpg"],
        ["Apple", "images/apple.jpg"],
        ["Orange", "images/orange.jpg"],
        ["Grapes", "images/grapes.jpg"],
        ["Pineapple", "images/pineapple.jpg"],
        ["Watermelon", "images/watermelon.jpg"],
        ["Strawberry", "images/strawberry.jpg"],
        ["Banana", "images/banana.jpg"]
    ],
    q5: [
        ["Pizza", "images/pizza.jpg"],
        ["Burger", "images/burger.jpg"],
        ["Rice", "images/rice.jpg"],
        ["Noodles", "images/noodles.jpg"],
        ["Kottu", "images/kottu.jpg"],
        ["Pasta", "images/pasta.jpg"],
        ["Chicken", "images/chicken.jpg"],
        ["Seafood", "images/seafood.jpg"]
    ],
    q6: [
        ["Tea", "images/tea.jpg"],
        ["Coffee", "images/coffee.jpg"],
        ["Juice", "images/juice.jpg"],
        ["Soft Drink", "images/softdrink.jpg"],
        ["Milkshake", "images/milkshake.jpg"],
        ["Water", "images/water.jpg"],
        ["Chocolate Drink", "images/chocolate-drink.jpg"],
        ["Fruit Smoothie", "images/smoothie.jpg"]
    ],
    q7: [
        ["Beach", "images/beach.jpg"],
        ["Restaurant", "images/restaurant.jpg"],
        ["Cinema", "images/cinema.jpg"],
        ["Park", "images/park.jpg"],
        ["Mountain", "images/mountain.jpg"],
        ["Hotel", "images/hotel.jpg"],
        ["Cafe", "images/cafe.jpg"],
        ["Waterfall", "images/waterfall.jpg"]
    ],
    q8: [
        ["Sunny", "images/sunny.jpg"],
        ["Rainy", "images/rainy.jpg"],
        ["Cloudy", "images/cloudy.jpg"],
        ["Cool", "images/cool.jpg"],
        ["Snowy", "images/snowy.jpg"],
        ["Windy", "images/windy.jpg"],
        ["Sunset", "images/sunset.jpg"],
        ["Night", "images/night.jpg"]
    ],
    q9: [
        ["Dog", "images/dog.jpg"],
        ["Cat", "images/cat.jpg"],
        ["Bird", "images/bird.jpg"],
        ["Rabbit", "images/rabbit.jpg"],
        ["Fish", "images/fish.jpg"],
        ["Hamster", "images/hamster.jpg"],
        ["Parrot", "images/parrot.jpg"],
        ["Turtle", "images/turtle.jpg"]
    ],
    q10: [
        ["Rose", "images/rose.jpg"],
        ["Sunflower", "images/sunflower.jpg"],
        ["Lotus", "images/lotus.jpg"],
        ["Lily", "images/lily.jpg"],
        ["Tulip", "images/tulip.jpg"],
        ["Orchid", "images/orchid.jpg"],
        ["Jasmine", "images/jasmine.jpg"],
        ["Daisy", "images/daisy.jpg"]
    ],
    q11: [
        ["Red", "images/red.jpg"],
        ["Blue", "images/blue.jpg"],
        ["Black", "images/black.jpg"],
        ["White", "images/white.jpg"],
        ["Pink", "images/pink.jpg"],
        ["Purple", "images/purple.jpg"],
        ["Green", "images/green.jpg"],
        ["Yellow", "images/yellow.jpg"]
    ],
    q12: [
        ["Romance", "images/romance.jpg"],
        ["Comedy", "images/comedy.jpg"],
        ["Action", "images/action.jpg"],
        ["Horror", "images/horror.jpg"],
        ["Adventure", "images/adventure.jpg"],
        ["Animation", "images/animation.jpg"],
        ["Mystery", "images/mystery.jpg"],
        ["Drama", "images/drama.jpg"]
    ],
    q13: [
        ["Stay Home", "images/stay-home.jpg"],
        ["Travel", "images/travel.jpg"],
        ["Shopping", "images/shopping.jpg"],
        ["Meet Friends", "images/friends.jpg"],
        ["Watch Movies", "images/watch-movie.jpg"],
        ["Go to Beach", "images/beach-day.jpg"],
        ["Sleep", "images/sleep.jpg"],
        ["Play Games", "images/games.jpg"]
    ],
    q14: [
        ["Flowers", "images/gift-flowers.jpg"],
        ["Chocolate", "images/chocolate.jpg"],
        ["Perfume", "images/perfume.jpg"],
        ["Clothes", "images/clothes.jpg"],
        ["Jewelry", "images/jewelry.jpg"],
        ["Teddy Bear", "images/teddy.jpg"],
        ["Phone", "images/phone.jpg"],
        ["Surprise Date", "images/surprise-date.jpg"]
    ],
    q15: [
        ["Beach Trip", "images/trip-beach.jpg"],
        ["Mountain Trip", "images/trip-mountain.jpg"],
        ["City Trip", "images/trip-city.jpg"],
        ["Nature Trip", "images/trip-nature.jpg"],
        ["Camping", "images/camping.jpg"],
        ["Road Trip", "images/roadtrip.jpg"],
        ["Luxury Hotel", "images/luxury-hotel.jpg"],
        ["Foreign Trip", "images/foreign-trip.jpg"]
    ],
    q16: [
        ["Dinner Date", "images/dinner-date.jpg"],
        ["Long Drive", "images/long-drive.jpg"],
        ["Beach Walk", "images/beach-walk.jpg"],
        ["Movie Night", "images/movie-night.jpg"],
        ["Cooking Together", "images/cooking.jpg"],
        ["Travel Together", "images/travel-together.jpg"],
        ["Coffee Date", "images/coffee-date.jpg"],
        ["Sunset Date", "images/sunset-date.jpg"]
    ],
    q17: [
        ["Ice Cream", "images/icecream.jpg"],
        ["Cake", "images/cake.jpg"],
        ["Chocolate", "images/dessert-chocolate.jpg"],
        ["Donut", "images/donut.jpg"],
        ["Pudding", "images/pudding.jpg"],
        ["Cupcake", "images/cupcake.jpg"],
        ["Fruit Salad", "images/fruit-salad.jpg"],
        ["Waffle", "images/waffle.jpg"]
    ],
    q18: [
        ["iPhone", "images/iphone.jpg"],
        ["Samsung", "images/samsung.jpg"],
        ["Google Pixel", "images/google-pixel.jpg"],
        ["Xiaomi", "images/xiaomi.jpg"],
        ["Vivo", "images/vivo.jpg"],
        ["OPPO", "images/oppo.jpg"],
        ["OnePlus", "images/oneplus.jpg"],
        ["Sony", "images/sony.jpg"]
    ],
    q19: [
        ["Facebook", "images/facebook.jpg"],
        ["TikTok", "images/tiktok.jpg"],
        ["Instagram", "images/instagram.jpg"],
        ["YouTube", "images/youtube.jpg"],
        ["WhatsApp", "images/whatsapp.jpg"],
        ["Snapchat", "images/snapchat.jpg"],
        ["X", "images/x.jpg"],
        ["Telegram", "images/telegram.jpg"]
    ],
    q20: [
        ["Happy Family", "images/happy-family.jpg"],
        ["Travel World", "images/world-travel.jpg"],
        ["Dream Home", "images/dream-home.jpg"],
        ["Successful Career", "images/career.jpg"],
        ["Own Business", "images/business.jpg"],
        ["Peaceful Life", "images/peaceful-life.jpg"],
        ["Luxury Life", "images/luxury-life.jpg"],
        ["Adventure Life", "images/adventure-life.jpg"]
    ]
};

function getCouple(coupleId) {
    return couples.get(coupleId);
}

function validPartnerId(partnerId) {
    const id = Number(partnerId);
    return id === 1 || id === 2 ? id : null;
}

function cleanAnswers(answers) {
    const result = {};

    for (let i = 1; i <= 20; i++) {
        const key = "q" + i;
        result[key] = String(answers?.[key] ?? "").trim();
    }

    return result;
}

function normalizeAnswer(value) {
    return String(value ?? "").trim().toLowerCase();
}

function compareAnswers(guess, actual) {
    let correct = 0;

    for (let i = 1; i <= 20; i++) {
        const key = "q" + i;

        if (
            normalizeAnswer(guess?.[key]) &&
            normalizeAnswer(guess?.[key]) ===
                normalizeAnswer(actual?.[key])
        ) {
            correct++;
        }
    }

    return correct;
}

function scorePercent(correct) {
    return Math.round((correct / 20) * 100);
}

function shuffleArray(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function createSharedOptionSets() {
    const optionSets = {};

    for (const questionId of Object.keys(optionPools)) {
        optionSets[questionId] =
            shuffleArray(optionPools[questionId]).slice(0, 4);
    }

    return optionSets;
}

// CREATE COUPLE
app.post("/api/couples/create", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and Password are required."
            });
        }

        const coupleId = crypto.randomUUID();
        const coupleCode =
            crypto.randomBytes(4).toString("hex").toUpperCase();

        const passwordHash = await bcrypt.hash(password, 10);

        couples.set(coupleId, {
            coupleId,
            coupleCode,
            username: username.trim(),
            passwordHash,
            partners: 1,
            status: "Waiting for partner",
            optionSets: createSharedOptionSets(),

            partner1: {
                connected: true,
                language: null,
                gender: null,
                malePartnerName: "",
                femalePartnerName: "",
                actualAnswers: null,
                guesses: null,
                page4Completed: false,
                page5Completed: false
            },

            partner2: {
                connected: false,
                language: null,
                gender: null,
                malePartnerName: "",
                femalePartnerName: "",
                actualAnswers: null,
                guesses: null,
                page4Completed: false,
                page5Completed: false
            },

            createdAt: new Date().toISOString()
        });

        res.status(201).json({
            message: "Couple Account created successfully ❤️",
            coupleId,
            coupleCode,
            username: username.trim(),
            partnerId: 1,
            status: "Waiting for partner"
        });

    } catch (error) {
        console.error("CREATE COUPLE ERROR:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});

// JOIN COUPLE
app.post("/api/couples/join", (req, res) => {
    try {
        const { coupleCode } = req.body;

        if (!coupleCode) {
            return res.status(400).json({
                message: "Please enter your Couple Code."
            });
        }

        const code = coupleCode.trim().toUpperCase();

        const couple = Array.from(couples.values()).find(
            item => item.coupleCode === code
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
        console.error("JOIN COUPLE ERROR:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});

// COUPLE COUNT
app.get("/api/couples/count", (req, res) => {
    res.json({
        totalCouples: couples.size
    });
});

// CONNECTION STATUS
app.get("/api/couples/:coupleId/status", (req, res) => {
    try {
        const couple = getCouple(req.params.coupleId);

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
        console.error("STATUS ERROR:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});

// SAVE PROFILE
app.post("/api/couples/:coupleId/profile", (req, res) => {
    try {
        const couple = getCouple(req.params.coupleId);

        const {
            partnerId,
            language,
            gender,
            malePartnerName,
            femalePartnerName
        } = req.body;

        if (!couple) {
            return res.status(404).json({
                message: "Couple not found."
            });
        }

        const id = validPartnerId(partnerId);

        if (!id) {
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
            message:
                "Partner profile saved successfully ❤️",

            coupleId: couple.coupleId,
            partnerId: id,

            profile: {
                language: partner.language,
                gender: partner.gender,
                malePartnerName:
                    partner.malePartnerName,
                femalePartnerName:
                    partner.femalePartnerName
            }
        });

    } catch (error) {
        console.error(
            "PROFILE SAVE ERROR:",
            error
        );

        res.status(500).json({
            message: "Server error."
        });
    }
});

// GET PROFILE
app.get(
    "/api/couples/:coupleId/profile/:partnerId",
    (req, res) => {
        try {
            const couple =
                getCouple(req.params.coupleId);

            if (!couple) {
                return res.status(404).json({
                    message: "Couple not found."
                });
            }

            const id =
                validPartnerId(
                    req.params.partnerId
                );

            if (!id) {
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
                malePartnerName:
                    partner.malePartnerName,
                femalePartnerName:
                    partner.femalePartnerName
            });

        } catch (error) {
            console.error(
                "GET PROFILE ERROR:",
                error
            );

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);

// GET QUIZ OPTIONS
app.get(
    "/api/couples/:coupleId/quiz/options",
    (req, res) => {
        try {
            const couple =
                getCouple(req.params.coupleId);

            if (!couple) {
                return res.status(404).json({
                    message: "Couple not found."
                });
            }

            res.json({
                coupleId: couple.coupleId,
                optionSets: couple.optionSets
            });

        } catch (error) {
            console.error(
                "GET QUIZ OPTIONS ERROR:",
                error
            );

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);

// SAVE PAGE 4 ACTUAL ANSWERS
app.post(
    "/api/couples/:coupleId/quiz/actual",
    (req, res) => {
        try {
            const couple =
                getCouple(req.params.coupleId);

            const {
                partnerId,
                answers
            } = req.body;

            if (!couple) {
                return res.status(404).json({
                    message: "Couple not found."
                });
            }

            const id =
                validPartnerId(partnerId);

            if (!id) {
                return res.status(400).json({
                    message: "Invalid Partner ID."
                });
            }

            if (
                !answers ||
                typeof answers !== "object"
            ) {
                return res.status(400).json({
                    message: "Answers are required."
                });
            }

            const partner =
                id === 1
                    ? couple.partner1
                    : couple.partner2;

            partner.actualAnswers =
                cleanAnswers(answers);

            partner.page4Completed = true;

            console.log(
                "PAGE 4 SAVED:",
                couple.coupleId,
                "Partner:",
                id
            );

            res.json({
                message:
                    "Page 4 answers saved successfully ❤️",

                coupleId: couple.coupleId,
                partnerId: id,
                page4Completed: true
            });

        } catch (error) {
            console.error(
                "PAGE 4 SAVE ERROR:",
                error
            );

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);

// SAVE PAGE 5 GUESSES
app.post(
    "/api/couples/:coupleId/quiz/guesses",
    (req, res) => {
        try {
            const couple =
                getCouple(req.params.coupleId);

            const {
                partnerId,
                guesses
            } = req.body;

            if (!couple) {
                return res.status(404).json({
                    message: "Couple not found."
                });
            }

            const id =
                validPartnerId(partnerId);

            if (!id) {
                return res.status(400).json({
                    message: "Invalid Partner ID."
                });
            }

            if (
                !guesses ||
                typeof guesses !== "object"
            ) {
                return res.status(400).json({
                    message: "Guesses are required."
                });
            }

            const partner =
                id === 1
                    ? couple.partner1
                    : couple.partner2;

            partner.guesses =
                cleanAnswers(guesses);

            partner.page5Completed = true;

            console.log(
                "PAGE 5 GUESSES SAVED:",
                couple.coupleId,
                "Partner:",
                id
            );

            res.json({
                message:
                    "Page 5 guesses saved successfully ❤️",

                coupleId: couple.coupleId,
                partnerId: id,
                page5Completed: true
            });

        } catch (error) {
            console.error(
                "PAGE 5 SAVE ERROR:",
                error
            );

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);

// QUIZ RESULT
app.get(
    "/api/couples/:coupleId/quiz-result",
    (req, res) => {
        try {
            const couple =
                getCouple(req.params.coupleId);

            if (!couple) {
                return res.status(404).json({
                    message: "Couple not found."
                });
            }

            const p1 = couple.partner1;
            const p2 = couple.partner2;

            const bothCompleted = Boolean(
                p1.page4Completed &&
                p2.page4Completed &&
                p1.page5Completed &&
                p2.page5Completed &&
                p1.actualAnswers &&
                p2.actualAnswers &&
                p1.guesses &&
                p2.guesses
            );

            if (!bothCompleted) {
                return res.json({
                    bothCompleted: false,

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

            const partner1Correct =
                compareAnswers(
                    p1.guesses,
                    p2.actualAnswers
                );

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

            const maleName =
                p1.malePartnerName ||
                p2.malePartnerName ||
                "Partner 1";

            const femaleName =
                p1.femalePartnerName ||
                p2.femalePartnerName ||
                "Partner 2";

            res.json({
                bothCompleted: true,

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

        } catch (error) {
            console.error(
                "QUIZ RESULT ERROR:",
                error
            );

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);

// START SERVER
app.listen(PORT, () => {
    console.log(
        `Magic Miracle Couple Quiz server is running on http://localhost:${PORT}`
    );
});