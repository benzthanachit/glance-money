// Core data types for Glance Money application

export interface User {
  id: string;
  email: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: 'th' | 'en';
  currency: 'THB' | 'USD' | 'EUR';
  theme: 'light' | 'dark' | 'system';
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: Date;
  isRecurring: boolean;
  recurringParentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
}

// Calculated data types
export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netStatus: number;
  categoryBreakdown: CategorySummary[];
  monthlyTrend: MonthlyData[];
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  netStatus: number;
}

// Component prop types
export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentPage: 'home' | 'transactions' | 'goals' | 'settings';
}

export interface BottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export interface FABProps {
  onClick: () => void;
  variant: 'primary' | 'secondary';
  position: 'center-bottom' | 'bottom-right';
}

export interface NetStatusCardProps {
  netAmount: number;
  currency: string;
  locale: 'th' | 'en';
  theme: 'positive' | 'negative';
}

export interface TransactionFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Transaction>;
  onSubmit: (data: TransactionData) => void;
  onCancel: () => void;
}

export interface TransactionData {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: Date;
  isRecurring: boolean;
}

export interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  groupBy?: 'date' | 'category';
}

// Goal-related types
export interface GoalTransaction {
  id: string;
  goalId: string;
  transactionId: string;
  allocatedAmount: number;
  createdAt: Date;
}

export interface GoalWithProgress {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  progressPercentage: number;
  remainingAmount: number;
  allocatedTransactions?: GoalTransaction[];
}

export interface GoalSummary {
  totalGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  averageProgress: number;
  goalsCompleted: number;
}

// Goal component prop types
export interface GoalsOverviewProps {
  goals: Goal[];
  onCreateGoal: () => void;
  onEditGoal: (id: string) => void;
}

export interface GoalProgressCardProps {
  goal: GoalWithProgress;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAllocateTransaction: (goalId: string) => void;
}