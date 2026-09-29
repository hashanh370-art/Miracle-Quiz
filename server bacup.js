const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const couples = new Map();

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
            status: "Waiting for partner"
        });

        res.status(201).json({
            message: "Couple Account created successfully ❤️",
            coupleId,
            coupleCode,
            username,
            status: "Waiting for partner"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error."
        });
    }
});

app.post("/api/couples/join", (req, res) => {
    const { coupleCode } = req.body;

    if (!coupleCode) {
        return res.status(400).json({
            message: "Please enter your Couple Code."
        });
    }

    const couple = [...couples.values()].find(
        item =>
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
    couple.status = "Our Couple is Connected ❤️";

    res.json({
        message: "Our Couple is Connected ❤️",
        coupleId: couple.coupleId,
        coupleCode: couple.coupleCode,
        status: couple.status
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});