import { query as db } from "../db/db.js";
import logger from "../config/logger.js";

export const validateEmailTemplate = async (req, res, next) => {
  const { name, subject, content, variables } = req.body;

  if (!name || !subject || !content) {
    return res.status(400).json({
      success: false,
      message: "Name, subject and content are required",
    });
  }

  try {
    // Check if template name already exists
    const existing = await db(
      "SELECT id FROM email_templates WHERE name = $1",
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Template with this name already exists",
      });
    }

    next();
  } catch (error) {
    logger.error("Template validation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate template",
    });
  }
};
