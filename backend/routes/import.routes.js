
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const pool = require("../config/database");

const router = express.Router();

const uploadDirectory = path.join(
  __dirname,
  "../uploads/geofence-imports"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `geofences-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (![".xls", ".xlsx"].includes(extension)) {
      return callback(new Error("Only .xls and .xlsx files are allowed."));
    }

    callback(null, true);
  },
});

function removeFile(filePath) {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Could not remove uploaded file:", error.message);
  }
}

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

// POST /api/import/geofences
router.post("/geofences", (req, res) => {
  upload.single("file")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        message: uploadError.message || "File upload failed.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select an Excel file.",
      });
    }

    let connection;

    try {
      const workbook = xlsx.readFile(req.file.path);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        throw new Error("The Excel file does not contain a worksheet.");
      }

      const rawRows = xlsx.utils.sheet_to_json(firstSheet, {
        defval: "",
        raw: false,
      });

      if (rawRows.length === 0) {
        throw new Error("The Excel worksheet has no data rows.");
      }

      const rows = rawRows.map((rawRow, index) => {
        const row = {};

        for (const [header, value] of Object.entries(rawRow)) {
          row[normalizeHeader(header)] = value;
        }

        const name = String(row.name || "").trim();
        const latitude = Number(row.latitude);
        const longitude = Number(row.longitude);
        const radius = Number(row.radius);
        const zoneType = String(row.zonetype || "").trim();
        const riskLevel = String(row.risklevel || "").trim();
        const description = String(row.description || "").trim();

        if (
          !name ||
          row.latitude === "" ||
          row.longitude === "" ||
          row.radius === "" ||
          !zoneType ||
          !riskLevel
        ) {
          throw new Error(
            `Row ${index + 2}: name, latitude, longitude, radius, zone_type and risk_level are required.`
          );
        }

        if (
          !Number.isFinite(latitude) ||
          latitude < -90 ||
          latitude > 90
        ) {
          throw new Error(`Row ${index + 2}: invalid latitude.`);
        }

        if (
          !Number.isFinite(longitude) ||
          longitude < -180 ||
          longitude > 180
        ) {
          throw new Error(`Row ${index + 2}: invalid longitude.`);
        }

        if (
          !Number.isInteger(radius) ||
          radius <= 0
        ) {
          throw new Error(
            `Row ${index + 2}: radius must be a positive whole number in metres.`
          );
        }

        if (name.length > 150) {
          throw new Error(`Row ${index + 2}: name must not exceed 150 characters.`);
        }

        if (zoneType.length > 30 || riskLevel.length > 30) {
          throw new Error(
            `Row ${index + 2}: zone_type and risk_level must not exceed 30 characters.`
          );
        }

        return {
          name,
          latitude,
          longitude,
          radius,
          zoneType,
          riskLevel,
          description: description || null,
        };
      });

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [fileResult] = await connection.execute(
        `INSERT INTO imported_files (file_name, stored_path)
         VALUES (?, ?)`,
        [
          req.file.originalname,
          req.file.path,
        ]
      );

      const importedFileId = fileResult.insertId;

      for (const row of rows) {
        await connection.execute(
          `INSERT INTO geofences
           (
             name, latitude, longitude, radius,
             zone_type, risk_level, description,
             status, alert_on_entry, alert_on_exit,
             source_file_id
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, 1, ?)`,
          [
            row.name,
            row.latitude,
            row.longitude,
            row.radius,
            row.zoneType,
            row.riskLevel,
            row.description,
            importedFileId,
          ]
        );
      }

      await connection.commit();

      return res.status(201).json({
        message: `Successfully imported ${rows.length} geofences.`,
        importedFileId,
        fileName: req.file.originalname,
        importedCount: rows.length,
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Import rollback failed:", rollbackError.message);
        }
      }

      removeFile(req.file.path);

      console.error("Geofence Excel import failed:", error);

      return res.status(400).json({
        message: error.message || "Failed to import Excel file.",
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
});

// GET /api/import/files
router.get("/files", async (req, res) => {
  try {
    const [files] = await pool.execute(
      `SELECT
         f.id,
         f.file_name,
         f.uploaded_at,
         COUNT(g.id) AS imported_count
       FROM imported_files f
       LEFT JOIN geofences g ON g.source_file_id = f.id
       GROUP BY f.id, f.file_name, f.uploaded_at
       ORDER BY f.uploaded_at DESC`
    );

    res.json({ files });
  } catch (error) {
    console.error("Could not list imported files:", error);

    res.status(500).json({
      message: "Could not retrieve imported files.",
    });
  }
});

// DELETE /api/import/files/:id
router.delete("/files/:id", async (req, res) => {
  const fileId = Number(req.params.id);

  if (!Number.isInteger(fileId) || fileId <= 0) {
    return res.status(400).json({
      message: "Invalid imported file ID.",
    });
  }

  let connection;
  let storedPath = null;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [files] = await connection.execute(
      "SELECT id, file_name, stored_path FROM imported_files WHERE id = ? FOR UPDATE",
      [fileId]
    );

    if (files.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Imported file not found.",
      });
    }

    storedPath = files[0].stored_path;

    // The foreign key ON DELETE CASCADE removes only geofences
    // associated with this imported file.
    await connection.execute(
      "DELETE FROM imported_files WHERE id = ?",
      [fileId]
    );

    await connection.commit();

    removeFile(storedPath);

    return res.json({
      message: `Deleted "${files[0].file_name}" and its imported geofences.`,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Delete rollback failed:", rollbackError.message);
      }
    }

    console.error("Imported file deletion failed:", error);

    return res.status(500).json({
      message: "Could not delete the imported file.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
