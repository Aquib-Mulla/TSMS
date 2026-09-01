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

        // Validate input
        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Please enter admin email and password."
            });

        }

        // Find admin
        const [admins] = await pool.query(
            "SELECT * FROM admins WHERE email = ? LIMIT 1",
            [email]
        );

        if (admins.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid admin email or password."
            });

        }

        const admin = admins[0];

        // Check password
        if (password !== admin.password) {

            return res.status(401).json({
                success: false,
                message: "Invalid admin email or password."
            });

        }

        // Create JWT
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

        // Admin response
        const adminData = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: "admin"
        };

        res.status(200).json({

            success: true,

            message: "Admin login successful.",

            token,

            admin: adminData

        });

    } catch (error) {

        console.error("ADMIN LOGIN ERROR:", error);

        res.status(500).json({

            success: false,

            message: "Server error. Please try again."

        });

    }

});


// ======================================================
// GET ALL TOURISTS
// ======================================================

router.get("/tourists", async (req, res) => {

    try {

        const [tourists] = await pool.query(`

            SELECT
                u.id,
                u.tourist_id,
                u.full_name,
                u.email,
                u.phone,
                u.created_at,

                tl.latitude,
                tl.longitude,
                tl.accuracy,
                tl.is_tracking,
                tl.updated_at AS location_updated_at

            FROM users u

            LEFT JOIN tourist_locations tl
                ON u.id = tl.user_id

            ORDER BY u.created_at DESC

        `);

        res.status(200).json({

            success: true,
            tourists

        });

    } catch (error) {

        console.error("GET TOURISTS ERROR:", error);

        res.status(500).json({

            success: false,
            message: "Unable to fetch tourists.",
            error: error.message

        });

    }

});

// ======================================================
// UPDATE TOURIST ACCOUNT STATUS
// ======================================================

router.patch("/tourists/:id/status", async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body;

        if (!["Active", "Inactive"].includes(status)) {

            return res.status(400).json({

                success: false,

                message: "Invalid account status."

            });

        }

        const [result] = await pool.query(

            `UPDATE users
             SET account_status = ?
             WHERE id = ?`,

            [status, id]

        );

        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message: "Tourist not found."

            });

        }

        res.status(200).json({

            success: true,

            message: "Tourist status updated successfully."

        });

    } catch (error) {

        console.error("UPDATE TOURIST STATUS ERROR:", error);

        res.status(500).json({

            success: false,

            message: "Unable to update tourist status."

        });

    }

});


module.exports = router;
