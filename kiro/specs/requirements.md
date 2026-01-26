# Requirements Document

## Introduction

Glance Money is a mobile-first progressive web application designed as "The Simplest Expense Tracker in the World." The system prioritizes ease of use on mobile devices while providing comprehensive expense tracking capabilities with visual financial status indicators.

## Glossary

- **System**: The Glance Money expense tracking application
- **User**: A person using the application to track expenses and income
- **Transaction**: A financial entry representing income or expense
- **Net_Status**: Calculated value representing financial health (Income - Total Expenses)
- **FAB**: Floating Action Button for quick transaction entry
- **Touch_Target**: Interactive UI element sized for mobile touch interaction
- **Recurring_Transaction**: A transaction that repeats monthly (subscriptions, rent, etc.)
- **Category**: Classification system for transactions (Food, Transport, Fixed Cost, DCA)
- **Goal**: User-defined financial target with progress tracking
- **Mobile_Viewport**: Screen width below 768px (md breakpoint)
- **Desktop_Viewport**: Screen width 768px and above
- **Locale**: Language and regional setting (Thai or English)
- **Default_Language**: Thai language as the primary interface language

## Requirements

### Requirement 1: Mobile-First Navigation

**User Story:** As a mobile user, I want intuitive navigation optimized for thumb usage, so that I can quickly access all app features while on the go.

#### Acceptance Criteria

1. WHEN the viewport is mobile size, THE System SHALL display a bottom navigation bar with Home, Transactions, Goals, and Settings tabs
2. WHEN the viewport is desktop size, THE System SHALL display a sidebar or top navigation bar instead of bottom navigation
3. THE System SHALL ensure all Touch_Targets are minimum 44px in height for easy mobile interaction
4. WHEN a user taps a navigation item, THE System SHALL provide immediate visual feedback and navigate to the selected section

### Requirement 2: Quick Transaction Entry

**User Story:** As a user logging expenses on the go, I want a prominent and easily accessible way to add transactions, so that I can quickly record expenses without navigating through multiple screens.

#### Acceptance Criteria

1. THE System SHALL display a Floating Action Button (FAB) prominently positioned for thumb accessibility
2. WHEN a user taps the FAB, THE System SHALL open the transaction entry interface
3. THE System SHALL provide a clear Income/Expense toggle at the top of the entry form
4. WHEN creating a transaction, THE System SHALL allow users to select from predefined categories using simple icons
5. THE System SHALL provide a checkbox option to mark transactions as Recurring_Transaction for monthly repetition

### Requirement 3: Responsive Dashboard Layout

**User Story:** As a user, I want a dashboard that adapts to my device screen size, so that I can view my financial status clearly whether on mobile or desktop.

#### Acceptance Criteria

1. WHEN viewing on Mobile_Viewport, THE System SHALL display a full-width Net Status card at the top followed by vertically stacked summary cards
2. WHEN viewing on Desktop_Viewport, THE System SHALL display a grid layout with the Net Status card and charts/graphs positioned side-by-side
3. THE System SHALL ensure all dashboard elements are touch-friendly on mobile devices
4. WHEN the layout changes between viewports, THE System SHALL maintain all functionality and data visibility

### Requirement 4: Financial Status Calculation and Visualization

**User Story:** As a user, I want to immediately see my financial health status, so that I can quickly understand whether I'm spending within my means.

#### Acceptance Criteria

1. THE System SHALL calculate Net_Status as Income minus the sum of Fixed Costs, Subscriptions, Variable Expenses, and DCA
2. WHEN Net_Status is negative, THE System SHALL change the main theme accent color to red
3. WHEN Net_Status is positive, THE System SHALL change the main theme accent color to green
4. THE System SHALL display the Net_Status prominently in a hero section of the dashboard
5. THE System SHALL update the Net_Status calculation immediately when transactions are added, modified, or deleted

### Requirement 5: Transaction Management

**User Story:** As a user, I want to view and manage all my transactions, so that I can track my spending patterns and make corrections when needed.

#### Acceptance Criteria

1. THE System SHALL display all transactions in a chronologically organized list
2. WHEN displaying transactions, THE System SHALL show the amount, category, date, and transaction type (income/expense)
3. THE System SHALL allow users to edit existing transactions
4. THE System SHALL allow users to delete transactions with confirmation
5. WHEN a Recurring_Transaction is created, THE System SHALL automatically generate future instances monthly

### Requirement 6: Category System

**User Story:** As a user, I want to categorize my transactions using simple visual indicators, so that I can quickly organize my expenses without complex input.

#### Acceptance Criteria

1. THE System SHALL provide predefined categories: Food, Transport, Fixed Cost, and DCA (Dollar Cost Averaging)
2. THE System SHALL represent each category with a distinct, recognizable icon
3. WHEN selecting a category, THE System SHALL provide visual feedback for the selected option
4. THE System SHALL allow users to filter transactions by category
5. THE System SHALL display category-based spending summaries on the dashboard

### Requirement 7: Financial Goals Tracking

**User Story:** As a user, I want to set and track financial goals, so that I can work toward specific savings targets like a wedding fund or car down payment.

#### Acceptance Criteria

1. THE System SHALL allow users to create named financial goals with target amounts
2. THE System SHALL display progress bars showing completion percentage for each goal
3. WHEN viewing on Mobile_Viewport, THE System SHALL present goals as swipeable cards or a compact list
4. WHEN viewing on Desktop_Viewport, THE System SHALL display goals in a grid or sidebar layout
5. THE System SHALL allow users to allocate transactions toward specific goals

### Requirement 8: Data Persistence and Synchronization

**User Story:** As a user, I want my financial data to be securely stored and accessible across devices, so that I can access my expense tracking from anywhere.

#### Acceptance Criteria

1. THE System SHALL store all user data in a Supabase PostgreSQL database
2. THE System SHALL synchronize data in real-time across all user sessions
3. THE System SHALL maintain data integrity during offline usage and sync when connection is restored
4. THE System SHALL provide secure user authentication and data isolation
5. THE System SHALL backup user data automatically to prevent loss

### Requirement 9: Progressive Web App Features

**User Story:** As a mobile user, I want the app to behave like a native mobile application, so that I can install it on my device and use it offline when needed.

#### Acceptance Criteria

1. THE System SHALL function as a Progressive Web App with offline capabilities
2. THE System SHALL be installable on mobile devices through browser prompts
3. THE System SHALL provide a native app-like experience with appropriate icons and splash screens
4. THE System SHALL cache essential functionality for offline transaction entry
5. THE System SHALL sync offline transactions when connectivity is restored

### Requirement 10: Internationalization Support

**User Story:** As a Thai user, I want the application to be available in Thai language by default with English as an alternative, so that I can use the app in my preferred language.

#### Acceptance Criteria

1. THE System SHALL display Thai language as the Default_Language for all interface elements
2. THE System SHALL provide English language as an alternative Locale option
3. THE System SHALL allow users to switch between Thai and English languages in settings
4. THE System SHALL persist the user's language preference across sessions
5. THE System SHALL format numbers, dates, and currency according to the selected Locale
6. THE System SHALL support Thai Baht (฿) and other currencies based on Locale selection

### Requirement 11: Performance and Responsiveness

**User Story:** As a user, I want the application to load quickly and respond immediately to my interactions, so that expense tracking doesn't become a burden in my daily routine.

#### Acceptance Criteria

1. THE System SHALL load the initial dashboard within 2 seconds on mobile networks
2. THE System SHALL respond to user interactions within 100 milliseconds
3. THE System SHALL optimize images and assets for mobile bandwidth constraints
4. THE System SHALL implement lazy loading for non-critical dashboard components
5. THE System SHALL maintain smooth animations and transitions on mobile devices