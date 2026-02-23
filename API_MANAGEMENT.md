# API Management Documentation

## Overview

This document describes the API endpoints for managing API keys, chatbot configuration, and user profiles.

## API Key Management

### Get API Keys
**Endpoint:** `GET /api/tenants/api-keys`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": "550e8400-e29b-41d4-a716-446655440000",
    "apiSecret": "660e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2026-02-20T10:00:00.000Z"
  }
}
```

### Regenerate API Key
**Endpoint:** `POST /api/tenants/api-keys/regenerate-key`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "API key regenerated successfully",
  "data": {
    "apiKey": "new-uuid-api-key",
    "apiSecret": "existing-api-secret"
  }
}
```

### Regenerate API Secret
**Endpoint:** `POST /api/tenants/api-keys/regenerate-secret`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "API secret regenerated successfully",
  "data": {
    "apiKey": "existing-api-key",
    "apiSecret": "new-uuid-api-secret"
  }
}
```

### Regenerate Both API Key and Secret
**Endpoint:** `POST /api/tenants/api-keys/regenerate-both`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "API credentials regenerated successfully",
  "data": {
    "apiKey": "new-uuid-api-key",
    "apiSecret": "new-uuid-api-secret"
  }
}
```

## Chatbot Configuration

### Get Chatbot Configuration
**Endpoint:** `GET /api/chatbot/config`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chatbotConfig": {
      "name": "BluAssist",
      "welcomeMessage": "Hello! How can I help you today?",
      "theme": {
        "primaryColor": "#007bff",
        "secondaryColor": "#6c757d"
      },
      "enabled": false
    }
  }
}
```

### Update Chatbot Configuration
**Endpoint:** `PUT /api/chatbot/config`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "name": "My Custom Chatbot",
  "welcomeMessage": "Welcome! How can I assist you?",
  "primaryColor": "#0066ff",
  "secondaryColor": "#333333",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chatbot configuration updated successfully",
  "data": {
    "chatbotConfig": {
      "name": "My Custom Chatbot",
      "welcomeMessage": "Welcome! How can I assist you?",
      "theme": {
        "primaryColor": "#0066ff",
        "secondaryColor": "#333333"
      },
      "enabled": true
    }
  }
}
```

**Validation Rules:**
- `name`: Optional, 1-50 characters
- `welcomeMessage`: Optional, 1-500 characters
- `primaryColor`: Optional, valid hex color (e.g., #007bff)
- `secondaryColor`: Optional, valid hex color (e.g., #6c757d)
- `enabled`: Optional, boolean

### Toggle Chatbot
**Endpoint:** `PUT /api/chatbot/toggle`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Chatbot enabled successfully",
  "data": {
    "chatbotConfig": {
      "name": "BluAssist",
      "welcomeMessage": "Hello! How can I help you today?",
      "theme": {
        "primaryColor": "#007bff",
        "secondaryColor": "#6c757d"
      },
      "enabled": true
    }
  }
}
```

### Reset Chatbot Configuration
**Endpoint:** `POST /api/chatbot/reset`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Chatbot configuration reset to defaults",
  "data": {
    "chatbotConfig": {
      "name": "BluAssist",
      "welcomeMessage": "Hello! How can I help you today?",
      "theme": {
        "primaryColor": "#007bff",
        "secondaryColor": "#6c757d"
      },
      "enabled": false
    }
  }
}
```

## User Management

### Get User Profile
**Endpoint:** `GET /api/users/profile`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant_admin",
      "status": "active",
      "emailVerified": true,
      "lastLogin": "2026-02-20T10:00:00.000Z",
      "createdAt": "2026-02-20T09:00:00.000Z",
      "updatedAt": "2026-02-20T10:00:00.000Z",
      "tenant": {
        "id": "tenant-uuid",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "email": "admin@acmecorp.com",
        "type": "fintech",
        "status": "active"
      }
    }
  }
}
```

### Update User Profile
**Endpoint:** `PUT /api/users/profile`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "tenant_admin",
      "status": "active",
      "emailVerified": true,
      "lastLogin": "2026-02-20T10:00:00.000Z",
      "createdAt": "2026-02-20T09:00:00.000Z",
      "updatedAt": "2026-02-20T10:30:00.000Z",
      "tenant": {
        "id": "tenant-uuid",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "email": "admin@acmecorp.com",
        "type": "fintech",
        "status": "active"
      }
    }
  }
}
```

**Validation Rules:**
- `firstName`: Optional, 1-50 characters
- `lastName`: Optional, 1-50 characters
- `email`: Optional, valid email format (must be unique)

### Change Password
**Endpoint:** `PUT /api/users/change-password`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Validation Rules:**
- `currentPassword`: Required
- `newPassword`: Required, minimum 8 characters, must contain uppercase, lowercase, and number
- New password must be different from current password

**Note:** Changing password revokes all existing refresh tokens for security.

### Get User Activity
**Endpoint:** `GET /api/users/activity`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Activity logs feature coming soon",
  "data": {
    "activities": []
  }
}
```

## Error Responses

All endpoints return consistent error responses:

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Email is already in use",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "No tenant associated with user"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Tenant not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error message (development only)"
}
```

## Security Notes

1. **API Keys**: Store securely, never expose in client-side code
2. **Password Changes**: Automatically revoke all refresh tokens
3. **Email Changes**: Must be unique across all users
4. **Authentication**: All endpoints require valid JWT access token
5. **Tenant Isolation**: Users can only manage their own tenant's resources
