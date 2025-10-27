export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: Date
  categoryId: string | null
  financialAccountId: string | null
  category?: {
    id: string
    name: string
    color: string | null
  }
  financialAccount?: {
    id: string
    name: string
    type: string
  }
}

export interface Category {
  id: string
  name: string
  color: string | null
  userId: string
  type: 'income' | 'expense' | 'both'
  _count?: {
    transactions: number
  }
}

export interface FinancialAccount {
  id: string
  name: string
  type: string
  balance: number
  userId: string
  createdAt: Date
  updatedAt: Date
  currency: string
  color: string
  icon: string
  isActive: boolean
  _count?: {
    transactions: number
  }
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date | null
  userId: string
  category: string
}

export interface Insight {
  id: string
  type: string
  title: string
  content: string
  userId: string
  createdAt: Date
  isRead: boolean
}

export interface CategoryBasic {
  id: string
  name: string
  color: string | null
  type: 'income' | 'expense' | 'both'
  icon?: string
}

export interface AccountBasic {
  id: string
  name: string
  type: string
  color: string
  icon?: string
}