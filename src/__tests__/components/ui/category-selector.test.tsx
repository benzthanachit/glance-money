import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategorySelector } from '@/components/ui/category-selector'
import { Category } from '@/lib/types/database'

const mockCategories: Category[] = [
  {
    id: 'food',
    name: 'Food',
    icon: '🍽️',
    type: 'expense',
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: '🚗',
    type: 'expense',
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'salary',
    name: 'Salary',
    icon: '💰',
    type: 'income',
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('CategorySelector', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  it('renders categories in grid format by default', () => {
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory=""
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('🍽️')).toBeInTheDocument()
    expect(screen.getByText('🚗')).toBeInTheDocument()
    expect(screen.getByText('💰')).toBeInTheDocument()
  })

  it('shows visual feedback for selected category', () => {
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory="food"
        onSelect={mockOnSelect}
      />
    )

    const foodButton = screen.getByRole('button', { name: /food/i })
    expect(foodButton).toHaveClass('border-primary', 'bg-primary/10')
  })

  it('calls onSelect when category is clicked', () => {
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory=""
        onSelect={mockOnSelect}
      />
    )

    const foodButton = screen.getByRole('button', { name: /food/i })
    fireEvent.click(foodButton)

    expect(mockOnSelect).toHaveBeenCalledWith('food')
  })

  it('renders in list format when specified', () => {
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory=""
        onSelect={mockOnSelect}
        variant="list"
      />
    )

    // Check that the container has the list layout class
    const container = screen.getByText('Food').closest('button')?.parentElement
    expect(container).toHaveClass('space-y-2')
  })

  it('shows "All Categories" option when showAllOption is true', () => {
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory=""
        onSelect={mockOnSelect}
        showAllOption={true}
      />
    )

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('📊')).toBeInTheDocument()
  })

  it('calls onSelect with empty string when "All" is clicked', () => {
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory="food"
        onSelect={mockOnSelect}
        showAllOption={true}
      />
    )

    const allButton = screen.getByRole('button', { name: /all/i })
    fireEvent.click(allButton)

    expect(mockOnSelect).toHaveBeenCalledWith('')
  })
})