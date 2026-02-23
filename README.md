# BluV2 Backend - Multi-Tenant Platform

Backend API for BluAssist chatbot platform with multi-tenant support.

## Features

- Multi-tenant architecture
- Tenant onboarding flow (4 steps)
- JWT-based authentication
- Role-based access control
- PostgreSQL database with Sequelize ORM

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - `DB_NAME`: PostgreSQL database name (default: bluv2)
   - `DB_USER`: PostgreSQL username (default: postgres)
   - `DB_PASSWORD`: PostgreSQL password (default: postgres)
   - `DB_HOST`: PostgreSQL host (default: localhost)
   - `DB_PORT`: PostgreSQL port (default: 5432)
   - `JWT_SECRET`: Secret key for JWT tokens
   - `PORT`: Server port (default: 3000)
   - `SYNC_DB`: Set to 'true' in development to auto-sync models (default: false)

4. Create PostgreSQL database:
```bash
createdb bluv2
# Or using psql:
# psql -U postgres
# CREATE DATABASE bluv2;
```

5. Start PostgreSQL (if running locally):
```bash
# macOS with Homebrew
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Or use Docker
docker run --name postgres-bluv2 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bluv2 -p 5432:5432 -d postgres
```

6. Start the server:
```bash
npm start
```

**Note:** In development, you can set `SYNC_DB=true` in `.env` to automatically sync database models. In production, use migrations instead.

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Tenant Onboarding

- `POST /api/tenants/register` - Register new tenant (Step 1)
- `GET /api/tenants/onboarding/status` - Get onboarding status (protected)
- `PUT /api/tenants/onboarding/company` - Update company details (Step 2, protected)
- `PUT /api/tenants/onboarding/chatbot` - Configure chatbot (Step 3, protected)
- `POST /api/tenants/onboarding/complete` - Complete onboarding (Step 4, protected)
- `GET /api/tenants/me` - Get current tenant details (protected)

## Onboarding Flow

1. **Registration** - Tenant provides basic info (name, email, type, admin user details)
2. **Company Details** - Add company/organization information
3. **Chatbot Configuration** - Customize chatbot appearance and welcome message
4. **Completion** - Activate tenant account (defaults to free plan)

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Tenant Types

- `fintech` - Financial technology companies
- `personal` - Personal users

## Subscription Plans

- `free` - Basic features
- `basic` - Standard features
- `premium` - Advanced features
- `enterprise` - Full features with custom support

## Database Models

### Tenant
- Basic information (name, email, type, slug)
- Company details
- Chatbot configuration
- Subscription plan
- API credentials
- Onboarding status

### User
- Authentication (email, password)
- Personal information
- Role (super_admin, tenant_admin, tenant_user)
- Tenant association
- Status tracking

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // For validation errors
}
```

## Development

- Uses Express.js framework
- MongoDB with Mongoose ODM
- JWT for authentication
- Express Validator for input validation
- CORS enabled for cross-origin requests
