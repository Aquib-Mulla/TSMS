const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const pool = require("./config/database");

const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/auth.routes");
const locationRoutes = require("./routes/location.routes");

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors({
    origin: "*"
}));

app.use(express.json());


// ==========================================
// HTTP SERVER
// ==========================================

const server = http.createServer(app);


// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


// ==========================================
// SOCKET CONNECTION
// ==========================================

io.on("connection", (socket) => {

    console.log("Socket connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });

});


// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes)
app.use("/api/location", locationRoutes);


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "TSMS Backend is running"
    });
});


// ==========================================
// DATABASE TEST
// ==========================================

app.get("/api/test-db", async (req, res) => {

    try {

        const [rows] = await pool.query(
            "SELECT 1 AS result"
        );

        res.json({
            success: true,
            message: "Database connected successfully",
            result: rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });

    }

});


// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});