import { query as db } from "../db/db.js";

export const verifySessionToken = async (token) => {
  const session = await db(
    `
    SELECT s.*, u.* 
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = $1 
    AND s.is_valid = true
    AND s.expires_at > CURRENT_TIMESTAMP
  `,
    [token]
  );

  if (!session.rows[0]) {
    throw new Error("Invalid or expired session");
  }

  return session.rows[0];
};
