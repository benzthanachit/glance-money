import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { TransactionData } from '@/lib/types'

// Mock the category service
vi.mock('@/lib/services/categoryService', () => ({
  categoryService: {
    getCategories: vi.fn().mockResolvedValue([]),
    getDefaultCategories: vi.fn().mockReturnValue([
      {
        id: 'food',
        name: 'Food',
        icon: '🍽️',
        type: 'expense',
        is_default: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'transport',
        name: 'Transport',
        icon: '🚗',
        type: 'expense',
        is_default: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'salary',
        name: 'Salary',
        icon: '💰',
        type: 'income',
        is_default: true,
        created_at: new Date().toISOString(),
      },
    ])
  }
}))

describe('TransactionForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form with default values', async () => {
    render(
      <TransactionForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByRole('heading', { name: 'Add Transaction' })).toBeInTheDocument()
    expect(screen.getByText('Expense')).toBeInTheDocument()
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument()
    })
  })

  it('toggles between income and expense types', async () => {
    render(
      <TransactionForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const incomeButton = screen.getByText('Income')
    const expenseButton = screen.getByText('Expense')

    // Initially expense should be selected
    expect(expenseButton).toHaveClass('bg-red-500')
    expect(incomeButton).not.toHaveClass('bg-green-500')

    // Click income
    fireEvent.click(incomeButton)
    expect(incomeButton).toHaveClass('bg-green-500')
    expect(expenseButton).not.toHaveClass('bg-red-500')

    // Wait for categories to update
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })
  })

  it('validates required fields', async () => {
    render(
      <TransactionForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Add Transaction' })
    
    // Try to submit without filling required fields
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument()
      expect(screen.getByText('Category is required')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    render(
      <TransactionForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Fill in the form
    const amountInput = screen.getByLabelText('Amount')
    fireEvent.change(amountInput, { target: { value: '100.50' } })

    // Wait for categories to load and select one
    await waitFor(() => {
      const foodCategory = screen.getByText('Food')
      fireEvent.click(foodCategory)
    })

    const descriptionInput = screen.getByLabelText('Description (Optional)')
    fireEvent.change(descriptionInput, { target: { value: 'Test transaction' } })

    const submitButton = screen.getByRole('button', { name: 'Add Transaction' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: 100.50,
        type: 'expense',
        category: 'food',
        description: 'Test transaction',
        date: expect.any(Date),
        isRecurring: false,
      })
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <TransactionForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('renders edit form with initial data', async () => {
    const initialData = {
      amount: 50.25,
      type: 'income' as const,
      category: 'salary',
      description: 'Monthly salary',
      date: new Date('2024-01-15'),
      isRecurring: true,
    }

    render(
      <TransactionForm
        mode="edit"
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Edit Transaction')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50.25')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Monthly salary')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
    
    const recurringCheckbox = screen.getByLabelText('Repeat monthly (recurring transaction)')
    expect(recurringCheckbox).toBeChecked()

    // Income should be selected
    const incomeButton = screen.getByText('Income')
    expect(incomeButton).toHaveClass('bg-green-500')
  })

  it('handles recurring transaction checkbox', async () => {
    render(
      <TransactionForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const recurringCheckbox = screen.getByLabelText('Repeat monthly (recurring transaction)')
    expect(recurringCheckbox).not.toBeChecked()

    fireEvent.click(recurringCheckbox)
    expect(recurringCheckbox).toBeChecked()
  })

  it('optimizes amount input for mobile numeric keypad', () => {
    render(
      <TransactionForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const amountInput = screen.getByLabelText('Amount')
    expect(amountInput).toHaveAttribute('type', 'number')
    expect(amountInput).toHaveAttribute('inputMode', 'decimal')
    expect(amountInput).toHaveAttribute('step', '0.01')
  })
})