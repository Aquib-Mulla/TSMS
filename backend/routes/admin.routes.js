const express = require("express");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");

const router = express.Router();


// ======================================================
// ADMIN LOGIN
// ======================================================

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;


        // ==================================================
        // VALIDATE INPUT
        // ==================================================

        if (!email || !password) {

            return res.status(400).json({
                message: "Please enter admin email and password."
            });

        }


        // ==================================================
        // FIND ADMIN
        // ==================================================

        const [admins] = await pool.query(
            "SELECT * FROM admins WHERE email = ? LIMIT 1",
            [email]
        );


        // Admin does not exist
        if (admins.length === 0) {

            return res.status(401).json({
                message: "Invalid admin email or password."
            });

        }


        const admin = admins[0];


        // ==================================================
        // CHECK PASSWORD
        // ==================================================

        if (password !== admin.password) {

            return res.status(401).json({
                message: "Invalid admin email or password."
            });

        }


        // ==================================================
        // CREATE JWT TOKEN
        // ==================================================

        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );


        // ==================================================
        // REMOVE PASSWORD FROM RESPONSE
        // ==================================================

        const adminData = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: "admin"
        };


        // ==================================================
        // LOGIN SUCCESS
        // ==================================================

        res.status(200).json({

            success: true,

            message: "Admin login successful.",

            token: token,

            admin: adminData

        });


    } catch (error) {

        console.error("ADMIN LOGIN ERROR:", error);

        res.status(500).json({
            message: "Server error. Please try again."
        });

    }

});


module.exports = router;