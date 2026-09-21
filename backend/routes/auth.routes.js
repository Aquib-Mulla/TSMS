const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");

const router = express.Router();


// ======================================================
// REGISTER USER
// ======================================================

router.post("/register", async (req, res) => {

    try {

        const {
            full_name,
            email,
            phone,
            password
        } = req.body;


        // ==================================================
        // CHECK REQUIRED FIELDS
        // ==================================================

        if (!full_name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required."
            });

        }


        // ==================================================
        // CHECK IF EMAIL ALREADY EXISTS
        // ==================================================

        const [existingUsers] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );


        if (existingUsers.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });

        }


        // ==================================================
        // HASH PASSWORD
        // ==================================================

        const passwordHash = await bcrypt.hash(
            password,
            10
        );


        // ==================================================
        // INSERT USER
        // ==================================================

        const [result] = await pool.execute(

            `INSERT INTO users
            (full_name, email, phone, password_hash)
            VALUES (?, ?, ?, ?)`,

            [
                full_name,
                email,
                phone || null,
                passwordHash
            ]

        );


        // ==================================================
        // GET MYSQL GENERATED USER ID
        // ==================================================

        const userId = result.insertId;


        // ==================================================
        // GENERATE TOURIST ID
        //
        // Example:
        // 1  -> TS-00001
        // 25 -> TS-00025
        // 125 -> TS-00125
        // ==================================================

        const touristId = `TS-${String(userId).padStart(5, "0")}`;


        // ==================================================
        // SAVE TOURIST ID
        // ==================================================

        await pool.execute(

            `UPDATE users
             SET tourist_id = ?
             WHERE id = ?`,

            [
                touristId,
                userId
            ]

        );


        // ==================================================
        // REGISTRATION SUCCESS
        // ==================================================

        res.status(201).json({

            success: true,

            message: "Registration successful.",

            userId: userId,

            touristId: touristId

        });


    } catch (error) {

        console.error("REGISTER ERROR:", error);

        res.status(500).json({

            success: false,

            message: "Registration failed.",

            error: error.message

        });

    }

});


// ======================================================
// LOGIN USER
// ======================================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // ==================================================
        // CHECK REQUIRED FIELDS
        // ==================================================

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message: "Email and password are required."

            });

        }


        // ==================================================
        // FIND USER
        // ==================================================

        const [users] = await pool.execute(

            `SELECT
                id,
                tourist_id,
                full_name,
                email,
                phone,
                password_hash
             FROM users
             WHERE email = ?`,

            [email]

        );


        // ==================================================
        // USER DOES NOT EXIST
        // ==================================================

        if (users.length === 0) {

            return res.status(401).json({

                success: false,

                message: "Invalid email or password."

            });

        }


        const user = users[0];


        // ==================================================
        // CHECK PASSWORD
        // ==================================================

        const passwordMatch = await bcrypt.compare(

            password,

            user.password_hash

        );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message: "Invalid email or password."

            });

        }


        // ==================================================
        // CREATE JWT TOKEN
        // ==================================================

        const token = jwt.sign(

            {
                id: user.id,

                tourist_id: user.tourist_id,

                email: user.email
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "1d"
            }
        );


        // ==================================================
        // LOGIN SUCCESS
        // ==================================================

        res.status(200).json({

            success: true,

            message: "Login successful.",

            token,

            user: {

                id: user.id,

                tourist_id: user.tourist_id,

                full_name: user.full_name,

                email: user.email,

                phone: user.phone

            }

        });


    } catch (error) {

        console.error("LOGIN ERROR:", error);

        res.status(500).json({

            success: false,

            message: "Login failed.",

            error: error.message

        });

    }

});


module.exports = router;
