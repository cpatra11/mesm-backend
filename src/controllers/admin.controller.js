import logger from "../config/logger.js";
import { query as db } from "../db/db.js";

export const adminController = {
  toggleAdmin: async (req, res) => {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: "ID parameter is missing" });
      }

      if (parseInt(id) == req.user.id) {
        return res
          .status(403)
          .json({ message: "You can't change your own admin status" });
      }

      const user = await db("SELECT * FROM users WHERE id = $1", [id]);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await db(
        "UPDATE users SET admin = NOT admin WHERE id = $1 RETURNING *",
        [id]
      );
      logger.info(
        `User ${updatedUser.rows[0].email} is now ${
          updatedUser.rows[0].admin ? "an admin" : "not an admin"
        }`
      );
      res.status(200).json({
        message: `${updatedUser.rows[0].name} is now ${
          updatedUser.rows[0].admin ? "an admin" : "not an admin"
        }`,
        user: updatedUser.rows[0],
      });
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
