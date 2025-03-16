/**
 * Constructs a full URL by combining the backend URL with a path
 */
export const constructCallbackUrl = (path, req) => {
  const baseUrl = getBackendUrl()(req).replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Gets the backend URL dynamically
 */
export const getBackendUrl = () => {
  if (process.env.NODE_ENV === "production") {
    // In production, get URL from request
    return (req) => {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      return `${protocol}://${host}`;
    };
  } else {
    // In development, use default port
    return () => `http://localhost:${process.env.PORT || 8000}`;
  }
};

/**
 * Validates if a URL is from an allowed origin
 */
export const isAllowedOrigin = (url) => {
  try {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");
    return allowedOrigins.includes(url);
  } catch (error) {
    return false;
  }
};
