require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env");
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

app.use(express.json());
app.use(express.static(__dirname));

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

function createQuestionOrder() {
    return shuffleArray(
        Array.from({ length: 20 }, (_, index) => "q" + (index + 1))
    );
}

async function getCouple(coupleId) {
    const { data, error } = await supabase
        .from("couples")
        .select("*")
        .eq("id", coupleId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

async function getPartner(coupleId, partnerNumber) {
    const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("couple_id", coupleId)
        .eq("partner_number", partnerNumber)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

async function getBothPartners(coupleId) {
    const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("couple_id", coupleId)
        .order("partner_number", { ascending: true });

    if (error) {
        throw error;
    }

    const partner1 =
        data.find(item => item.partner_number === 1) || null;

    const partner2 =
        data.find(item => item.partner_number === 2) || null;

    return {
        partner1,
        partner2
    };
}

function partnerResponse(partner) {
    return {
        connected: Boolean(partner?.connected),
        language: partner?.language ?? null,
        gender: partner?.gender ?? null
    };
}

app.post("/api/couples/create", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and Password are required."
            });
        }

        const cleanUsername = username.trim();

        if (!cleanUsername) {
            return res.status(400).json({
                message: "Username and Password are required."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        let coupleCode;
        let codeAvailable = false;

        while (!codeAvailable) {
            coupleCode =
                crypto.randomBytes(4).toString("hex").toUpperCase();

            const { data, error } = await supabase
                .from("couples")
                .select("id")
                .eq("couple_code", coupleCode)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!data) {
                codeAvailable = true;
            }
        }

        const optionSets = createSharedOptionSets();

        const { data: couple, error: coupleError } = await supabase
            .from("couples")
            .insert({
                couple_code: coupleCode,
                username: cleanUsername,
                password_hash: passwordHash,
                partners: 1,
                status: "Waiting for partner",
                option_sets: optionSets
            })
            .select()
            .single();

        if (coupleError) {
            if (coupleError.code === "23505") {
                return res.status(409).json({
                    message: "Username already exists."
                });
            }

            throw coupleError;
        }

        const { error: partnerError } = await supabase
            .from("partners")
            .insert({
                couple_id: couple.id,
                partner_number: 1,
                connected: true,
                language: null,
                gender: null,
                male_partner_name: "",
                female_partner_name: "",
                actual_answers: null,
                guesses: null,
                page4_completed: false,
                page5_completed: false,
                question_order: createQuestionOrder()
            });

        if (partnerError) {
            await supabase
                .from("couples")
                .delete()
                .eq("id", couple.id);

            throw partnerError;
        }

        res.status(201).json({
            message: "Couple Account created successfully ❤️",
            coupleId: couple.id,
            coupleCode: couple.couple_code,
            username: couple.username,
            partnerId: 1,
            status: couple.status
        });

    } catch (error) {
        console.error("CREATE COUPLE ERROR:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});

app.post("/api/couples/join", async (req, res) => {
    try {
        const { coupleCode } = req.body;

        if (!coupleCode) {
            return res.status(400).json({
                message: "Please enter your Couple Code."
            });
        }

        const code = coupleCode.trim().toUpperCase();

        const { data: couple, error } = await supabase
            .from("couples")
            .select("*")
            .eq("couple_code", code)
            .maybeSingle();

        if (error) {
            throw error;
        }

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

        const existingPartner2 =
            await getPartner(couple.id, 2);

        if (existingPartner2) {
            return res.status(403).json({
                message: "This Couple Account is already full."
            });
        }

        const { error: partnerError } = await supabase
            .from("partners")
            .insert({
                couple_id: couple.id,
                partner_number: 2,
                connected: true,
                language: null,
                gender: null,
                male_partner_name: "",
                female_partner_name: "",
                actual_answers: null,
                guesses: null,
                page4_completed: false,
                page5_completed: false,
                question_order: createQuestionOrder()
            });

        if (partnerError) {
            if (partnerError.code === "23505") {
                return res.status(403).json({
                    message: "This Couple Account is already full."
                });
            }

            throw partnerError;
        }

        const { data: updatedCouple, error: updateError } =
            await supabase
                .from("couples")
                .update({
                    partners: 2,
                    status: "Our Couple is Connected ❤️"
                })
                .eq("id", couple.id)
                .select()
                .single();

        if (updateError) {
            throw updateError;
        }

        res.json({
            message: "Our Couple is Connected ❤️",
            coupleId: updatedCouple.id,
            coupleCode: updatedCouple.couple_code,
            username: updatedCouple.username,
            partnerId: 2,
            status: updatedCouple.status
        });

    } catch (error) {
        console.error("JOIN COUPLE ERROR:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});

app.get("/api/couples/count", async (req, res) => {
    try {
        const { count, error } = await supabase
            .from("couples")
            .select("*", {
                count: "exact",
                head: true
            });

        if (error) {
            throw error;
        }

        res.json({
            totalCouples: count || 0
        });

    } catch (error) {
        console.error("COUPLE COUNT ERROR:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});

app.get("/api/couples/:coupleId/status", async (req, res) => {
    try {
        const couple =
            await getCouple(req.params.coupleId);

        if (!couple) {
            return res.status(404).json({
                message: "Couple not found."
            });
        }

        const {
            partner1,
            partner2
        } = await getBothPartners(couple.id);

        res.json({
            coupleId: couple.id,
            status: couple.status,
            partners: couple.partners,

            partner1: partnerResponse(partner1),

            partner2: partnerResponse(partner2)
        });

    } catch (error) {
        console.error("STATUS ERROR:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});

app.post("/api/couples/:coupleId/profile", async (req, res) => {
    try {
        const couple =
            await getCouple(req.params.coupleId);

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
            await getPartner(couple.id, id);

        if (!partner) {
            return res.status(404).json({
                message: "Partner not found."
            });
        }

        const { data: updatedPartner, error } =
            await supabase
                .from("partners")
                .update({
                    language,
                    gender,
                    male_partner_name:
                        malePartnerName.trim(),
                    female_partner_name:
                        femalePartnerName.trim()
                })
                .eq("couple_id", couple.id)
                .eq("partner_number", id)
                .select()
                .single();

        if (error) {
            throw error;
        }

        res.json({
            message:
                "Partner profile saved successfully ❤️",

            coupleId: couple.id,
            partnerId: id,

            profile: {
                language: updatedPartner.language,
                gender: updatedPartner.gender,
                malePartnerName:
                    updatedPartner.male_partner_name,
                femalePartnerName:
                    updatedPartner.female_partner_name
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

app.get(
    "/api/couples/:coupleId/profile/:partnerId",
    async (req, res) => {
        try {
            const couple =
                await getCouple(req.params.coupleId);

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
                await getPartner(couple.id, id);

            if (!partner) {
                return res.status(404).json({
                    message: "Partner not found."
                });
            }

            res.json({
                partnerId: id,
                connected: partner.connected,
                language: partner.language,
                gender: partner.gender,
                malePartnerName:
                    partner.male_partner_name,
                femalePartnerName:
                    partner.female_partner_name
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

app.get(
    "/api/couples/:coupleId/quiz/options",
    async (req, res) => {
        try {
            const couple =
                await getCouple(req.params.coupleId);

            if (!couple) {
                return res.status(404).json({
                    message: "Couple not found."
                });
            }

            res.json({
                coupleId: couple.id,
                optionSets:
                    couple.option_sets || {}
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

app.get(
    "/api/couples/:coupleId/quiz/order/:partnerId",
    async (req, res) => {
        try {
            const couple =
                await getCouple(req.params.coupleId);

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

            let partner =
                await getPartner(couple.id, id);

            if (!partner) {
                return res.status(404).json({
                    message: "Partner not found."
                });
            }

            let questionOrder =
                partner.question_order;

            if (
                !Array.isArray(questionOrder) ||
                questionOrder.length !== 20
            ) {
                questionOrder =
                    createQuestionOrder();

                const { data, error } =
                    await supabase
                        .from("partners")
                        .update({
                            question_order:
                                questionOrder
                        })
                        .eq("couple_id", couple.id)
                        .eq("partner_number", id)
                        .select()
                        .single();

                if (error) {
                    throw error;
                }

                partner = data;
            }

            res.json({
                coupleId: couple.id,
                partnerId: id,
                questionOrder:
                    partner.question_order
            });

        } catch (error) {
            console.error(
                "QUESTION ORDER ERROR:",
                error
            );

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);

app.post(
    "/api/couples/:coupleId/quiz/actual",
    async (req, res) => {
        try {
            const couple =
                await getCouple(req.params.coupleId);

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
                await getPartner(couple.id, id);

            if (!partner) {
                return res.status(404).json({
                    message: "Partner not found."
                });
            }

            const cleanedAnswers =
                cleanAnswers(answers);

            const { error } = await supabase
                .from("partners")
                .update({
                    actual_answers:
                        cleanedAnswers,
                    page4_completed: true
                })
                .eq("couple_id", couple.id)
                .eq("partner_number", id);

            if (error) {
                throw error;
            }

            console.log(
                "PAGE 4 SAVED:",
                couple.id,
                "Partner:",
                id
            );

            res.json({
                message:
                    "Page 4 answers saved successfully ❤️",

                coupleId: couple.id,
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

app.post(
    "/api/couples/:coupleId/quiz/guesses",
    async (req, res) => {
        try {
            const couple =
                await getCouple(req.params.coupleId);

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
                await getPartner(couple.id, id);

            if (!partner) {
                return res.status(404).json({
                    message: "Partner not found."
                });
            }

            const cleanedGuesses =
                cleanAnswers(guesses);

            const { error } = await supabase
                .from("partners")
                .update({
                    guesses:
                        cleanedGuesses,
                    page5_completed: true
                })
                .eq("couple_id", couple.id)
                .eq("partner_number", id);

            if (error) {
                throw error;
            }

            console.log(
                "PAGE 5 GUESSES SAVED:",
                couple.id,
                "Partner:",
                id
            );

            res.json({
                message:
                    "Page 5 guesses saved successfully ❤️",

                coupleId: couple.id,
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

app.get(
    "/api/couples/:coupleId/quiz-result",
    async (req, res) => {
        try {
            const couple =
                await getCouple(req.params.coupleId);

            if (!couple) {
                return res.status(404).json({
                    message: "Couple not found."
                });
            }

            const {
                partner1: p1,
                partner2: p2
            } = await getBothPartners(couple.id);

            if (!p1 || !p2) {
                return res.json({
                    bothCompleted: false,
                    partner1Completed:
                        Boolean(p1?.page5_completed),
                    partner2Completed:
                        Boolean(p2?.page5_completed),
                    message:
                        "Waiting for both partners to finish ❤️"
                });
            }

            const bothCompleted = Boolean(
                p1.page4_completed &&
                p2.page4_completed &&
                p1.page5_completed &&
                p2.page5_completed &&
                p1.actual_answers &&
                p2.actual_answers &&
                p1.guesses &&
                p2.guesses
            );

            if (!bothCompleted) {
                return res.json({
                    bothCompleted: false,

                    partner1Completed:
                        Boolean(
                            p1.page5_completed
                        ),

                    partner2Completed:
                        Boolean(
                            p2.page5_completed
                        ),

                    message:
                        "Waiting for both partners to finish ❤️"
                });
            }

            const partner1Correct =
                compareAnswers(
                    p1.guesses,
                    p2.actual_answers
                );

            const partner2Correct =
                compareAnswers(
                    p2.guesses,
                    p1.actual_answers
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
                p1.male_partner_name ||
                p2.male_partner_name ||
                "Partner 1";

            const femaleName =
                p1.female_partner_name ||
                p2.female_partner_name ||
                "Partner 2";

            res.json({
                bothCompleted: true,

                maleName,
                femaleName,

                partner1Actual:
                    p1.actual_answers,

                partner2Actual:
                    p2.actual_answers,

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

app.listen(PORT, () => {
    console.log(
        `Magic Miracle Couple Quiz server is running on http://localhost:${PORT}`
    );
});