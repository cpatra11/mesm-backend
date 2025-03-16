import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12; // Increased from 10 for better security

export const generateToken = (email, userId, isAdmin = false) => {
  if (!email || !userId) {
    throw new Error("Email and userId are required for token generation");
  }

  const payload = {
    email,
    id: userId,
    is_admin: Boolean(isAdmin), // Ensure boolean value
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

export const hashPassword = async (password) => {
  if (!password) throw new Error("Password is required");
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  if (!password || !hash) throw new Error("Password and hash are required");
  return bcrypt.compare(password, hash);
};
