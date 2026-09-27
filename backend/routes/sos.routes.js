const express = require("express");
const router = express.Router();

const pool = require("../config/database");

// ==================================================
// TRIGGER SOS
// POST /api/sos
// ==================================================

module.exports = (io) => {

    router.post("/", async (req, res) => {
        try {
            const {
                userId,
                latitude,
                longitude,
                accuracy,
                risk,
                message
            } = req.body;

            // Validate required fields
            if (
                userId === undefined ||
                userId === null ||
                !Number.isInteger(Number(userId)) ||
                Number(userId) <= 0 ||
                latitude === undefined ||
                longitude === undefined ||
                !Number.isFinite(Number(latitude)) ||
                !Number.isFinite(Number(longitude)) ||
                Number(latitude) < -90 ||
                Number(latitude) > 90 ||
                Number(longitude) < -180 ||
                Number(longitude) > 180
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Valid userId, latitude and longitude are required."
                });
            }

            // Find tourist details
            const [tourists] = await pool.query(
                `SELECT
                    id,
                    tourist_id,
                    full_name,
                    email,
                    phone
                 FROM users
                 WHERE id = ?
                 LIMIT 1`,
                [Number(userId)]
            );

            if (tourists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Tourist not found."
                });
            }

            const tourist = tourists[0];

            // Save SOS incident
            const [result] = await pool.query(
                `INSERT INTO sos_alerts
                (
                    user_id,
                    latitude,
                    longitude,
                    accuracy,
                    risk,
                    message,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
                [
                    tourist.id,
                    Number(latitude),
                    Number(longitude),
                    Number.isFinite(Number(accuracy)) &&
                    accuracy !== null &&
                    accuracy !== ""
                        ? Number(accuracy)
                        : null,
                    Number.isFinite(Number(risk))
                        ? Number(risk)
                        : null,
                    typeof message === "string" && message.trim()
                        ? message.trim().slice(0, 255)
                        : "Tourist SOS emergency alert"
                ]
            );

            const alert = {
                id: result.insertId,
                user_id: tourist.id,
                tourist_id: tourist.tourist_id,
                full_name: tourist.full_name,
                email: tourist.email,
                phone: tourist.phone,
                latitude: Number(latitude),
                longitude: Number(longitude),
                accuracy: accuracy ?? null,
                risk: risk ?? null,
                message: message || "Tourist SOS emergency alert",
                status: "ACTIVE",
                created_at: new Date()
            };

            // Notify connected admin dashboards
            io.emit("sos:alert", alert);

            console.log("=================================");
            console.log("SOS EMERGENCY TRIGGERED");
            console.log("Alert ID:", alert.id);
            console.log("Tourist ID:", alert.tourist_id);
            console.log("Name:", alert.full_name);
            console.log("Email:", alert.email);
            console.log("Phone:", alert.phone);
            console.log("Location:", latitude, longitude);
            console.log("=================================");

            return res.status(201).json({
                success: true,
                message: "SOS alert sent successfully.",
                alert
            });

        } catch (error) {
            console.error("SOS TRIGGER ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to process SOS alert."
            });
        }
    });


    // ==================================================
    // GET SOS ALERTS
    // GET /api/sos/alerts
    // ==================================================

    router.get("/alerts", async (req, res) => {
        try {
            const [alerts] = await pool.query(
                `SELECT
                    s.id,
                    s.user_id,
                    u.tourist_id,
                    u.full_name,
                    u.email,
                    u.phone,
                    s.latitude,
                    s.longitude,
                    s.accuracy,
                    s.risk,
                    s.message,
                    s.status,
                    s.created_at
                 FROM sos_alerts s
                 INNER JOIN users u
                    ON u.id = s.user_id
                 ORDER BY
                    CASE
                        WHEN s.status = 'ACTIVE' THEN 0
                        WHEN s.status = 'ACKNOWLEDGED' THEN 1
                        ELSE 2
                    END,
                    s.created_at DESC`
            );

            return res.json({
                success: true,
                alerts
            });

        } catch (error) {
            console.error("GET SOS ALERTS ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch SOS alerts."
            });
        }
    });


    // ==================================================
    // UPDATE SOS STATUS
    // PATCH /api/sos/:id/status
    // ==================================================

    router.patch("/:id/status", async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid SOS alert ID."
                });
            }

            if (!["ACKNOWLEDGED", "RESOLVED"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid SOS status."
                });
            }

            const [result] = await pool.query(
                `UPDATE sos_alerts
                 SET status = ?
                 WHERE id = ?`,
                [status, Number(id)]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "SOS alert not found."
                });
            }

            const [rows] = await pool.query(
                `SELECT id, user_id, status
                 FROM sos_alerts
                 WHERE id = ?`,
                [Number(id)]
            );

            // Notify dashboards about the status change
            io.emit("sos:status", rows[0]);

            return res.json({
                success: true,
                message: "SOS status updated.",
                alert: rows[0]
            });

        } catch (error) {
            console.error("UPDATE SOS STATUS ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update SOS status."
            });
        }
    });

    return router;
};