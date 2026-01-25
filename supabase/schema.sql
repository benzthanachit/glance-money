-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{
    "language": "th",
    "currency": "THB",
    "theme": "system"
  }'::jsonb
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense', 'both')) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name, icon, type, is_default) VALUES
  ('Food', '🍽️', 'expense', true),
  ('Transport', '🚗', 'expense', true),
  ('Fixed Cost', '🏠', 'expense', true),
  ('DCA', '📈', 'expense', true),
  ('Salary', '💰', 'income', true),
  ('Freelance', '💼', 'income', true);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_parent_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(12,2) DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal_transactions junction table for allocating transactions to goals
CREATE TABLE public.goal_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(12,2) NOT NULL CHECK (allocated_amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, transaction_id)
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(category);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goal_transactions_goal_id ON public.goal_transactions(goal_id);
CREATE INDEX idx_goal_transactions_transaction_id ON public.goal_transactions(transaction_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Transactions table policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Goals table policies
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Goal transactions table policies
CREATE POLICY "Users can view own goal transactions" ON public.goal_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.goals 
            WHERE goals.id = goal_transactions.goal_id 
            AND goals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own goal transactions" ON public.goal_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.goals 
            WHERE goals.id = goal_transactions.goal_id 
            AND goals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own goal transactions" ON public.goal_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.goals 
            WHERE goals.id = goal_transactions.goal_id 
            AND goals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own goal transactions" ON public.goal_transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.goals 
            WHERE goals.id = goal_transactions.goal_id 
            AND goals.user_id = auth.uid()
        )
    );

-- Categories table policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view categories" ON public.categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate net status
CREATE OR REPLACE FUNCTION public.calculate_net_status(user_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  total_income DECIMAL(12,2) := 0;
  total_expenses DECIMAL(12,2) := 0;
BEGIN
  -- Calculate total income
  SELECT COALESCE(SUM(amount), 0) INTO total_income
  FROM public.transactions
  WHERE user_id = user_uuid AND type = 'income';
  
  -- Calculate total expenses
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM public.transactions
  WHERE user_id = user_uuid AND type = 'expense';
  
  RETURN total_income - total_expenses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category summary
CREATE OR REPLACE FUNCTION public.get_category_summary(user_uuid UUID)
RETURNS TABLE(
  category VARCHAR(50),
  amount DECIMAL(12,2),
  transaction_count BIGINT,
  percentage DECIMAL(5,2)
) AS $$
DECLARE
  total_expenses DECIMAL(12,2);
BEGIN
  -- Get total expenses for percentage calculation
  SELECT COALESCE(SUM(t.amount), 0) INTO total_expenses
  FROM public.transactions t
  WHERE t.user_id = user_uuid AND t.type = 'expense';
  
  -- Return category summary
  RETURN QUERY
  SELECT 
    t.category,
    COALESCE(SUM(t.amount), 0) as amount,
    COUNT(*) as transaction_count,
    CASE 
      WHEN total_expenses > 0 THEN ROUND((COALESCE(SUM(t.amount), 0) / total_expenses * 100), 2)
      ELSE 0
    END as percentage
  FROM public.transactions t
  WHERE t.user_id = user_uuid AND t.type = 'expense'
  GROUP BY t.category
  ORDER BY amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;