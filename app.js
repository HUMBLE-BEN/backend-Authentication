const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./src/config/db");
const ENV = require("./src/config/env");
const authRouter = require("./src/routes/auth.router");

const app = express();

// middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        message: "API is healthy",
        timestamp: new Date().toISOString(),
    });
});

// routes
app.use("/auth", authRouter);

// Global error handler (must come after all routes)
app.use((req, res) => {
    res.status(404).json({
        status: "page not found",
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
    });
});

// error handler (4 arguments)
// app.use((err, req, res, next) => {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Internal server error" })
// })

const startServer = async () => {
    await connectDB();
    app.listen(ENV.port, () => {
        console.log("server is running on port", ENV.port);
    });
};

startServer();