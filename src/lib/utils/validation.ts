import { CreateTransactionData, UpdateTransactionData } from '@/lib/services/transactionService'

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