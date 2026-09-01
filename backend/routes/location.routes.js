const express = require("express");
const router = express.Router();

const pool = require("../config/database");


// ==================================================
// START TOUR
// ==================================================

router.post("/start", async (req, res) => {

    try {

        const {
            userId,
            latitude,
            longitude,
            accuracy
        } = req.body;

        if (
            !userId ||
            latitude === undefined ||
            longitude === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "userId, latitude and longitude are required"
            });

        }


        const [existing] = await pool.query(
            `SELECT id
             FROM tourist_locations
             WHERE user_id = ?`,
            [userId]
        );


        if (existing.length > 0) {

            await pool.query(
                `UPDATE tourist_locations
                 SET latitude = ?,
                     longitude = ?,
                     accuracy = ?,
                     is_tracking = TRUE,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ?`,
                [
                    latitude,
                    longitude,
                    accuracy || null,
                    userId
                ]
            );

        } else {

            await pool.query(
                `INSERT INTO tourist_locations
                (
                    user_id,
                    latitude,
                    longitude,
                    accuracy,
                    is_tracking
                )
                VALUES (?, ?, ?, ?, TRUE)`,
                [
                    userId,
                    latitude,
                    longitude,
                    accuracy || null
                ]
            );

        }


        res.json({
            success: true,
            message: "Tour started successfully"
        });


    } catch (error) {

        console.error(
            "Start tour error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ==================================================
// UPDATE LOCATION
// ==================================================

router.post("/update", async (req, res) => {

    try {

        const {
            userId,
            latitude,
            longitude,
            accuracy
        } = req.body;


        if (
            !userId ||
            latitude === undefined ||
            longitude === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "Location data is required"
            });

        }


        const [result] = await pool.query(
            `UPDATE tourist_locations
             SET latitude = ?,
                 longitude = ?,
                 accuracy = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?
             AND is_tracking = TRUE`,
            [
                latitude,
                longitude,
                accuracy || null,
                userId
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Tourist tracking is not active"
            });

        }


        res.json({
            success: true,
            message: "Location updated"
        });


    } catch (error) {

        console.error(
            "Update location error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ==================================================
// STOP TOUR
// ==================================================

router.post("/stop", async (req, res) => {

    try {

        const { userId } = req.body;


        if (!userId) {

            return res.status(400).json({
                success: false,
                message: "userId is required"
            });

        }


        await pool.query(
            `UPDATE tourist_locations
             SET is_tracking = FALSE
             WHERE user_id = ?`,
            [userId]
        );


        res.json({
            success: true,
            message: "Tour stopped successfully"
        });


    } catch (error) {

        console.error(
            "Stop tour error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ==================================================
// GET ACTIVE TOURISTS
// ==================================================

router.get("/active", async (req, res) => {

    try {

        const [rows] = await pool.query(
            `SELECT
                u.id,
                u.tourist_id,
                u.full_name,
                u.email,
                u.phone,

                tl.latitude,
                tl.longitude,
                tl.accuracy,
                tl.is_tracking,
                tl.updated_at

             FROM users u

             INNER JOIN tourist_locations tl
                ON u.id = tl.user_id

             WHERE tl.is_tracking = TRUE

             ORDER BY tl.updated_at DESC`
        );


        res.json({
            success: true,
            tourists: rows
        });


    } catch (error) {

        console.error(
            "Get active tourists error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


module.exports = router;