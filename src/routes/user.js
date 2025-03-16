import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import verifyAuth from "../middlewares/verifyAuth.js";
import { verifyAdmin } from "../middlewares/verifyAuth.js";

const router = Router();

// Reorder routes to put most specific first
router.get("/all", verifyAuth, verifyAdmin, userController.getUsers);
router.get("/:id", verifyAuth, verifyAdmin, userController.getUserDetails);
router.post("/", verifyAuth, verifyAdmin, userController.createUser);
router.put("/:id", verifyAuth, verifyAdmin, userController.updateUser);
router.delete("/:id", verifyAuth, verifyAdmin, userController.deleteUser);
// Change PATCH to POST for better compatibility
router.post("/toggleadmin", verifyAdmin, userController.toggleAdmin);

export default router;
