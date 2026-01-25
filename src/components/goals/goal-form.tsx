'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { GoalWithProgress } from '@/lib/types'
import { CreateGoalData, UpdateGoalData } from '@/lib/services/goalService'
import { cn } from '@/lib/utils'
import { Target, Calendar, DollarSign } from 'lucide-react'

interface GoalFormProps {
  mode: 'create' | 'edit'
  goal?: GoalWithProgress
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateGoalData) => Promise<void>
  locale: 'th' | 'en'
}

interface FormData {
  name: string
  targetAmount: string
  deadline: string
}

interface FormErrors {
  [key: string]: string
}

export function GoalForm({
  mode,
  goal,
  isOpen,
  onClose,
  onSubmit,
  locale
}: GoalFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: goal?.name || '',
    targetAmount: goal?.targetAmount?.toString() || '',
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = locale === 'th' ? 'กรุณาใส่ชื่อเป้าหมาย' : 'Goal name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = locale === 'th' ? 'ชื่อเป้าหมายต้องมีอย่างน้อย 2 ตัวอักษร' : 'Goal name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = locale === 'th' ? 'ชื่อเป้าหมายต้องไม่เกิน 100 ตัวอักษร' : 'Goal name must not exceed 100 characters'
    }

    // Validate target amount
    const targetAmount = parseFloat(formData.targetAmount)
    if (!formData.targetAmount.trim()) {
      newErrors.targetAmount = locale === 'th' ? 'กรุณาใส่จำนวนเงินเป้าหมาย' : 'Target amount is required'
    } else if (isNaN(targetAmount) || targetAmount <= 0) {
      newErrors.targetAmount = locale === 'th' ? 'จำนวนเงินต้องมากกว่า 0' : 'Target amount must be greater than 0'
    } else if (targetAmount > 999999999.99) {
      newErrors.targetAmount = locale === 'th' ? 'จำนวนเงินสูงเกินไป' : 'Target amount is too large'
    }

    // Validate deadline (optional)
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (deadlineDate < today) {
        newErrors.deadline = locale === 'th' ? 'วันที่กำหนดต้องเป็นวันในอนาคต' : 'Deadline must be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const submitData = {
        name: formData.name.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        deadline: formData.deadline || undefined,
      }

      await onSubmit(submitData)
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        targetAmount: '',
        deadline: '',
      })
      setErrors({})
    } catch (error) {
      console.error('Error submitting goal:', error)
      // Could set a general error state here
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      // Reset form when closing
      setFormData({
        name: goal?.name || '',
        targetAmount: goal?.targetAmount?.toString() || '',
        deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      })
      setErrors({})
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            {mode === 'create' 
              ? (locale === 'th' ? 'สร้างเป้าหมายใหม่' : 'Create New Goal')
              : (locale === 'th' ? 'แก้ไขเป้าหมาย' : 'Edit Goal')
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="goalName" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {locale === 'th' ? 'ชื่อเป้าหมาย' : 'Goal Name'}
            </Label>
            <Input
              id="goalName"
              type="text"
              placeholder={locale === 'th' ? 'เช่น ซื้อรถใหม่, งานแต่งงาน' : 'e.g. New Car, Wedding Fund'}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={cn(
                errors.name && "border-red-500 focus-visible:ring-red-500/20"
              )}
              aria-invalid={!!errors.name}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {locale === 'th' ? 'จำนวนเงินเป้าหมาย' : 'Target Amount'}
            </Label>
            <Input
              id="targetAmount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max="999999999.99"
              placeholder="0.00"
              value={formData.targetAmount}
              onChange={(e) => handleInputChange('targetAmount', e.target.value)}
              className={cn(
                "text-lg h-12 text-center font-semibold",
                errors.targetAmount && "border-red-500 focus-visible:ring-red-500/20"
              )}
              aria-invalid={!!errors.targetAmount}
            />
            {errors.targetAmount && (
              <p className="text-sm text-red-500">{errors.targetAmount}</p>
            )}
          </div>

          {/* Deadline (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {locale === 'th' ? 'วันที่กำหนดเสร็จ (ไม่บังคับ)' : 'Deadline (Optional)'}
            </Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              className={cn(
                errors.deadline && "border-red-500 focus-visible:ring-red-500/20"
              )}
              aria-invalid={!!errors.deadline}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.deadline && (
              <p className="text-sm text-red-500">{errors.deadline}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...')
                : mode === 'create' 
                  ? (locale === 'th' ? 'สร้างเป้าหมาย' : 'Create Goal')
                  : (locale === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save Changes')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}