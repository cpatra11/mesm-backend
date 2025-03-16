#### Use Neon DB for backend, the migrations are in migrations folder, the seeds are in seed folder. First run migrations, then seed

### ENVs

```bash
# Server Configuration

PORT=8000
NODE_ENV=development
BACKEND_URL=http://localhost:8000

# JWT Configuration

JWT_SECRET=your_jwt_secret_key_here
JWT_LIFETIME=1d

# Database Configuration

DATABASE_URL=your_database_url_here

# Google OAuth Configuration

GOOGLE_OAUTH_URL=https://accounts.google.com/o/oauth2/v2/auth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_ACCESS_TOKEN_URL=https://oauth2.googleapis.com/token
GOOGLE_USER_INFO_URL=https://www.googleapis.com/oauth2/v3/userinfo

# Frontend URLs

REGISTRATION_FRONTEND_URL=your_registration_frontend_url_here
ADMIN_DASHBOARD_URL=http://localhost:5173

# CORS Configuration

ALLOWED_ORIGINS=http://localhost:5174,http://localhost:5173

# Email Configuration

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your_smtp_password_here
EMAIL_FROM="Mesmerizer NSEC <youremail@gmail.com>"
SKIP_EMAIL_VERIFICATION=true

# For Production (uncomment when deploying)

# BACKEND_URL=https://api.yourdomain.com
# REGISTRATION_FRONTEND_URL=https://register.yourdomain.com
# ADMIN_DASHBOARD_URL=https://admin.yourdomain.com
# ALLOWED_ORIGINS=https://register.yourdomain.com,https://admin.yourdomain.com

## API Documentation

### Base URL
```

http://localhost:8000/api/v1

````

### Authentication

All routes except registration and login require authentication via session cookie.

#### Google OAuth Login
```http
GET /auth/google
````

Initiates Google OAuth flow. Redirects to Google login page.

#### Get Current User

```http
GET /auth/me
Response: {
  "user": {
    "id": number,
    "name": string,
    "email": string,
    "is_admin": boolean
  }
}
```

### Event Registration

#### Register for Event

```http
POST /participant/register
Content-Type: multipart/form-data

Body: {
  "eventTitle": string,
  "eventCode": string,
  "eventDay": string,
  "eventTime": string,
  "eventLocation": string,
  "teamSize": number,
  "teamLeadName": string,
  "participantNames": string[],
  "email": string,
  "whatsappNumber": string,
  "alternatePhone": string,
  "college": string,
  "upiTransectionId": string,
  "paySS": File
}

Response: {
  "success": boolean,
  "registration": {
    "id": number,
    "status": "pending" | "approved" | "rejected",
    ...
  }
}
```

### Admin Endpoints

Requires admin privileges. Add `withCredentials: true` to axios config.

#### Get All Registrations

```http
GET /participant/registrations

Query Parameters:
- day: string (optional)
- event: string (optional)
- status: "pending" | "approved" | "rejected" (optional)
- search: string (optional)

Response: {
  "registrations": [{
    "id": number,
    "event_name": string,
    "team_lead_name": string,
    "email": string,
    "status": string,
    "payment_status": string,
    "created_at": string,
    ...
  }]
}
```

#### Update Registration Status

```http
POST /participant/registration/:id/status
Content-Type: application/json

Body: {
  "status": "approved" | "rejected",
  "reason": string  // Required if status is "rejected"
}

Response: {
  "success": boolean,
  "message": string,
  "registration": object
}
```

#### Email Templates

```http
GET /email/templates

Response: {
  "success": boolean,
  "templates": [{
    "id": number,
    "name": string,
    "subject": string,
    "template_type": string,
    "content": string,
    "variables": object
  }]
}
```

```http
PUT /email/templates/:id
Content-Type: application/json

Body: {
  "name": string,
  "subject": string,
  "content": string,
  "variables": object
}

Response: {
  "success": boolean,
  "message": string,
  "template": object
}
```

### Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden (Admin only)
- 404: Not Found
- 500: Internal Server Error

### Example Usage (React + Axios)

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true,
});

// Registration
const register = async (formData: FormData) => {
  try {
    const response = await api.post("/participant/register", formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin: Get Registrations
const getRegistrations = async (filters = {}) => {
  try {
    const response = await api.get("/participant/registrations", {
      params: filters,
    });
    return response.data.registrations;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin: Update Status
const updateStatus = async (id: number, status: string, reason?: string) => {
  try {
    const response = await api.post(`/participant/registration/${id}/status`, {
      status,
      reason,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```
