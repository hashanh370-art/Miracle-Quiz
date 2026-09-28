document.getElementById("app").innerHTML = `
<style>
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    font-family: Arial, sans-serif;
    color: #ffffff;
    background:
        radial-gradient(circle at top, #3a0008 0%, #130004 35%, #050505 70%);
}

.page {
    min-height: 100vh;
    padding: 50px 20px;
}

.header {
    text-align: center;
    margin-bottom: 40px;
}

.logo-heart {
    font-size: 45px;
    filter: drop-shadow(0 0 15px #ff163f);
}

.header h1 {
    margin: 10px 0;
    font-size: 42px;
    letter-spacing: 1px;
}

.header h1 span {
    color: #ff244f;
}

.brand-name {
    font-size: 13px;
    color: #c9c9c9;
    margin-top: -8px;
    margin-bottom: 10px;
    letter-spacing: 1.5px;
    font-weight: 400;
}

.header p {
    color: #b9aeb1;
    font-size: 16px;
}

.container {
    width: 100%;
    max-width: 1000px;
    margin: auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
}

.card {
    background: rgba(18, 10, 12, 0.92);
    border: 1px solid rgba(255, 45, 80, 0.25);
    border-radius: 22px;
    padding: 30px;
    box-shadow: 0 15px 50px rgba(0,0,0,0.45);
}

.card h2 {
    margin-top: 0;
    font-size: 25px;
}

.card p {
    color: #a99da0;
    line-height: 1.6;
}

label {
    display: block;
    margin: 20px 0 8px;
    color: #ddd;
}

input {
    width: 100%;
    padding: 15px;
    border-radius: 12px;
    border: 1px solid #3a292d;
    background: #0d0a0b;
    color: white;
    outline: none;
    font-size: 16px;
}

input:focus {
    border-color: #ff244f;
    box-shadow: 0 0 0 3px rgba(255,36,79,0.1);
}

.password-box {
    position: relative;
}

.password-box input {
    padding-right: 70px;
}

.show-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #ff496b;
    cursor: pointer;
}

.primary-btn,
.secondary-btn {
    width: 100%;
    margin-top: 24px;
    padding: 15px;
    border-radius: 12px;
    border: none;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
}

.primary-btn {
    color: white;
    background: linear-gradient(135deg, #d90032, #ff3159);
    box-shadow: 0 8px 25px rgba(255, 20, 60, 0.25);
}

.secondary-btn {
    color: #ff496b;
    background: #1a0c10;
    border: 1px solid #63202f;
}

.note {
    margin-top: 25px;
    text-align: center;
    color: #786c6f;
    font-size: 13px;
}

@media (max-width: 750px) {
    .container {
        grid-template-columns: 1fr;
    }

    .header h1 {
        font-size: 34px;
    }

    .page {
        padding: 30px 15px;
    }
}
</style>

<div class="page">

    <div class="header">
        <div class="logo-heart">❤️</div>
        <h1>Miracle <span>Quiz</span></h1>
        <div class="brand-name">by Miracle Heart</div>
        <p>One couple. One account. One beautiful journey.</p>
    </div>

    <div class="container">

        <div class="card">
            <h2>Create Couple Account ❤️</h2>

            <p>
                Create one private account for both of you.
                You will receive a Couple Code to share with your partner.
            </p>

            <label>Username</label>
            <input
                id="username"
                type="text"
                placeholder="e.g. miracleheart"
            >

            <label>Password</label>

            <div class="password-box">
                <input
                    id="password"
                    type="password"
                    placeholder="e.g. Love@2026"
                >

                <button
                    class="show-btn"
                    onclick="togglePassword()"
                >
                    Show
                </button>
            </div>

            <button class="primary-btn" onclick="createCouple()">
                Create Couple
            </button>
        </div>

        <div class="card">
            <h2>Join Existing Couple 💕</h2>

            <p>
                Already have a Couple Code?
                Enter it below to connect to your shared Couple Account.
            </p>

            <label>Couple Code</label>

            <input
                id="coupleCode"
                type="text"
                placeholder="Enter Couple Code"
            >

            <button class="secondary-btn" onclick="joinCouple()">
                Join Couple
            </button>
        </div>

    </div>

    <div class="note">
        🔒 Your private couple journey starts here.
    </div>

</div>
`;

function togglePassword() {
    const password = document.getElementById("password");
    const button = document.querySelector(".show-btn");

    if (password.type === "password") {
        password.type = "text";
        button.textContent = "Hide";
    } else {
        password.type = "password";
        button.textContent = "Show";
    }
}

async function createCouple() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
        alert("Please enter both Username and Password.");
        return;
    }

    try {
        const response = await fetch("/api/couples/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Something went wrong.");
            return;
        }

        localStorage.setItem("coupleId", data.coupleId);
        localStorage.setItem("coupleCode", data.coupleCode);
        localStorage.setItem("username", data.username);
        localStorage.setItem("connectionStatus", data.status);
        localStorage.setItem("partnerId", String(data.partnerId));

        alert(
            "Couple Account created successfully ❤️\n\n" +
            "Your Couple Code: " + data.coupleCode
        );

        window.location.href = "page2.html";

    } catch (error) {
        console.error(error);
        alert("Could not connect to the server.");
    }
}

async function joinCouple() {
    const code = document.getElementById("coupleCode").value.trim();

    if (!code) {
        alert("Please enter your Couple Code.");
        return;
    }

    try {
        const response = await fetch("/api/couples/join", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                coupleCode: code
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Invalid Couple Code or Couple is full.");
            return;
        }

        localStorage.setItem("coupleId", data.coupleId);
        localStorage.setItem("coupleCode", data.coupleCode);
        localStorage.setItem("username", data.username || "");
        localStorage.setItem("connectionStatus", data.status);
        localStorage.setItem("partnerId", String(data.partnerId));

        alert("Our Couple is Connected ❤️");

        window.location.href = "page2.html";

    } catch (error) {
        console.error(error);
        alert("Could not connect to the server.");
    }
}