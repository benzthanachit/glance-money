# Supabase Database Setup

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings

## Setup Instructions

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Update the values in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Schema

Run the SQL schema in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Execute the SQL

This will create:
- All necessary tables (users, transactions, goals, categories, goal_transactions)
- Row Level Security (RLS) policies for data isolation
- Database functions for calculations
- Triggers for automatic user creation
- Indexes for performance

### 3. Authentication Setup

The schema includes:
- Automatic user profile creation when users sign up
- Row Level Security to ensure users only access their own data
- Support for email/password authentication

### 4. Default Categories

The schema automatically creates default categories:
- Food (🍽️) - expense
- Transport (🚗) - expense  
- Fixed Cost (🏠) - expense
- DCA (📈) - expense
- Salary (💰) - income
- Freelance (💼) - income

## Database Functions

### calculate_net_status(user_uuid)
Calculates the net financial status (income - expenses) for a user.

### get_category_summary(user_uuid)
Returns spending breakdown by category with amounts, counts, and percentages.

## Row Level Security

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Categories are readable by all authenticated users
- Goal transactions are accessible only to goal owners
- Automatic user profile creation on signup

## Testing the Setup

After running the schema, you can test the setup by:
1. Creating a user account through your app
2. Verifying the user profile is created automatically
3. Testing that RLS policies prevent cross-user data access