import fetch from "node-fetch";
import logger from "../config/logger.js";

export async function getGoogleTokens(code, callbackUrl) {
  logger.info("Using callback URL:", callbackUrl);

  const response = await fetch(process.env.GOOGLE_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    logger.error("Token exchange failed:", data);
    throw new Error(data.error_description || "Failed to exchange auth code");
  }

  return data;
}

export async function getGoogleUserInfo(accessToken) {
  const response = await fetch(process.env.GOOGLE_USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    logger.error("Failed to get user info:", data);
    throw new Error("Failed to get user info");
  }

  return data;
}
