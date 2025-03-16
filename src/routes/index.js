import { Router } from "express";
import userRouter from "./user.js";
import authRouter from "./auth.js";
import participantsRouter from "./participant.js";
import mailRouter from "./mail.js";
import paymentRouter from "./payment.js";
import emailRouter from "./email.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRouter = Router();

const mountRoutes = (app) => {
  // Serve API documentation at root
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/api-docs.html"));
  });

  app.use("/api/v1", apiRouter);
  apiRouter.use("/auth", authRouter);
  apiRouter.use("/user", userRouter);
  apiRouter.use("/participant", participantsRouter);
  apiRouter.use("/mail", mailRouter);
  apiRouter.use("/payment", paymentRouter);
  apiRouter.use("/email", emailRouter);

  //handle undefined routes
  app.all("*", (req, res) => {
    res.status(404).json({ message: "route not found" });
  });

  //error handling middleware
  app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });
};

export default mountRoutes;
