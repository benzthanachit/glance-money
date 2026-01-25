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
}

export const categoryService = new CategoryService()