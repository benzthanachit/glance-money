import { Category } from '@/lib/types/database'

export interface CategoryFilters {
  type?: 'income' | 'expense' | 'both'
}

class CategoryService {
  private baseUrl = '/api/categories'
  private categoriesCache: Category[] | null = null

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
    this.categoriesCache = data.categories
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
    const categories = this.categoriesCache || this.getDefaultCategories()
    
    if (type === 'both') {
      return categories
    }
    
    return categories.filter(category => category.type === type || category.type === 'both')
  }

  // Get category by ID - try cache first, then default
  getCategoryById(id: string): Category | undefined {
    const categories = this.categoriesCache || this.getDefaultCategories()
    return categories.find(category => category.id === id)
  }

  // Get category by name - for backward compatibility
  getCategoryByName(name: string): Category | undefined {
    const categories = this.categoriesCache || this.getDefaultCategories()
    return categories.find(category => category.name === name)
  }

  // Get category icon by name
  getCategoryIcon(categoryName: string): string {
    let category = this.getCategoryByName(categoryName)
    if (!category) {
      category = this.getCategoryById(categoryName) // fallback for ID
    }
    return category?.icon || '📝'
  }

  // Get category name - if input is already a name, return as-is
  getCategoryName(categoryName: string): string {
    // If it's already a valid category name, return it
    let category = this.getCategoryByName(categoryName)
    if (category) {
      return category.name
    }
    
    // Try to find by ID (fallback)
    category = this.getCategoryById(categoryName)
    if (category) {
      return category.name
    }
    
    // If not found, return the input as-is (might be a custom category name)
    return categoryName
  }
}

export const categoryService = new CategoryService()