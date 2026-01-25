import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { GoalForm } from '@/components/goals/goal-form'
import { GoalWithProgress } from '@/lib/types'

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
  mode: 'create' as const,
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  locale: 'en' as const,
}

describe('GoalForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders basic form elements', () => {
    render(<GoalForm {...defaultProps} />)
    
    expect(screen.getByText('Create New Goal')).toBeInTheDocument()
    expect(screen.getByLabelText('Goal Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Target Amount')).toBeInTheDocument()
    expect(screen.getByLabelText('Deadline (Optional)')).toBeInTheDocument()
    expect(screen.getByText('Create Goal')).toBeInTheDocument()
  })

  it('renders edit form with initial data', () => {
    render(<GoalForm {...defaultProps} mode="edit" goal={mockGoal} />)
    
    expect(screen.getByText('Edit Goal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Emergency Fund')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100000')).toBeInTheDocument()
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
  })

  it('submits valid form data', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    render(<GoalForm {...defaultProps} onSubmit={mockSubmit} />)
    
    const nameInput = screen.getByLabelText('Goal Name')
    const amountInput = screen.getByLabelText('Target Amount')
    
    fireEvent.change(nameInput, { target: { value: 'New Car' } })
    fireEvent.change(amountInput, { target: { value: '50000' } })
    
    const submitButton = screen.getByText('Create Goal')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'New Car',
        targetAmount: 50000,
        deadline: undefined,
      })
    })
  })

  it('calls onClose when cancel button is clicked', () => {
    render(<GoalForm {...defaultProps} />)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('renders Thai locale correctly', () => {
    render(<GoalForm {...defaultProps} locale="th" />)
    
    expect(screen.getByText('สร้างเป้าหมายใหม่')).toBeInTheDocument()
    expect(screen.getByText('ชื่อเป้าหมาย')).toBeInTheDocument()
    expect(screen.getByText('จำนวนเงินเป้าหมาย')).toBeInTheDocument()
    expect(screen.getByText('วันที่กำหนดเสร็จ (ไม่บังคับ)')).toBeInTheDocument()
    expect(screen.getByText('สร้างเป้าหมาย')).toBeInTheDocument()
  })

  it('shows loading state during submission', async () => {
    const mockSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<GoalForm {...defaultProps} onSubmit={mockSubmit} />)
    
    const nameInput = screen.getByLabelText('Goal Name')
    const amountInput = screen.getByLabelText('Target Amount')
    
    fireEvent.change(nameInput, { target: { value: 'Test Goal' } })
    fireEvent.change(amountInput, { target: { value: '1000' } })
    
    const submitButton = screen.getByText('Create Goal')
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    })
  })
})