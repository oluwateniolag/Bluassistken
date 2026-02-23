# Tenant Onboarding Flow

## Overview

The tenant onboarding system is a 4-step process that guides fintech companies and personal users through setting up their BluAssist chatbot account.

## Onboarding Steps

### Step 1: Registration
**Endpoint:** `POST /api/tenants/register`

The tenant provides:
- Tenant name
- Email address
- Tenant type (fintech or personal)
- Admin user details (first name, last name, password)

**What happens:**
- A new tenant record is created with status "pending"
- A tenant admin user account is created
- A unique slug is generated from the tenant name
- API credentials (apiKey, apiSecret) are automatically generated
- A JWT token is returned for immediate authentication
- Onboarding step is set to 1

### Step 2: Company Details
**Endpoint:** `PUT /api/tenants/onboarding/company`

The tenant provides:
- Company/Organization name (optional)
- Website URL (optional)
- Phone number (optional)

**What happens:**
- Company information is saved to the tenant record
- Onboarding step advances to 2

### Step 3: Chatbot Configuration
**Endpoint:** `PUT /api/tenants/onboarding/chatbot`

The tenant customizes:
- Chatbot name (default: "BluAssist")
- Welcome message
- Primary color (hex code)
- Secondary color (hex code)

**What happens:**
- Chatbot configuration is saved
- Onboarding step advances to 3
- Chatbot remains disabled until onboarding is complete

### Step 4: Completion
**Endpoint:** `POST /api/tenants/onboarding/complete`

**What happens:**
- Onboarding is marked as complete
- Tenant status changes from "pending" to "active"
- Onboarding step is set to 4
- Default plan is set to "free" with 30-day subscription
- Chatbot is enabled
- Tenant can now use the platform

## Status Tracking

### Tenant Statuses
- `pending` - Tenant registered but onboarding not complete
- `active` - Tenant fully onboarded and active
- `suspended` - Tenant temporarily suspended
- `inactive` - Tenant deactivated

### Onboarding Steps
- `1` - Registration complete
- `2` - Company details added
- `3` - Chatbot configured
- `4` - Onboarding complete

## Authentication Flow

1. **Registration** - User registers and receives a JWT token
2. **Login** - User logs in with email/password and receives a JWT token
3. **Protected Routes** - All onboarding routes (except registration) require:
   - Valid JWT token in Authorization header: `Bearer <token>`
   - User must belong to an active tenant
   - Tenant must exist and be accessible

## Data Models

### Tenant Model
- Basic info: name, slug, email, type
- Company details: companyName, website, phone
- Chatbot config: name, welcomeMessage, theme colors
- Subscription: plan, start/end dates
- Status: status, onboardingCompleted, onboardingStep
- API: apiKey, apiSecret
- Metadata: flexible key-value store

### User Model
- Authentication: email, password (hashed)
- Personal info: firstName, lastName
- Role: super_admin, tenant_admin, tenant_user
- Tenant association: reference to Tenant
- Status: active, inactive, suspended
- Tracking: lastLogin, emailVerified

## Security Features

1. **Password Hashing** - Bcrypt with salt rounds
2. **JWT Tokens** - Secure token-based authentication
3. **Tenant Isolation** - Users can only access their own tenant data
4. **Role-Based Access** - Different roles have different permissions
5. **Input Validation** - Express-validator for all inputs
6. **API Keys** - Unique API credentials for each tenant

## Error Handling

The API provides consistent error responses:
- **400** - Validation errors or bad requests
- **401** - Authentication required or invalid credentials
- **403** - Insufficient permissions or tenant not active
- **404** - Resource not found
- **500** - Server errors

## Next Steps After Onboarding

Once onboarding is complete, tenants can:
1. Access their dashboard
2. Configure chatbot settings
3. View API credentials
4. Manage users
5. Update subscription
6. Integrate chatbot using API keys

## API Integration

After onboarding, tenants receive:
- **API Key** - Public identifier for API requests
- **API Secret** - Private key for authentication
- **Tenant Slug** - URL-friendly identifier

These credentials can be used to:
- Make API calls to manage chatbot
- Embed chatbot widget
- Access tenant-specific resources
