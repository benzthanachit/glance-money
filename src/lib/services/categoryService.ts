import { Category } from '@/lib/types/database'

export interface CategoryFilters {
  type?: 'income' | 'expense' | 'both'
}

class CategoryService {
  private baseUrl = '/api/categories'

  async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    const params = new URLSearchParams()
    
    if (filters?.type) params.append('type', filters.type)

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch categories')
    }

    const data = await response.json()
    return data.categories
  }

  // Default categories for the application
  getDefaultCategories(): Category[] {
    return [
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
        id: 'fixed-cost',
        name: 'Fixed Cost',
        icon: '🏠',
        type: 'expense',
        is_default: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'dca',
        name: 'DCA',
        icon: '📈',
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
      {
        id: 'freelance',
        name: 'Freelance',
        icon: '💼',
        type: 'income',
        is_default: true,
        created_at: new Date().toISOString(),
      },
    ]
  }

  // Get categories filtered by type
  getCategoriesByType(type: 'income' | 'expense' | 'both'): Category[] {
    const categories = this.getDefaultCategories()
    
    if (type === 'both') {
      return categories
    }
    
    return categories.filter(category => category.type === type || category.type === 'both')
  }

  // Get category by ID
  getCategoryById(id: string): Category | undefined {
    return this.getDefaultCategories().find(category => category.id === id)
  }

  // Get category icon by ID
  getCategoryIcon(id: string): string {
    const category = this.getCategoryById(id)
    return category?.icon || '📝'
  }

  // Get category name by ID
  getCategoryName(id: string): string {
    const category = this.getCategoryById(id)
    return category?.name || id
  }
}

export const categoryService = new CategoryService()