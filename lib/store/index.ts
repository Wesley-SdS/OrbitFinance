import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

// ===============================
// Types
// ===============================

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  color: string
  icon: string
  is_active: boolean
}

interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  icon: string
}

interface Transaction {
  id: string
  type: "income" | "expense" | "transfer"
  amount: number
  description: string
  date: string
  notes?: string
  account_id: string
  category_id: string
  account?: Account
  category?: Category
}

interface Goal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline?: string
  category: string
  color: string
  icon: string
  is_completed: boolean
}

interface AIInsight {
  id: string
  insight_type: string
  title: string
  content: string
  priority: "low" | "medium" | "high"
  is_read: boolean
  created_at: string
}

// ===============================
// UI State Store
// ===============================

interface UIState {
  // Global loading states
  isLoading: boolean

  // Modal states
  isTransactionModalOpen: boolean
  isAccountModalOpen: boolean
  isCategoryModalOpen: boolean
  isGoalModalOpen: boolean

  // Sidebar state
  isSidebarOpen: boolean

  // Theme state
  isDarkMode: boolean

  // Language state
  currentLanguage: "en" | "pt" | "es"

  // Filters
  transactionFilters: {
    type?: "income" | "expense"
    account_id?: string
    category_id?: string
    date_range?: { start: string; end: string }
  }

  // Actions
  setLoading: (loading: boolean) => void
  setTransactionModal: (open: boolean) => void
  setAccountModal: (open: boolean) => void
  setCategoryModal: (open: boolean) => void
  setGoalModal: (open: boolean) => void
  setSidebar: (open: boolean) => void
  toggleDarkMode: () => void
  setLanguage: (lang: "en" | "pt" | "es") => void
  setTransactionFilters: (filters: UIState["transactionFilters"]) => void
  clearTransactionFilters: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        isLoading: false,
        isTransactionModalOpen: false,
        isAccountModalOpen: false,
        isCategoryModalOpen: false,
        isGoalModalOpen: false,
        isSidebarOpen: false,
        isDarkMode: false,
        currentLanguage: "en",
        transactionFilters: {},

        // Actions
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        setTransactionModal: (open) =>
          set((state) => {
            state.isTransactionModalOpen = open
          }),

        setAccountModal: (open) =>
          set((state) => {
            state.isAccountModalOpen = open
          }),

        setCategoryModal: (open) =>
          set((state) => {
            state.isCategoryModalOpen = open
          }),

        setGoalModal: (open) =>
          set((state) => {
            state.isGoalModalOpen = open
          }),

        setSidebar: (open) =>
          set((state) => {
            state.isSidebarOpen = open
          }),

        toggleDarkMode: () =>
          set((state) => {
            state.isDarkMode = !state.isDarkMode
          }),

        setLanguage: (lang) =>
          set((state) => {
            state.currentLanguage = lang
          }),

        setTransactionFilters: (filters) =>
          set((state) => {
            state.transactionFilters = { ...state.transactionFilters, ...filters }
          }),

        clearTransactionFilters: () =>
          set((state) => {
            state.transactionFilters = {}
          }),
      })),
      {
        name: "orbifinance-ui-store",
        partialize: (state) => ({
          isDarkMode: state.isDarkMode,
          currentLanguage: state.currentLanguage,
          isSidebarOpen: state.isSidebarOpen,
        }),
      }
    ),
    { name: "UI Store" }
  )
)

// ===============================
// Data Store
// ===============================

interface DataState {
  // Data
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  goals: Goal[]
  insights: AIInsight[]

  // Loading states
  accountsLoading: boolean
  categoriesLoading: boolean
  transactionsLoading: boolean
  goalsLoading: boolean
  insightsLoading: boolean

  // Actions
  setAccounts: (accounts: Account[]) => void
  addAccount: (account: Account) => void
  updateAccount: (id: string, account: Partial<Account>) => void
  removeAccount: (id: string) => void
  setAccountsLoading: (loading: boolean) => void

  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void
  updateCategory: (id: string, category: Partial<Category>) => void
  removeCategory: (id: string) => void
  setCategoriesLoading: (loading: boolean) => void

  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  removeTransaction: (id: string) => void
  setTransactionsLoading: (loading: boolean) => void

  setGoals: (goals: Goal[]) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  removeGoal: (id: string) => void
  setGoalsLoading: (loading: boolean) => void

  setInsights: (insights: AIInsight[]) => void
  addInsight: (insight: AIInsight) => void
  markInsightAsRead: (id: string) => void
  setInsightsLoading: (loading: boolean) => void

  // Computed values
  totalBalance: () => number
  monthlyIncome: (month?: string) => number
  monthlyExpenses: (month?: string) => number
  getAccountById: (id: string) => Account | undefined
  getCategoryById: (id: string) => Category | undefined
  getTransactionsByAccount: (accountId: string) => Transaction[]
  getTransactionsByCategory: (categoryId: string) => Transaction[]
}

export const useDataStore = create<DataState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      accounts: [],
      categories: [],
      transactions: [],
      goals: [],
      insights: [],
      accountsLoading: false,
      categoriesLoading: false,
      transactionsLoading: false,
      goalsLoading: false,
      insightsLoading: false,

      // Account actions
      setAccounts: (accounts) =>
        set((state) => {
          state.accounts = accounts
        }),

      addAccount: (account) =>
        set((state) => {
          state.accounts.push(account)
        }),

      updateAccount: (id, account) =>
        set((state) => {
          const index = state.accounts.findIndex((a) => a.id === id)
          if (index !== -1) {
            state.accounts[index] = { ...state.accounts[index], ...account }
          }
        }),

      removeAccount: (id) =>
        set((state) => {
          state.accounts = state.accounts.filter((a) => a.id !== id)
        }),

      setAccountsLoading: (loading) =>
        set((state) => {
          state.accountsLoading = loading
        }),

      // Category actions
      setCategories: (categories) =>
        set((state) => {
          state.categories = categories
        }),

      addCategory: (category) =>
        set((state) => {
          state.categories.push(category)
        }),

      updateCategory: (id, category) =>
        set((state) => {
          const index = state.categories.findIndex((c) => c.id === id)
          if (index !== -1) {
            state.categories[index] = { ...state.categories[index], ...category }
          }
        }),

      removeCategory: (id) =>
        set((state) => {
          state.categories = state.categories.filter((c) => c.id !== id)
        }),

      setCategoriesLoading: (loading) =>
        set((state) => {
          state.categoriesLoading = loading
        }),

      // Transaction actions
      setTransactions: (transactions) =>
        set((state) => {
          state.transactions = transactions
        }),

      addTransaction: (transaction) =>
        set((state) => {
          state.transactions.unshift(transaction) // Add to beginning for chronological order
        }),

      updateTransaction: (id, transaction) =>
        set((state) => {
          const index = state.transactions.findIndex((t) => t.id === id)
          if (index !== -1) {
            state.transactions[index] = { ...state.transactions[index], ...transaction }
          }
        }),

      removeTransaction: (id) =>
        set((state) => {
          state.transactions = state.transactions.filter((t) => t.id !== id)
        }),

      setTransactionsLoading: (loading) =>
        set((state) => {
          state.transactionsLoading = loading
        }),

      // Goal actions
      setGoals: (goals) =>
        set((state) => {
          state.goals = goals
        }),

      addGoal: (goal) =>
        set((state) => {
          state.goals.push(goal)
        }),

      updateGoal: (id, goal) =>
        set((state) => {
          const index = state.goals.findIndex((g) => g.id === id)
          if (index !== -1) {
            state.goals[index] = { ...state.goals[index], ...goal }
          }
        }),

      removeGoal: (id) =>
        set((state) => {
          state.goals = state.goals.filter((g) => g.id !== id)
        }),

      setGoalsLoading: (loading) =>
        set((state) => {
          state.goalsLoading = loading
        }),

      // Insight actions
      setInsights: (insights) =>
        set((state) => {
          state.insights = insights
        }),

      addInsight: (insight) =>
        set((state) => {
          state.insights.unshift(insight)
        }),

      markInsightAsRead: (id) =>
        set((state) => {
          const index = state.insights.findIndex((i) => i.id === id)
          if (index !== -1) {
            state.insights[index].is_read = true
          }
        }),

      setInsightsLoading: (loading) =>
        set((state) => {
          state.insightsLoading = loading
        }),

      // Computed values
      totalBalance: () => {
        const { accounts } = get()
        return accounts.reduce((sum, account) => sum + account.balance, 0)
      },

      monthlyIncome: (month) => {
        const { transactions } = get()
        const targetMonth = month || new Date().toISOString().slice(0, 7) // YYYY-MM format

        return transactions
          .filter((t) => t.type === "income" && t.date.startsWith(targetMonth))
          .reduce((sum, t) => sum + t.amount, 0)
      },

      monthlyExpenses: (month) => {
        const { transactions } = get()
        const targetMonth = month || new Date().toISOString().slice(0, 7)

        return transactions
          .filter((t) => t.type === "expense" && t.date.startsWith(targetMonth))
          .reduce((sum, t) => sum + t.amount, 0)
      },

      getAccountById: (id) => {
        const { accounts } = get()
        return accounts.find((account) => account.id === id)
      },

      getCategoryById: (id) => {
        const { categories } = get()
        return categories.find((category) => category.id === id)
      },

      getTransactionsByAccount: (accountId) => {
        const { transactions } = get()
        return transactions.filter((t) => t.account_id === accountId)
      },

      getTransactionsByCategory: (categoryId) => {
        const { transactions } = get()
        return transactions.filter((t) => t.category_id === categoryId)
      },
    })),
    { name: "Data Store" }
  )
)
