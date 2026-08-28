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


        // Check required fields
        if (!full_name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required."
            });

        }


        // Check if email already exists
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


        // Hash password
        const passwordHash = await bcrypt.hash(
            password,
            10
        );


        // Insert user
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


        res.status(201).json({

            success: true,

            message: "Registration successful.",

            userId: result.insertId

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


        // Check required fields
        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });

        }


        // Find user by email
        const [users] = await pool.execute(
            `SELECT
                id,
                full_name,
                email,
                phone,
                password_hash
             FROM users
             WHERE email = ?`,
            [email]
        );


        // User does not exist
        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });

        }


        const user = users[0];


        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );


        // Wrong password
        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });

        }


        // Create JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );


        // Login successful
        res.status(200).json({

            success: true,

            message: "Login successful.",

            token,

            user: {
                id: user.id,
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