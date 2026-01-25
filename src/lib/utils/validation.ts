import { CreateTransactionData, UpdateTransactionData } from '@/lib/services/transactionService'
import { CreateGoalData, UpdateGoalData, AllocateTransactionData } from '@/lib/services/goalService'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export function validateTransactionData(data: CreateTransactionData): ValidationResult {
  const errors: ValidationError[] = []

  // Validate amount
  if (!data.amount) {
    errors.push({ field: 'amount', message: 'Amount is required' })
  } else if (typeof data.amount !== 'number') {
    errors.push({ field: 'amount', message: 'Amount must be a number' })
  } else if (data.amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than 0' })
  } else if (data.amount > 999999999.99) {
    errors.push({ field: 'amount', message: 'Amount is too large' })
  }

  // Validate type
  if (!data.type) {
    errors.push({ field: 'type', message: 'Transaction type is required' })
  } else if (data.type !== 'income' && data.type !== 'expense') {
    errors.push({ field: 'type', message: 'Type must be either "income" or "expense"' })
  }

  // Validate category
  if (!data.category) {
    errors.push({ field: 'category', message: 'Category is required' })
  } else if (typeof data.category !== 'string' || data.category.trim().length === 0) {
    errors.push({ field: 'category', message: 'Category must be a non-empty string' })
  } else if (data.category.length > 50) {
    errors.push({ field: 'category', message: 'Category name is too long (max 50 characters)' })
  }

  // Validate description (optional)
  if (data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description is too long (max 500 characters)' })
  }

  // Validate date (optional)
  if (data.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data.date)) {
      errors.push({ field: 'date', message: 'Date must be in YYYY-MM-DD format' })
    } else {
      const parsedDate = new Date(data.date)
      if (isNaN(parsedDate.getTime())) {
        errors.push({ field: 'date', message: 'Invalid date' })
      }
    }
  }

  // Validate recurring fields
  if (data.is_recurring && data.recurring_parent_id) {
    errors.push({ 
      field: 'is_recurring', 
      message: 'A transaction cannot be both recurring and have a recurring parent' 
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateTransactionUpdateData(data: UpdateTransactionData): ValidationResult {
  const errors: ValidationError[] = []

  // Validate amount (optional for updates)
  if (data.amount !== undefined) {
    if (typeof data.amount !== 'number') {
      errors.push({ field: 'amount', message: 'Amount must be a number' })
    } else if (data.amount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be greater than 0' })
    } else if (data.amount > 999999999.99) {
      errors.push({ field: 'amount', message: 'Amount is too large' })
    }
  }

  // Validate type (optional for updates)
  if (data.type !== undefined && data.type !== 'income' && data.type !== 'expense') {
    errors.push({ field: 'type', message: 'Type must be either "income" or "expense"' })
  }

  // Validate category (optional for updates)
  if (data.category !== undefined) {
    if (typeof data.category !== 'string' || data.category.trim().length === 0) {
      errors.push({ field: 'category', message: 'Category must be a non-empty string' })
    } else if (data.category.length > 50) {
      errors.push({ field: 'category', message: 'Category name is too long (max 50 characters)' })
    }
  }

  // Validate description (optional)
  if (data.description !== undefined && data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description is too long (max 500 characters)' })
  }

  // Validate date (optional for updates)
  if (data.date !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data.date)) {
      errors.push({ field: 'date', message: 'Date must be in YYYY-MM-DD format' })
    } else {
      const parsedDate = new Date(data.date)
      if (isNaN(parsedDate.getTime())) {
        errors.push({ field: 'date', message: 'Invalid date' })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function sanitizeTransactionData(data: CreateTransactionData): CreateTransactionData {
  return {
    ...data,
    amount: Number(data.amount),
    category: data.category.trim(),
    description: data.description?.trim() || undefined,
    date: data.date || new Date().toISOString().split('T')[0],
    is_recurring: Boolean(data.is_recurring),
  }
}

export function sanitizeTransactionUpdateData(data: UpdateTransactionData): UpdateTransactionData {
  const sanitized: UpdateTransactionData = {}

  if (data.amount !== undefined) sanitized.amount = Number(data.amount)
  if (data.type !== undefined) sanitized.type = data.type
  if (data.category !== undefined) sanitized.category = data.category.trim()
  if (data.description !== undefined) sanitized.description = data.description?.trim() || undefined
  if (data.date !== undefined) sanitized.date = data.date
  if (data.is_recurring !== undefined) sanitized.is_recurring = Boolean(data.is_recurring)

  return sanitized
}

// Goal validation functions
export function validateGoalData(data: CreateGoalData): ValidationResult {
  const errors: ValidationError[] = []

  // Validate name
  if (!data.name) {
    errors.push({ field: 'name', message: 'Goal name is required' })
  } else if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Goal name must be a non-empty string' })
  } else if (data.name.length > 100) {
    errors.push({ field: 'name', message: 'Goal name is too long (max 100 characters)' })
  }

  // Validate target amount
  if (!data.targetAmount) {
    errors.push({ field: 'targetAmount', message: 'Target amount is required' })
  } else if (typeof data.targetAmount !== 'number') {
    errors.push({ field: 'targetAmount', message: 'Target amount must be a number' })
  } else if (data.targetAmount <= 0) {
    errors.push({ field: 'targetAmount', message: 'Target amount must be greater than 0' })
  } else if (data.targetAmount > 999999999.99) {
    errors.push({ field: 'targetAmount', message: 'Target amount is too large' })
  }

  // Validate deadline (optional)
  if (data.deadline) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data.deadline)) {
      errors.push({ field: 'deadline', message: 'Deadline must be in YYYY-MM-DD format' })
    } else {
      const parsedDate = new Date(data.deadline)
      if (isNaN(parsedDate.getTime())) {
        errors.push({ field: 'deadline', message: 'Invalid deadline date' })
      } else if (parsedDate < new Date()) {
        errors.push({ field: 'deadline', message: 'Deadline cannot be in the past' })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateGoalUpdateData(data: UpdateGoalData): ValidationResult {
  const errors: ValidationError[] = []

  // Validate name (optional for updates)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Goal name must be a non-empty string' })
    } else if (data.name.length > 100) {
      errors.push({ field: 'name', message: 'Goal name is too long (max 100 characters)' })
    }
  }

  // Validate target amount (optional for updates)
  if (data.targetAmount !== undefined) {
    if (typeof data.targetAmount !== 'number') {
      errors.push({ field: 'targetAmount', message: 'Target amount must be a number' })
    } else if (data.targetAmount <= 0) {
      errors.push({ field: 'targetAmount', message: 'Target amount must be greater than 0' })
    } else if (data.targetAmount > 999999999.99) {
      errors.push({ field: 'targetAmount', message: 'Target amount is too large' })
    }
  }

  // Validate deadline (optional for updates)
  if (data.deadline !== undefined) {
    if (data.deadline === null) {
      // Allow null to remove deadline
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(data.deadline)) {
        errors.push({ field: 'deadline', message: 'Deadline must be in YYYY-MM-DD format' })
      } else {
        const parsedDate = new Date(data.deadline)
        if (isNaN(parsedDate.getTime())) {
          errors.push({ field: 'deadline', message: 'Invalid deadline date' })
        } else if (parsedDate < new Date()) {
          errors.push({ field: 'deadline', message: 'Deadline cannot be in the past' })
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateTransactionAllocationData(data: AllocateTransactionData): ValidationResult {
  const errors: ValidationError[] = []

  // Validate transaction ID
  if (!data.transactionId) {
    errors.push({ field: 'transactionId', message: 'Transaction ID is required' })
  } else if (typeof data.transactionId !== 'string' || data.transactionId.trim().length === 0) {
    errors.push({ field: 'transactionId', message: 'Transaction ID must be a non-empty string' })
  }

  // Validate allocated amount
  if (!data.allocatedAmount) {
    errors.push({ field: 'allocatedAmount', message: 'Allocated amount is required' })
  } else if (typeof data.allocatedAmount !== 'number') {
    errors.push({ field: 'allocatedAmount', message: 'Allocated amount must be a number' })
  } else if (data.allocatedAmount <= 0) {
    errors.push({ field: 'allocatedAmount', message: 'Allocated amount must be greater than 0' })
  } else if (data.allocatedAmount > 999999999.99) {
    errors.push({ field: 'allocatedAmount', message: 'Allocated amount is too large' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function sanitizeGoalData(data: CreateGoalData): CreateGoalData {
  return {
    ...data,
    name: data.name.trim(),
    targetAmount: Number(data.targetAmount),
    deadline: data.deadline || undefined,
  }
}

export function sanitizeGoalUpdateData(data: UpdateGoalData): UpdateGoalData {
  const sanitized: UpdateGoalData = {}

  if (data.name !== undefined) sanitized.name = data.name.trim()
  if (data.targetAmount !== undefined) sanitized.targetAmount = Number(data.targetAmount)
  if (data.deadline !== undefined) sanitized.deadline = data.deadline

  return sanitized
}

export function sanitizeTransactionAllocationData(data: AllocateTransactionData): AllocateTransactionData {
  return {
    ...data,
    transactionId: data.transactionId.trim(),
    allocatedAmount: Number(data.allocatedAmount),
  }
}