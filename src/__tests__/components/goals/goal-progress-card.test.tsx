import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { GoalProgressCard } from '@/components/goals/goal-progress-card'
import { GoalWithProgress } from '@/lib/types'

// Mock the currency formatter
vi.mock('@/components/ui/currency-formatter', () => ({
  CurrencyFormatter: ({ amount }: { amount: number }) => <span>฿{amount.toFixed(2)}</span>
}))

// Mock the date formatter
vi.mock('@/components/ui/date-formatter', () => ({
  DateFormatter: ({ date }: { date: Date }) => <span>{date.toLocaleDateString()}</span>
}))

const mockGoal: GoalWithProgress = {
  id: '1',
  userId: 'user1',
  name: 'Emergency Fund',
  targetAmount: 100000,
  currentAmount: 25000,
  deadline: new Date('2026-12-31'), // Future date
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  progressPercentage: 25,
  remainingAmount: 75000,
}

const defaultProps = {
  goal: mockGoal,
  currency: 'THB' as const,
  locale: 'en' as const,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onAllocateTransaction: vi.fn(),
}

describe('GoalProgressCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders goal information correctly', () => {
    render(<GoalProgressCard {...defaultProps} />)
    
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('25.0%')).toBeInTheDocument()
    expect(screen.getByText('฿25000.00')).toBeInTheDocument()
    expect(screen.getByText('฿100000.00')).toBeInTheDocument()
  })

  it('shows completed status for completed goals', () => {
    const completedGoal = {
      ...mockGoal,
      currentAmount: 100000,
      progressPercentage: 100,
      remainingAmount: 0,
    }
    
    render(<GoalProgressCard {...defaultProps} goal={completedGoal} />)
    
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.queryByText('Allocate Money')).not.toBeInTheDocument()
  })

  it('shows overdue status for overdue goals', () => {
    const overdueGoal = {
      ...mockGoal,
      deadline: new Date('2023-12-31'), // Past date
    }
    
    render(<GoalProgressCard {...defaultProps} goal={overdueGoal} />)
    
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    render(<GoalProgressCard {...defaultProps} />)
    
    const editButton = screen.getByLabelText('Edit goal')
    fireEvent.click(editButton)
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith('1')
  })

  it('calls onDelete when delete button is clicked', () => {
    render(<GoalProgressCard {...defaultProps} />)
    
    const deleteButton = screen.getByLabelText('Delete goal')
    fireEvent.click(deleteButton)
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('1')
  })

  it('calls onAllocateTransaction when allocate button is clicked', () => {
    render(<GoalProgressCard {...defaultProps} />)
    
    const allocateButton = screen.getByText('Allocate Money')
    fireEvent.click(allocateButton)
    
    expect(defaultProps.onAllocateTransaction).toHaveBeenCalledWith('1')
  })

  it('renders Thai locale correctly', () => {
    render(<GoalProgressCard {...defaultProps} locale="th" />)
    
    expect(screen.getByText('กำลังดำเนินการ')).toBeInTheDocument()
    expect(screen.getByText('ความคืบหน้า')).toBeInTheDocument()
    expect(screen.getByText('ยังต้องการ')).toBeInTheDocument()
    expect(screen.getByText('จัดสรรเงิน')).toBeInTheDocument()
  })
})