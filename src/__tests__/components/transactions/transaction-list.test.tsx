import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { TransactionList } from '@/components/transactions/transaction-list'
import { Transaction } from '@/lib/types/database'

// Mock the language context hook
vi.mock('@/lib/contexts/language-context', () => ({
  useLocale: () => 'en'
}))

const mockTransactions: Transaction[] = [
  {
    id: '1',
    user_id: 'user1',
    amount: 50.00,
    type: 'expense',
    category: 'food',
    description: 'Lunch at restaurant',
    date: '2024-01-15',
    is_recurring: false,
    recurring_parent_id: null,
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  },
  {
    id: '2',
    user_id: 'user1',
    amount: 3000.00,
    type: 'income',
    category: 'salary',
    description: 'Monthly salary',
    date: '2024-01-01',
    is_recurring: true,
    recurring_parent_id: null,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T09:00:00Z'
  }
]

describe('TransactionList', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    mockOnEdit.mockClear()
    mockOnDelete.mockClear()
  })

  const renderTransactionList = (props = {}) => {
    return render(
      <TransactionList
        transactions={mockTransactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        {...props}
      />
    )
  }

  it('renders transactions in chronological order (newest first)', () => {
    renderTransactionList()
    
    const transactionCards = screen.getAllByText(/Food|Salary/)
    expect(transactionCards[0]).toHaveTextContent('Food') // Jan 15 (newest)
    expect(transactionCards[1]).toHaveTextContent('Salary') // Jan 1 (oldest)
  })

  it('displays transaction details correctly', () => {
    renderTransactionList()
    
    // Check if all required information is displayed
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
    expect(screen.getByText('Monthly salary')).toBeInTheDocument()
    
    // Check for recurring indicator
    expect(screen.getByText('Recurring')).toBeInTheDocument()
  })

  it('shows income and expense with correct formatting', () => {
    renderTransactionList()
    
    // Check that amounts are displayed with currency formatting
    expect(screen.getByText(/THB 50\.00/)).toBeInTheDocument()
    expect(screen.getByText(/THB 3,000\.00/)).toBeInTheDocument()
  })

  it('calls onEdit when mobile edit button is clicked', () => {
    renderTransactionList()
    
    // Click the mobile edit button (visible text "Edit")
    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])
    
    expect(mockOnEdit).toHaveBeenCalledWith('1') // First transaction ID
  })

  it('shows empty state when no transactions', () => {
    render(
      <TransactionList
        transactions={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    
    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    expect(screen.getByText('Start tracking your expenses by adding your first transaction')).toBeInTheDocument()
  })

  it('groups transactions by date by default', () => {
    renderTransactionList()
    
    // Should show date group headers
    expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument()
    expect(screen.getByText(/January 1, 2024/)).toBeInTheDocument()
  })

  it('shows mobile action buttons', () => {
    renderTransactionList()
    
    // Mobile buttons should be present
    const mobileEditButtons = screen.getAllByText('Edit')
    const mobileDeleteButtons = screen.getAllByText('Delete')
    
    expect(mobileEditButtons).toHaveLength(2) // One for each transaction
    expect(mobileDeleteButtons).toHaveLength(2)
  })
})