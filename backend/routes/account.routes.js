
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const db = require("../config/database");

// Verify the logged-in tourist using the JWT token.
function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Please log in to access your account."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Your session has expired. Please log in again."
        });
    }
}

// GET /api/account
router.get("/", authenticateUser, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT id, tourist_id, full_name, email, phone, created_at
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [req.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        return res.json({
            success: true,
            user: rows[0]
        });
    } catch (error) {
        console.error("Account fetch error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load account details."
        });
    }
});

// PUT /api/account
router.put("/", authenticateUser, async (req, res) => {
    try {
        const { full_name, email, phone } = req.body;

        const cleanName =
            typeof full_name === "string" ? full_name.trim() : "";

        const cleanEmail =
            typeof email === "string" ? email.trim() : "";

        const cleanPhone =
            typeof phone === "string" ? phone.trim() : "";

        if (!cleanName || cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Enter a name between 1 and 100 characters."
            });
        }

        if (
            cleanEmail.length > 150 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address."
            });
        }

        if (cleanPhone.length > 20) {
            return res.status(400).json({
                success: false,
                message: "Phone number cannot exceed 20 characters."
            });
        }

        await db.execute(
            `UPDATE users
             SET full_name = ?, email = ?, phone = ?
             WHERE id = ?`,
            [
                cleanName,
                cleanEmail,
                cleanPhone || null,
                req.userId
            ]
        );

        const [rows] = await db.execute(
            `SELECT id, tourist_id, full_name, email, phone, created_at
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [req.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        return res.json({
            success: true,
            message: "Account updated successfully.",
            user: rows[0]
        });
    } catch (error) {
        console.error("Account update error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This email address is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update account details."
        });
    }
});

module.exports = router;
