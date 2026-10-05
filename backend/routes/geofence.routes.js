const express = require("express");

const router = express.Router();

const pool = require("../config/database");


// ============================================================
// GET ALL GEO-FENCES
// ============================================================

router.get("/", async (req, res) => {

    try {

        const [rows] = await pool.query(
            `
            SELECT
                id,
                name,
                latitude,
                longitude,
                radius,
                zone_type,
                risk_level,
                description,
                status,
                alert_on_entry,
                alert_on_exit,
                created_at
            FROM geofences
            ORDER BY id DESC
            `
        );


        res.json({
            success: true,
            geofences: rows
        });


    } catch (error) {

        console.error(
            "Get Geo-Fences Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch Geo-Fences"

        });

    }

});


// ============================================================
// CREATE GEO-FENCE
// ============================================================

router.post("/", async (req, res) => {

    try {

        const {
            name,
            latitude,
            longitude,
            radius,
            zoneType,
            riskLevel,
            description,
            status,
            alertOnEntry,
            alertOnExit
        } = req.body;


        // ======================================================
        // VALIDATION
        // ======================================================

        if (!name || !name.trim()) {

            return res.status(400).json({

                success: false,

                message:
                    "Geo-Fence name is required."

            });

        }


        const lat = Number(latitude);

        const lng = Number(longitude);

        const fenceRadius = Number(radius);


        if (
            !Number.isFinite(lat) ||
            lat < -90 ||
            lat > 90
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid latitude."

            });

        }


        if (
            !Number.isFinite(lng) ||
            lng < -180 ||
            lng > 180
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid longitude."

            });

        }


        if (
            !Number.isFinite(fenceRadius) ||
            fenceRadius <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid radius."

            });

        }


        // ======================================================
        // INSERT
        // ======================================================

        const [result] = await pool.query(

            `
            INSERT INTO geofences
            (
                name,
                latitude,
                longitude,
                radius,
                zone_type,
                risk_level,
                description,
                status,
                alert_on_entry,
                alert_on_exit
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

            [
                name.trim(),

                lat,

                lng,

                fenceRadius,

                zoneType || "SAFE",

                riskLevel || "LOW",

                description || "",

                status || "ACTIVE",

                alertOnEntry !== false ? 1 : 0,

                alertOnExit !== false ? 1 : 0
            ]

        );


        // ======================================================
        // GET CREATED GEO-FENCE
        // ======================================================

        const [rows] = await pool.query(

            `
            SELECT *
            FROM geofences
            WHERE id = ?
            `,

            [result.insertId]

        );


        res.status(201).json({

            success: true,

            message:
                "Geo-Fence created successfully.",

            geofence:
                rows[0]

        });


    } catch (error) {

        console.error(
            "Create Geo-Fence Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to create Geo-Fence."

        });

    }

});


// ============================================================
// DELETE GEO-FENCE
// ============================================================

router.delete("/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        if (
            !Number.isInteger(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Geo-Fence ID."

            });

        }


        const [result] =
            await pool.query(

                `
                DELETE FROM geofences
                WHERE id = ?
                `,

                [id]

            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Geo-Fence not found."

            });

        }


        res.json({

            success: true,

            message:
                "Geo-Fence deleted successfully."

        });


    } catch (error) {

        console.error(
            "Delete Geo-Fence Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to delete Geo-Fence."

        });

    }

});


module.exports = router;