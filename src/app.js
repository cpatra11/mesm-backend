import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import mountRoutes from "./routes/index.js";
import path from "path";
import logger from "./config/logger.js"; // Add this import

const app = express();

// Permissive CORS configuration for all environments
const corsConfig = {
  origin: function (origin, callback) {
    // Allow all origins
    callback(null, true);

    // Log origins in production for monitoring
    if (process.env.NODE_ENV === "production") {
      console.log(`CORS request from origin: ${origin}`);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-VERIFY",
    "X-MERCHANT-ID",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["set-cookie"],
};

// Apply CORS configuration
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

app.use(cookieParser());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    origin: req.headers.origin,
    userIP: req.ip,
  });
  next();
});

// Add static file serving for uploaded images
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Add error handling middleware before routes
app.use((err, req, res, next) => {
  logger.error("API Error:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
  });

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", req.headers.origin);

  const errorResponse = {
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(err.status || 500).json(errorResponse);
});

// Routes
mountRoutes(app);

export default app;
