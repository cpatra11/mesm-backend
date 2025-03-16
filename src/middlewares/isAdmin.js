import { query as db } from "../db/db.js";

const isAdmin = async (req, res, next) => {
  const id = req.user.id;
  // db logic to check if user is admin
  let currentUser = await db("SELECT * FROM users WHERE id = $1", [id]);
  currentUser = currentUser.rows[0];
  if (!currentUser.admin) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

export default isAdmin;
