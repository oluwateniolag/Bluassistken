# API Examples - Tenant Onboarding

## Base URL
```
http://localhost:3000/api
```

## 1. Register New Tenant (Step 1)

**Endpoint:** `POST /tenants/register`

**Request:**
```json
{
  "name": "Acme Fintech",
  "email": "admin@acmefintech.com",
  "type": "fintech",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenant": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Acme Fintech",
      "slug": "acme-fintech",
      "email": "admin@acmefintech.com",
      "type": "fintech",
      "status": "pending",
      "onboardingStep": 1
    },
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "email": "admin@acmefintech.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant_admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 2. Login

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "admin@acmefintech.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "email": "admin@acmefintech.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant_admin",
      "tenant": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Acme Fintech",
        "slug": "acme-fintech",
        "status": "pending",
        "onboardingCompleted": false,
        "onboardingStep": 1
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 3. Get Onboarding Status

**Endpoint:** `GET /tenants/onboarding/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "onboardingCompleted": false,
    "onboardingStep": 1,
    "status": "pending",
    "tenant": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Acme Fintech",
      "email": "admin@acmefintech.com",
      "type": "fintech"
    }
  }
}
```

## 4. Update Company Details (Step 2)

**Endpoint:** `PUT /tenants/onboarding/company`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "companyName": "Acme Financial Technologies Inc.",
  "website": "https://www.acmefintech.com",
  "phone": "+1-555-0123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Company details updated successfully",
  "data": {
    "tenant": {
      "id": "507f1f77bcf86cd799439011",
      "companyName": "Acme Financial Technologies Inc.",
      "website": "https://www.acmefintech.com",
      "phone": "+1-555-0123",
      "onboardingStep": 2
    }
  }
}
```

## 5. Configure Chatbot (Step 3)

**Endpoint:** `PUT /tenants/onboarding/chatbot`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "chatbotName": "Acme Assistant",
  "welcomeMessage": "Welcome to Acme Fintech! How can I assist you today?",
  "primaryColor": "#0066CC",
  "secondaryColor": "#333333"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chatbot configured successfully",
  "data": {
    "tenant": {
      "id": "507f1f77bcf86cd799439011",
      "chatbotConfig": {
        "name": "Acme Assistant",
        "welcomeMessage": "Welcome to Acme Fintech! How can I assist you today?",
        "theme": {
          "primaryColor": "#0066CC",
          "secondaryColor": "#333333"
        },
        "enabled": false
      },
      "onboardingStep": 3
    }
  }
}
```

## 6. Select Plan (Step 4)

**Endpoint:** `PUT /tenants/onboarding/plan`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "plan": "premium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan selected successfully",
  "data": {
    "tenant": {
      "id": "507f1f77bcf86cd799439011",
      "plan": "premium",
      "subscriptionStartDate": "2026-02-20T10:00:00.000Z",
      "subscriptionEndDate": "2026-03-22T10:00:00.000Z",
      "onboardingStep": 4
    }
  }
}
```

## 7. Complete Onboarding (Step 5)

**Endpoint:** `POST /tenants/onboarding/complete`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully! Welcome to BluAssist.",
  "data": {
    "tenant": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Acme Fintech",
      "slug": "acme-fintech",
      "status": "active",
      "onboardingCompleted": true,
      "apiKey": "550e8400-e29b-41d4-a716-446655440000",
      "chatbotConfig": {
        "name": "Acme Assistant",
        "welcomeMessage": "Welcome to Acme Fintech! How can I assist you today?",
        "theme": {
          "primaryColor": "#0066CC",
          "secondaryColor": "#333333"
        },
        "enabled": false
      }
    }
  }
}
```

## 8. Get Current Tenant

**Endpoint:** `GET /tenants/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Acme Fintech",
      "slug": "acme-fintech",
      "email": "admin@acmefintech.com",
      "type": "fintech",
      "status": "active",
      "apiKey": "550e8400-e29b-41d4-a716-446655440000",
      "apiSecret": "660e8400-e29b-41d4-a716-446655440001",
      "onboardingCompleted": true,
      "onboardingStep": 5,
      "companyName": "Acme Financial Technologies Inc.",
      "website": "https://www.acmefintech.com",
      "phone": "+1-555-0123",
      "chatbotConfig": {
        "name": "Acme Assistant",
        "welcomeMessage": "Welcome to Acme Fintech! How can I assist you today?",
        "theme": {
          "primaryColor": "#0066CC",
          "secondaryColor": "#333333"
        },
        "enabled": false
      },
      "plan": "premium",
      "subscriptionStartDate": "2026-02-20T10:00:00.000Z",
      "subscriptionEndDate": "2026-03-22T10:00:00.000Z",
      "createdAt": "2026-02-20T10:00:00.000Z",
      "updatedAt": "2026-02-20T10:30:00.000Z"
    }
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Tenant name is required",
      "param": "name",
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
