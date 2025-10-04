# Authentication System

## Overview

WorldVibe uses **Supabase Authentication** with magic link (passwordless) login for the admin panel. The system is configured for a single admin user with email whitelist enforcement.

## Architecture

### Authentication Flow

```
User visits /sys-control
  ↓
Email form displayed
  ↓
User enters email
  ↓
Supabase sends magic link email
  ↓
User clicks link in email
  ↓
Redirected to /auth/callback
  ↓
Code exchanged for session
  ↓
Email whitelist check
  ↓
Authorized: Access granted → Unauthorized: Access denied
```

### Key Components

#### 1. Supabase Clients (`/src/lib/supabase/`)

**Browser Client** (`client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Server Client** (`server.ts`):
- Server-side authentication with cookie management
- Used in API routes and server components
- Handles cookie read/write/delete operations

**Middleware** (`middleware.ts`):
- Automatic session refresh on every request
- Updates authentication cookies
- Runs before all protected routes

#### 2. Auth Guard (`/src/app/sys-control/auth-guard.tsx`)

Three authentication states:

1. **Unauthenticated**: No session → Show login form
2. **Authenticated but Unauthorized**: Valid session but wrong email → Show error
3. **Fully Authorized**: Valid session + whitelisted email → Grant access

**Email Whitelist**:
```typescript
const ADMIN_EMAIL = "stackcurious@gmail.com";
```

Only this email can access the admin panel.

#### 3. OAuth Callback Handler (`/src/app/auth/callback/route.ts`)

Handles the magic link callback:
- Receives OAuth code from Supabase
- Exchanges code for session token
- Redirects to admin panel or login page

## Configuration

### Environment Variables

Required in `.env`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://nfbgvzqpmjfpeapxjgxh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Admin Access Control
ADMIN_EMAIL="stackcurious@gmail.com"
```

### Supabase Dashboard Settings

**Site URL Configuration**:
- Site URL: `http://localhost:3000` (development)
- Redirect URLs: `http://localhost:3000/auth/callback`

For production, update to:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/auth/callback`

### Email Template

Supabase sends magic link emails automatically. You can customize the email template in:
- Supabase Dashboard → Authentication → Email Templates → Magic Link

## Security Features

### 1. Email Whitelist Enforcement

Only `stackcurious@gmail.com` can access the admin panel:

```typescript
if (session?.user) {
  const email = session.user.email;
  if (email === ADMIN_EMAIL) {
    setIsAuthenticated(true);
    setIsAuthorized(true);
  } else {
    setIsAuthenticated(true);
    setIsAuthorized(false);
    setError(`Unauthorized: Only ${ADMIN_EMAIL} can access this panel`);
  }
}
```

### 2. Obscured Admin Path

Admin panel is at `/sys-control` instead of obvious `/admin` path for security through obscurity.

### 3. Session Management

- Sessions automatically refresh via middleware
- Cookies are HTTP-only and secure
- Session state synced across tabs via `onAuthStateChange`

### 4. Server-Side Validation

All API routes in `/api/sys-control/*` should validate authentication server-side:

```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proceed with authorized logic
}
```

## Usage

### Logging In

1. Navigate to `http://localhost:3000/sys-control`
2. Enter your email address (must be `stackcurious@gmail.com`)
3. Check your email for the magic link
4. Click the link to authenticate
5. You'll be redirected back to the admin panel

### Logging Out

```typescript
const supabase = createClient();
await supabase.auth.signOut();
```

### Checking Authentication Status

```typescript
const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  console.log('Authenticated:', session.user.email);
} else {
  console.log('Not authenticated');
}
```

## Testing

### Local Development Testing

1. Start dev server: `npm run dev`
2. Visit `http://localhost:3000/sys-control`
3. Enter whitelisted email
4. Check terminal/logs for magic link (in development mode)
5. Click link to authenticate

### Testing Unauthorized Access

1. Create a test email in Supabase (not in whitelist)
2. Try to log in with test email
3. Should see: "Unauthorized: Only stackcurious@gmail.com can access this panel"

## Troubleshooting

### "Email not confirmed" error

**Cause**: Supabase requires email confirmation by default

**Solution**: In Supabase Dashboard:
- Go to Authentication → Settings
- Disable "Enable email confirmations" (for development)
- Or click the confirmation link sent to email

### Magic link not working

**Cause**: Redirect URL mismatch

**Solution**: Verify in Supabase Dashboard:
- Authentication → URL Configuration
- Ensure redirect URL matches exactly: `http://localhost:3000/auth/callback`

### Session not persisting

**Cause**: Cookie configuration or middleware issues

**Solution**:
- Check middleware is running (should see `updateSession` logs)
- Verify cookies are being set (check browser dev tools)
- Ensure `middleware.ts` matcher includes your routes

### "Invalid session" after login

**Cause**: Session refresh failing

**Solution**:
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Verify Supabase project is active
- Check network tab for failed API calls to Supabase

## Migration from Password-Based Auth

If migrating from password-based authentication:

1. Remove old password fields from UI
2. Replace login logic with magic link flow
3. Update session validation to use Supabase
4. Remove password hashing/validation code
5. Update email templates in Supabase Dashboard

## Best Practices

1. **Always validate server-side**: Never trust client-side authentication alone
2. **Use environment variables**: Never hardcode credentials
3. **Implement rate limiting**: Prevent magic link spam
4. **Monitor auth events**: Log authentication attempts
5. **Rotate keys regularly**: Update Supabase anon key periodically
6. **Use HTTPS in production**: Ensure secure cookie transmission

## Related Documentation

- [Admin Panel Documentation](./ADMIN_PANEL.md)
- [Database Setup](./DATABASE.md)
- [Supabase Official Docs](https://supabase.com/docs/guides/auth)
