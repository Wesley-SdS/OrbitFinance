import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TransactionForm } from "@/components/transaction-form"
import type { FinancialAccount, Category } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

const mockAccounts: FinancialAccount[] = [
  {
    id: "account-1",
    name: "Main Checking",
    userId: "test-user-id",
    type: "checking",
    color: "#3b82f6",
    icon: "🏦",
    createdAt: new Date(),
    updatedAt: new Date(),
    balance: new Decimal(1000),
    currency: "USD",
    isActive: true,
  },
  {
    id: "account-2",
    name: "Savings",
    userId: "test-user-id",
    type: "savings",
    color: "#10b981",
    icon: "💰",
    createdAt: new Date(),
    updatedAt: new Date(),
    balance: new Decimal(5000),
    currency: "USD",
    isActive: true,
  },
]

const mockCategories: Category[] = [
  {
    id: "category-1",
    name: "Food",
    userId: "test-user-id",
    type: "expense",
    color: "#ef4444",
    icon: "🍽️",
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "category-2",
    name: "Salary",
    userId: "test-user-id",
    type: "income",
    color: "#10b981",
    icon: "💼",
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe("TransactionForm", () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mock("next/navigation", () => ({
      useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
        back: vi.fn(),
      }),
    }))

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })

  it("renders the form with all required fields", () => {
    render(<TransactionForm accounts={mockAccounts} categories={mockCategories} />)

    expect(screen.getByLabelText(/transaction type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/account/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it("filters categories based on transaction type", async () => {
    const user = userEvent.setup()

    render(<TransactionForm accounts={mockAccounts} categories={mockCategories} />)

    // Default should be expense
    const categorySelect = screen.getByRole("combobox", { name: /category/i })
    await user.click(categorySelect)

    // Should only show expense categories
    expect(screen.getByText("Food")).toBeInTheDocument()
    expect(screen.queryByText("Salary")).not.toBeInTheDocument()

    // Switch to income
    const incomeRadio = screen.getByLabelText(/income/i)
    await user.click(incomeRadio)

    await user.click(categorySelect)

    // Should only show income categories
    expect(screen.getByText("Salary")).toBeInTheDocument()
    expect(screen.queryByText("Food")).not.toBeInTheDocument()
  })

  it("validates required fields", async () => {
    const user = userEvent.setup()

    render(<TransactionForm accounts={mockAccounts} categories={mockCategories} />)

    const submitButton = screen.getByRole("button", { name: /create transaction/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please select an account/i)).toBeInTheDocument()
    })
  })

  it("submits form with valid data", async () => {
    const user = userEvent.setup()

    render(<TransactionForm accounts={mockAccounts} categories={mockCategories} />)

    // Fill in required fields
    const amountInput = screen.getByLabelText(/amount/i)
    await user.type(amountInput, "100.50")

    const descriptionInput = screen.getByLabelText(/description/i)
    await user.type(descriptionInput, "Test transaction")

    // Select account
    const accountSelect = screen.getByRole("combobox", { name: /account/i })
    await user.click(accountSelect)
    await user.click(screen.getByText("Main Checking"))

    // Select category
    const categorySelect = screen.getByRole("combobox", { name: /category/i })
    await user.click(categorySelect)
    await user.click(screen.getByText("Food"))

    // Submit form
    const submitButton = screen.getByRole("button", { name: /create transaction/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transactions",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"type":"expense"'),
        })
      )
    })

    expect(mockPush).toHaveBeenCalledWith("/dashboard/transactions")
  })

  it("handles edit mode correctly", async () => {
    const existingTransaction = {
      id: "transaction-1",
      type: "income",
      amount: 2000,
      description: "Salary",
      date: "2024-01-15",
      notes: "Monthly salary",
      account_id: "account-1",
      category_id: "category-2",
    }

    render(<TransactionForm transaction={existingTransaction} accounts={mockAccounts} categories={mockCategories} />)

    // Check that form is pre-filled
    expect(screen.getByDisplayValue("2000")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Salary")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Monthly salary")).toBeInTheDocument()

    // Check that update button is shown
    expect(screen.getByRole("button", { name: /update transaction/i })).toBeInTheDocument()
  })

  it("shows loading state during submission", async () => {
    const user = userEvent.setup()

    // Make the API call take some time
    global.fetch = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ success: true }) }), 100)
          )
      )

    render(<TransactionForm accounts={mockAccounts} categories={mockCategories} />)

    // Fill in minimum required fields
    const amountInput = screen.getByLabelText(/amount/i)
    await user.type(amountInput, "50")

    const descriptionInput = screen.getByLabelText(/description/i)
    await user.type(descriptionInput, "Test")

    const accountSelect = screen.getByRole("combobox", { name: /account/i })
    await user.click(accountSelect)
    await user.click(screen.getByText("Main Checking"))

    const categorySelect = screen.getByRole("combobox", { name: /category/i })
    await user.click(categorySelect)
    await user.click(screen.getByText("Food"))

    const submitButton = screen.getByRole("button", { name: /create transaction/i })
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByText(/saving/i)).toBeInTheDocument()
  })

  it("displays error messages", async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: "Database error" } }),
    })

    render(<TransactionForm accounts={mockAccounts} categories={mockCategories} />)

    // Fill in form and submit
    const amountInput = screen.getByLabelText(/amount/i)
    await user.type(amountInput, "50")

    const descriptionInput = screen.getByLabelText(/description/i)
    await user.type(descriptionInput, "Test")

    const accountSelect = screen.getByRole("combobox", { name: /account/i })
    await user.click(accountSelect)
    await user.click(screen.getByText("Main Checking"))

    const categorySelect = screen.getByRole("combobox", { name: /category/i })
    await user.click(categorySelect)
    await user.click(screen.getByText("Food"))

    const submitButton = screen.getByRole("button", { name: /create transaction/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/database error/i)).toBeInTheDocument()
    })
  })
})
