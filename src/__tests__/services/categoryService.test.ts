import { categoryService } from '@/lib/services/categoryService'

describe('CategoryService', () => {
  describe('getDefaultCategories', () => {
    it('returns all predefined categories', () => {
      const categories = categoryService.getDefaultCategories()
      
      expect(categories).toHaveLength(6)
      
      // Check expense categories
      const expenseCategories = categories.filter(c => c.type === 'expense')
      expect(expenseCategories).toHaveLength(4)
      expect(expenseCategories.map(c => c.id)).toEqual(['food', 'transport', 'fixed-cost', 'dca'])
      
      // Check income categories
      const incomeCategories = categories.filter(c => c.type === 'income')
      expect(incomeCategories).toHaveLength(2)
      expect(incomeCategories.map(c => c.id)).toEqual(['salary', 'freelance'])
    })

    it('returns categories with correct icons', () => {
      const categories = categoryService.getDefaultCategories()
      
      const categoryIcons = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.icon
        return acc
      }, {} as Record<string, string>)

      expect(categoryIcons).toEqual({
        'food': '🍽️',
        'transport': '🚗',
        'fixed-cost': '🏠',
        'dca': '📈',
        'salary': '💰',
        'freelance': '💼',
      })
    })

    it('marks all categories as default', () => {
      const categories = categoryService.getDefaultCategories()
      
      categories.forEach(category => {
        expect(category.is_default).toBe(true)
      })
    })
  })

  describe('getCategoriesByType', () => {
    it('returns only expense categories when type is expense', () => {
      const categories = categoryService.getCategoriesByType('expense')
      
      expect(categories).toHaveLength(4)
      categories.forEach(category => {
        expect(category.type).toBe('expense')
      })
    })

    it('returns only income categories when type is income', () => {
      const categories = categoryService.getCategoriesByType('income')
      
      expect(categories).toHaveLength(2)
      categories.forEach(category => {
        expect(category.type).toBe('income')
      })
    })

    it('returns all categories when type is both', () => {
      const categories = categoryService.getCategoriesByType('both')
      
      expect(categories).toHaveLength(6)
    })
  })

  describe('getCategoryById', () => {
    it('returns correct category for valid ID', () => {
      const category = categoryService.getCategoryById('food')
      
      expect(category).toBeDefined()
      expect(category?.id).toBe('food')
      expect(category?.name).toBe('Food')
      expect(category?.icon).toBe('🍽️')
    })

    it('returns undefined for invalid ID', () => {
      const category = categoryService.getCategoryById('invalid-id')
      
      expect(category).toBeUndefined()
    })
  })

  describe('getCategoryIcon', () => {
    it('returns correct icon for valid category ID', () => {
      expect(categoryService.getCategoryIcon('food')).toBe('🍽️')
      expect(categoryService.getCategoryIcon('transport')).toBe('🚗')
      expect(categoryService.getCategoryIcon('salary')).toBe('💰')
    })

    it('returns default icon for invalid category ID', () => {
      expect(categoryService.getCategoryIcon('invalid-id')).toBe('📝')
    })
  })

  describe('getCategoryName', () => {
    it('returns correct name for valid category ID', () => {
      expect(categoryService.getCategoryName('food')).toBe('Food')
      expect(categoryService.getCategoryName('transport')).toBe('Transport')
      expect(categoryService.getCategoryName('salary')).toBe('Salary')
    })

    it('returns the ID itself for invalid category ID', () => {
      expect(categoryService.getCategoryName('invalid-id')).toBe('invalid-id')
    })
  })
})