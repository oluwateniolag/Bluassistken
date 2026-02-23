# Authentication & Authorization Guide

## Overview

The BluAssist platform uses JWT-based authentication with refresh tokens for secure access management.

## Key Features

- **One User Per Tenant**: Each tenant can only have one user account
- **Super Admin**: Platform super admin can oversee all tenants
- **Refresh Tokens**: Long-lived refresh tokens for seamless user experience
- **Password Management**: Change password and reset password functionality

## Authentication Flow

### 1. Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
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
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant_admin",
      "tenant": {
        "id": "tenant-uuid",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "status": "active",
        "onboardingCompleted": true,
        "onboardingStep": 5
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123def456..."
  }
}
```

### 2. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "abc123def456..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Logout

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "refreshToken": "abc123def456..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Password Management

### Change Password

**Endpoint:** `PUT /api/auth/change-password`

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

**Note:** Changing password revokes all existing refresh tokens for security.

### Request Password Reset

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

**Note:** In development mode, the reset token is returned in the response. In production, it should be sent via email.

### Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Note:** Reset tokens expire after 1 hour. Resetting password revokes all existing refresh tokens.

## Token Configuration

- **Access Token**: Short-lived (default: 15 minutes)
- **Refresh Token**: Long-lived (default: 7 days)
- **Reset Token**: Expires after 1 hour

Configure in `.env`:
```env
JWT_SECRET=your-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

## User Roles

### Super Admin
- Role: `super_admin`
- Can access all tenants
- No tenant association required
- Created via seed script

### Tenant Admin
- Role: `tenant_admin`
- One per tenant
- Full access to their tenant
- Created during tenant registration

### Tenant User
- Role: `tenant_user`
- Limited access (if implemented)
- Belongs to a tenant

## Super Admin Setup

Create the super admin user:

```bash
npm run seed:superadmin
```

Or set environment variables:
```env
SUPER_ADMIN_EMAIL=admin@bluassist.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123
```

## Tenant-User Relationship

- **One-to-One**: Each tenant has exactly one user
- **Unique Constraint**: `tenantId` is unique in the users table
- **Super Admin Exception**: Super admin users don't have a tenant

## Security Features

1. **Password Hashing**: Bcrypt with salt rounds
2. **Token Revocation**: Refresh tokens can be revoked
3. **Token Expiry**: All tokens have expiration times
4. **Password Reset**: Secure token-based reset flow
5. **Account Status**: Inactive/suspended accounts cannot authenticate

## Protected Routes

All routes except login, refresh, forgot-password, and reset-password require authentication:

```
Authorization: Bearer <accessToken>
```

## Error Responses

### Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Token Expired (401)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Invalid Refresh Token (401)
```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```
