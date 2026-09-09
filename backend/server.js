const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const path = require("path");
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

    console.log(
        "Socket connected:",
        socket.id
    );


    // ==========================================
    // TOURIST STARTS TOUR
    // ==========================================

    socket.on("tourist:start", (data) => {

        console.log(
            "Tourist tracking started:",
            data
        );


        if (!data || !data.userId) {

            console.log(
                "Invalid tourist:start data"
            );

            return;

        }


        // Put tourist into their own room

        socket.join(
            `tourist_${data.userId}`
        );


        console.log(
            `Tourist ${data.userId} joined tracking room`
        );

    });


    // ==========================================
    // TOURIST LOCATION UPDATE
    // ==========================================

    socket.on("tourist:location", (data) => {

        console.log(
            "LIVE LOCATION:",
            data
        );


        if (
            !data ||
            !data.userId ||
            data.latitude === undefined ||
            data.longitude === undefined
        ) {

            console.log(
                "Invalid location data"
            );

            return;

        }


        // Send live location to admin dashboard

        io.emit(
            "tourist:location",
            data
        );

    });


    // ==========================================
    // TOURIST STOPS TOUR
    // ==========================================

    socket.on("tourist:stop", (data) => {

        console.log(
            "Tourist tracking stopped:",
            data
        );


        if (!data || !data.userId) {

            return;

        }


        // Tell admin dashboard

        io.emit(
            "tourist:stop",
            data
        );


        // Remove tourist from room

        socket.leave(
            `tourist_${data.userId}`
        );

    });


    // ==========================================
    // SOCKET DISCONNECTED
    // ==========================================

    socket.on("disconnect", () => {

        console.log(
            "Socket disconnected:",
            socket.id
        );

    });

});


// ==========================================
// API ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/location",
    locationRoutes
);


// ==========================================
// DATABASE TEST
// ==========================================

app.get(
    "/api/test-db",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(
                    "SELECT 1 AS result"
                );


            res.json({

                success: true,

                message:
                    "Database connected successfully",

                result: rows

            });

        } catch (error) {

            console.error(
                "Database error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Database connection failed"

            });

        }

    }
);


// ==========================================
// SERVE REACT FRONTEND
// ==========================================

const frontendPath =
    path.join(
        __dirname,
        "../dist"
    );


console.log(
    "Frontend path:",
    frontendPath
);


app.use(
    express.static(frontendPath)
);


// ==========================================
// REACT ROUTER FALLBACK
// ==========================================

app.use(
    (req, res, next) => {

        // Do not handle API requests here

        if (
            req.path.startsWith("/api/")
        ) {

            return next();

        }


        res.sendFile(
            path.join(
                frontendPath,
                "index.html"
            )
        );

    }
);


// ==========================================
// API 404
// ==========================================

app.use(
    (req, res) => {

        if (
            req.path.startsWith("/api/")
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "API route not found"

            });

        }


        res.status(404).send(
            "Page not found"
        );

    }
);


// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;


server.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);