import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { LanguageProvider } from '@/lib/contexts/language-context'
import { CurrencyFormatter } from '@/components/ui/currency-formatter'

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

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Basic Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Transaction Form Integration', () => {
    it('should render and interact with transaction form', async () => {
      const mockOnSubmit = vi.fn()
      const mockOnCancel = vi.fn()

      render(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Check basic elements are rendered
      expect(screen.getByRole('heading', { name: 'Add Transaction' })).toBeInTheDocument()
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
      expect(screen.getByText('Expense')).toBeInTheDocument()
      expect(screen.getByText('Income')).toBeInTheDocument()

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByText('Food')).toBeInTheDocument()
      })

      // Test form interaction
      const amountInput = screen.getByLabelText('Amount')
      fireEvent.change(amountInput, { target: { value: '100' } })
      expect(amountInput).toHaveValue(100)

      // Test category selection
      const foodCategory = screen.getByText('Food')
      fireEvent.click(foodCategory)

      // Test form submission
      const submitButton = screen.getByRole('button', { name: 'Add Transaction' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100,
            type: 'expense',
            category: 'food',
          })
        )
      })
    })

    it('should validate form fields', async () => {
      const mockOnSubmit = vi.fn()

      render(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={() => {}}
        />
      )

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: 'Add Transaction' })
      fireEvent.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Amount is required')).toBeInTheDocument()
        expect(screen.getByText('Category is required')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should toggle between income and expense', async () => {
      render(
        <TransactionForm
          mode="create"
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      )

      const incomeButton = screen.getByText('Income')
      const expenseButton = screen.getByText('Expense')

      // Initially expense should be selected
      expect(expenseButton).toHaveClass('bg-red-500')

      // Click income
      fireEvent.click(incomeButton)
      expect(incomeButton).toHaveClass('bg-green-500')

      // Should show income categories
      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument()
      })
    })
  })

  describe('Language Context Integration', () => {
    function TestLanguageComponent() {
      return (
        <div>
          <div data-testid="currency">
            <CurrencyFormatter amount={1234.56} locale="th" />
          </div>
          <div data-testid="currency-en">
            <CurrencyFormatter amount={1234.56} locale="en" />
          </div>
        </div>
      )
    }

    it('should format currency in different locales', () => {
      render(
        <LanguageProvider initialLocale="th">
          <TestLanguageComponent />
        </LanguageProvider>
      )

      const thaiCurrency = screen.getByTestId('currency')
      const englishCurrency = screen.getByTestId('currency-en')

      expect(thaiCurrency).toHaveTextContent('฿1,234.56')
      expect(englishCurrency).toBeInTheDocument()
    })

    it('should provide language context', () => {
      function TestComponent() {
        return <div data-testid="test">Test</div>
      }

      render(
        <LanguageProvider initialLocale="th">
          <TestComponent />
        </LanguageProvider>
      )

      expect(screen.getByTestId('test')).toBeInTheDocument()
    })
  })

  describe('Form Accessibility', () => {
    it('should have proper form labels and inputs', () => {
      render(
        <TransactionForm
          mode="create"
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      )

      // Check form accessibility
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
      expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument()
      expect(screen.getByLabelText('Date')).toBeInTheDocument()
      expect(screen.getByLabelText('Repeat monthly (recurring transaction)')).toBeInTheDocument()
    })

    it('should have mobile-optimized inputs', () => {
      render(
        <TransactionForm
          mode="create"
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      )

      const amountInput = screen.getByLabelText('Amount')
      expect(amountInput).toHaveAttribute('type', 'number')
      expect(amountInput).toHaveAttribute('inputMode', 'decimal')
      expect(amountInput).toHaveAttribute('step', '0.01')
    })
  })

  describe('Component Integration', () => {
    it('should handle form cancellation', () => {
      const mockOnCancel = vi.fn()

      render(
        <TransactionForm
          mode="create"
          onSubmit={() => {}}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should populate form in edit mode', () => {
      const initialData = {
        amount: 50.25,
        type: 'income' as const,
        category: 'salary',
        description: 'Test income',
        date: new Date('2024-01-15'),
        isRecurring: false,
      }

      render(
        <TransactionForm
          mode="edit"
          initialData={initialData}
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      )

      expect(screen.getByRole('heading', { name: 'Edit Transaction' })).toBeInTheDocument()
      expect(screen.getByDisplayValue('50.25')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test income')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should clear validation errors when user corrects input', async () => {
      render(
        <TransactionForm
          mode="create"
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      )

      // Submit to trigger validation errors
      const submitButton = screen.getByRole('button', { name: 'Add Transaction' })
      fireEvent.click(submitButton)

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText('Amount is required')).toBeInTheDocument()
      })

      // Fix the amount error
      const amountInput = screen.getByLabelText('Amount')
      fireEvent.change(amountInput, { target: { value: '100' } })

      // Amount error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Amount is required')).not.toBeInTheDocument()
      })
    })
  })
})