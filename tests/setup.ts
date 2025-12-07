import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock Prisma for integration tests
vi.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    reminder: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    task: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    event: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id", email: "test@example.com" } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  }),
}))

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    // Return English translations for common keys used in tests
    const translations: Record<string, string> = {
      'transactions.transactionType': 'Transaction Type',
      'transactions.amount': 'Amount',
      'transactions.date': 'Date',
      'transactions.account': 'Account',
      'transactions.category': 'Category',
      'transactions.description': 'Description',
      'transactions.notes': 'Notes',
      'transactions.notesPlaceholder': 'Add any additional notes...',
      'transactions.income': 'Income',
      'transactions.expense': 'Expense',
      'transactions.new': 'Create Transaction',
      'transactions.edit': 'Update Transaction',
      'common.loading': 'Saving...',
      'transactions.pleaseSelectAccount': 'Please select an account',
    }
    return translations[key] || key
  },
  useLocale: () => "en",
}))

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock pointer capture methods for jsdom compatibility with Radix UI
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
}
