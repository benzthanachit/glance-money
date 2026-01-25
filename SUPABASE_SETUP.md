# Supabase Setup for Development

## Disable Email Confirmation (Development Only)

For development purposes, you can disable email confirmation to make testing easier:

### Option 1: Supabase Dashboard Settings
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings**
3. Under **User Signups**, set:
   - **Enable email confirmations**: OFF
   - **Enable phone confirmations**: OFF (if using phone auth)

### Option 2: Environment Variables
Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Development settings
NODE_ENV=development
```

### Option 3: Manual User Creation (Temporary)
If you need to create a test user manually:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user"
3. Enter email and password
4. Set "Email Confirmed" to true
5. Click "Create user"

## Database Schema
Make sure your database has the proper schema by running the SQL in `supabase/schema.sql`.

## Testing the Setup
1. Try signing up with a new email
2. The user should be created immediately without email verification
3. You should be redirected to the dashboard
4. Check the `users` table in Supabase to confirm the user profile was created

## Production Setup
For production, remember to:
1. Re-enable email confirmations
2. Set up proper email templates
3. Configure email delivery settings
4. Set up proper redirect URLs