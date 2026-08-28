const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");


const app = express();


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.json());


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.json({
        message: "TSMS Backend is running"
    });

});


// ======================================================
// DATABASE TEST
// ======================================================

app.get("/api/test-db", async (req, res) => {

    try {

        const [rows] = await pool.query(
            "SELECT DATABASE() AS database_name"
        );

        res.json({

            success: true,

            database: rows[0].database_name

        });

    } catch (error) {

        console.error("DATABASE ERROR:", error);

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});


// ======================================================
// AUTH ROUTES
// ======================================================

app.use(
    "/api/auth",
    authRoutes
);


// ======================================================
// ADMIN ROUTES
// ======================================================

app.use(
    "/api/admin",
    adminRoutes
);


// ======================================================
// START SERVER
// ======================================================

const PORT = 5000;

app.listen(PORT, () => {

    console.log(
        `TSMS Backend running on http://localhost:${PORT}`
    );

});