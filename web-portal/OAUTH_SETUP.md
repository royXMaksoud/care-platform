# OAuth Setup Guide

This guide explains how to configure OAuth authentication with Google and Microsoft for the Care Portal.

## Overview

The application supports OAuth/OIDC authentication with:
- **Google** - Sign in with Google account
- **Microsoft** - Sign in with Microsoft/Azure AD account

## Backend Configuration

### 1. Application Properties

Add the following to `auth-service/src/main/resources/application.yml`:

```yaml
oauth:
  google:
    client-id: ${OAUTH_GOOGLE_CLIENT_ID:}
    client-secret: ${OAUTH_GOOGLE_CLIENT_SECRET:}
  microsoft:
    client-id: ${OAUTH_MICROSOFT_CLIENT_ID:}
    client-secret: ${OAUTH_MICROSOFT_CLIENT_SECRET:}
    tenant-id: ${OAUTH_MICROSOFT_TENANT_ID:common}
```

### 2. Environment Variables

Set the following environment variables (or add to your `.env` file):

```bash
# Google OAuth
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
OAUTH_MICROSOFT_CLIENT_ID=your-microsoft-client-id
OAUTH_MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
OAUTH_MICROSOFT_TENANT_ID=common  # or your specific tenant ID
```

## Frontend Configuration

### Environment Variables

Create a `.env.local` file in `web-portal/` directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:8090

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
VITE_MICROSOFT_TENANT_ID=common
```

**Important**: The client IDs in the frontend `.env` file must match the backend configuration.

## Getting OAuth Credentials

### Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Enter project name (e.g., "Care Portal")
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Care Portal"
   
5. **Configure Authorized Redirect URIs**
   - Add for development: `http://localhost:5173/oauth/callback`
   - Add for production: `https://your-domain.com/oauth/callback`
   
6. **Copy Credentials**
   - Copy the Client ID and Client Secret
   - Add them to your backend environment variables
   - Add Client ID to your frontend `.env.local`

### Microsoft OAuth Setup

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com/

2. **Navigate to Azure Active Directory**
   - Search for "Azure Active Directory" in the search bar
   - Click on "App registrations" in the left menu

3. **Register a New Application**
   - Click "New registration"
   - Name: "Care Portal"
   - Supported account types: Choose based on your needs
     - "Accounts in this organizational directory only" - Single tenant
     - "Accounts in any organizational directory" - Multi-tenant
     - "Accounts in any organizational directory and personal Microsoft accounts" - Multi-tenant + personal
   - Redirect URI:
     - Platform: Web
     - URL: `http://localhost:5173/oauth/callback` (development)
   - Click "Register"

4. **Configure Authentication**
   - Go to "Authentication" in the left menu
   - Add additional redirect URIs if needed (production URL)
   - Under "Implicit grant and hybrid flows":
     - Check "ID tokens" (for OpenID Connect)
   - Click "Save"

5. **Create Client Secret**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Description: "Care Portal Secret"
   - Expires: Choose expiration period (e.g., 24 months)
   - Click "Add"
   - **Important**: Copy the secret value immediately (it won't be shown again)

6. **Configure API Permissions**
   - Go to "API permissions"
   - Click "Add a permission"
   - Microsoft Graph → Delegated permissions
   - Add:
     - `openid`
     - `email`
     - `profile`
     - `User.Read`
   - Click "Add permissions"
   - (Optional) Click "Grant admin consent" if you're an admin

7. **Copy Credentials**
   - Application (client) ID: Copy this to your configuration
   - Directory (tenant) ID: Copy this (or use "common" for multi-tenant)
   - Client secret: Use the value you copied earlier
   - Add them to your backend environment variables
   - Add Client ID and Tenant ID to your frontend `.env.local`

## Testing OAuth Flow

### Development Testing

1. **Start Backend Services**
   ```bash
   cd auth-service
   mvn spring-boot:run
   ```

2. **Start Frontend**
   ```bash
   cd web-portal
   npm run dev
   ```

3. **Test OAuth Login**
   - Navigate to `http://localhost:5173/auth/login`
   - Click "Continue with Google" or "Continue with Microsoft"
   - Authorize the application
   - You should be redirected back and logged in

### Troubleshooting

**"redirect_uri_mismatch" Error**
- Verify that the redirect URI in your OAuth provider settings exactly matches the one in your application
- For development: `http://localhost:5173/oauth/callback`
- For production: `https://your-domain.com/oauth/callback`
- No trailing slashes
- Protocol (http/https) must match

**"invalid_client" Error**
- Check that client ID and client secret are correct
- Ensure environment variables are loaded properly
- Restart the backend service after changing environment variables

**"access_denied" Error**
- User cancelled the OAuth flow
- User's account doesn't have permission
- Check API permissions in Azure/Google console

**CORS Errors**
- Ensure your backend CORS configuration allows requests from your frontend origin
- Check gateway-service CORS settings if using API gateway

## Production Deployment

### Backend

1. Set production OAuth credentials as environment variables
2. Update redirect URIs in OAuth provider settings
3. Use HTTPS for all redirect URIs
4. Store client secrets securely (use secret management service)

### Frontend

1. Update `.env.production` with production API URL and client IDs
2. Ensure redirect URIs match your production domain
3. Use HTTPS for production deployment

### Security Considerations

1. **Never commit secrets to version control**
   - Add `.env*` to `.gitignore`
   - Use environment variables or secret management

2. **Use HTTPS in production**
   - OAuth requires HTTPS for security
   - HTTP is only acceptable for localhost development

3. **Validate state parameter**
   - The application includes CSRF protection via state parameter
   - Don't disable this in production

4. **Client secret rotation**
   - Regularly rotate OAuth client secrets
   - Update both backend and OAuth provider when rotating

5. **Monitor OAuth usage**
   - Check Azure/Google console for usage statistics
   - Set up alerts for unusual activity

## Account Linking Behavior

The application implements intelligent account linking:

1. **First-time OAuth user**
   - Creates new user account
   - Links OAuth provider to account
   - Account type: `GENERAL` (can be changed by admin)
   - Email verified automatically if provider confirms it

2. **Existing email with different auth method**
   - Links OAuth provider to existing account
   - User can now sign in with both password and OAuth
   - Useful for users who initially registered with email/password

3. **OAuth user returning**
   - Authenticates via OAuth provider
   - Updates last login time
   - No duplicate accounts created

4. **Multiple OAuth providers**
   - Users can link multiple OAuth providers to one account
   - Sign in with any linked provider
   - Managed in user profile settings (future feature)

## API Endpoints

### Backend Endpoints

- `POST /auth/oauth/callback` - Exchange OAuth code for JWT token
- `GET /auth/oauth/authorize/{provider}` - Get OAuth authorization URL (helper)

### Request/Response Examples

**OAuth Callback Request:**
```json
{
  "provider": "google",
  "code": "4/0AX4XfWh...",
  "redirectUri": "http://localhost:5173/oauth/callback",
  "state": "abc123"
}
```

**OAuth Callback Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "fullName": "John Doe",
  "isNewUser": true,
  "provider": "GOOGLE",
  "language": "en"
}
```

## Database Schema

OAuth accounts are stored in the `identity_provider_accounts` table:

```sql
CREATE TABLE identity_provider_accounts (
    identity_provider_account_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(200) NOT NULL,
    provider_email VARCHAR(200),
    is_email_verified BOOLEAN,
    linked_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    UNIQUE (provider, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs for error details
3. Check browser console for frontend errors
4. Verify OAuth provider configuration

