# Test Coverage Roadmap - OrbiFinance MVP

## 📊 Current State (January 2025)

### ✅ Completed
- **102/102 unit and integration tests passing (100% success rate)**
- **Overall coverage: 5.75%**
- **Critical business logic coverage: 69-100%**

### Coverage Breakdown
```
File                                      | % Stmts | % Branch | % Funcs | % Lines
------------------------------------------|---------|----------|---------|--------
lib/assistant/nlu.ts                      | 100     | 100      | 100     | 100
lib/assistant/usecases/schedule-reminder  | 95.83   | 90       | 100     | 95.83
lib/jobs/queue.ts                         | 100     | 85.71    | 100     | 100
components/transaction-form.tsx           | 69.02   | 48.14    | 60      | 69.02
```

### What's Currently Tested ✅
1. **NLU (Natural Language Understanding)** - 100%
   - Intent parsing (expense, income, report)
   - Amount extraction
   - Category detection
   - Date parsing (relative dates)

2. **Job Queue System** - 100%
   - Reminder job scheduling
   - Retry logic with exponential backoff
   - Past date handling (immediate execution)
   - Queue metrics
   - Graceful shutdown

3. **WhatsApp Integration** - ~100%
   - Message processing
   - Reminder scheduling
   - Error handling
   - Rate limiting

4. **Transaction Form Component** - 69%
   - Form rendering
   - Field validation (basic)
   - Edit mode
   - Loading states

### What's NOT Tested Yet ❌
1. **API Routes** (0% coverage)
   - `/api/transactions` - CRUD operations
   - `/api/accounts` - Account management
   - `/api/categories` - Category management
   - `/api/budgets` - Budget tracking
   - `/api/goals` - Financial goals
   - `/api/insights` - AI insights
   - `/api/auth/*` - Authentication flows
   - `/api/webhooks/whatsapp` - WhatsApp webhook

2. **Server Components** (0% coverage)
   - Dashboard pages
   - Transaction list/detail pages
   - Budget pages
   - Reports pages
   - Settings pages

3. **Client Components** (Most untested)
   - Navigation components
   - Chart components
   - Form components (beyond transaction-form)
   - Modal/Dialog components
   - List components

4. **Utility Functions** (Partially tested)
   - Auth helpers
   - Date formatting
   - Currency formatting
   - Validation schemas
   - File validation

5. **Database Queries** (Not tested directly)
   - lib/queries/index.ts
   - Prisma schema migrations

---

## 🎯 Phase 1: API Routes Testing (Priority: HIGH)

### Goal: 80%+ coverage for all API routes

### Routes to Test

#### 1.1 Authentication Routes
**Files**: `app/api/auth/**/*.ts`

**Test scenarios**:
```typescript
// tests/api/auth/sign-up.test.ts
describe('POST /api/auth/sign-up', () => {
  it('creates new user with valid data')
  it('rejects duplicate email')
  it('validates password strength')
  it('sanitizes user input')
  it('returns JWT token')
})

// tests/api/auth/sign-in.test.ts
describe('POST /api/auth/sign-in', () => {
  it('authenticates with valid credentials')
  it('rejects invalid password')
  it('rejects non-existent email')
  it('rate limits after 5 failed attempts')
  it('returns JWT with correct payload')
})

// tests/api/auth/session.test.ts
describe('GET /api/auth/session', () => {
  it('returns user data for valid token')
  it('returns 401 for expired token')
  it('returns 401 for invalid token')
  it('refreshes token if near expiration')
})
```

#### 1.2 Transaction Routes
**Files**: `app/api/transactions/**/*.ts`

**Test scenarios**:
```typescript
// tests/api/transactions/route.test.ts
describe('POST /api/transactions', () => {
  it('creates transaction with valid data')
  it('validates required fields')
  it('updates account balance')
  it('requires authentication')
  it('rejects negative amounts for expense')
  it('accepts decimal amounts')
  it('creates transaction with category')
})

describe('GET /api/transactions', () => {
  it('returns paginated transactions')
  it('filters by date range')
  it('filters by account')
  it('filters by category')
  it('filters by type (income/expense)')
  it('sorts by date desc by default')
  it('returns only user\'s own transactions')
})

// tests/api/transactions/[id]/route.test.ts
describe('GET /api/transactions/[id]', () => {
  it('returns single transaction')
  it('returns 404 for non-existent transaction')
  it('returns 403 for other user\'s transaction')
})

describe('PATCH /api/transactions/[id]', () => {
  it('updates transaction')
  it('updates account balance correctly')
  it('validates updated data')
  it('returns 403 for other user\'s transaction')
})

describe('DELETE /api/transactions/[id]', () => {
  it('deletes transaction')
  it('reverts account balance')
  it('returns 403 for other user\'s transaction')
})
```

#### 1.3 Accounts Routes
**Files**: `app/api/accounts/**/*.ts`

**Test scenarios**:
```typescript
// tests/api/accounts/route.test.ts
describe('POST /api/accounts', () => {
  it('creates account with valid data')
  it('validates account type')
  it('sets initial balance')
  it('assigns default color/icon')
})

describe('GET /api/accounts', () => {
  it('returns all user accounts')
  it('includes calculated balance')
  it('filters by active status')
})

// tests/api/accounts/[id]/route.test.ts
describe('PATCH /api/accounts/[id]', () => {
  it('updates account details')
  it('does not allow direct balance modification')
  it('allows archiving account')
})
```

#### 1.4 Insights Route
**Files**: `app/api/generate-insights/route.ts`

**Test scenarios**:
```typescript
// tests/api/generate-insights.test.ts
describe('POST /api/generate-insights', () => {
  it('generates insights for user transactions')
  it('handles OpenAI API errors gracefully')
  it('respects rate limits')
  it('returns structured insight data')
  it('caches insights for 24h')
})
```

#### 1.5 WhatsApp Webhook Route
**Files**: `app/api/webhooks/whatsapp/route.ts`

**Test scenarios**:
```typescript
// tests/api/webhooks/whatsapp.test.ts
describe('POST /api/webhooks/whatsapp', () => {
  it('validates webhook signature')
  it('rejects invalid signatures')
  it('processes incoming messages')
  it('handles different message types')
  it('rate limits by phone number')
  it('logs all webhook requests')
  it('returns 200 for valid webhooks')
})

describe('GET /api/webhooks/whatsapp', () => {
  it('validates webhook verification')
  it('returns challenge token')
})
```

### Testing Strategy for API Routes

**Setup**:
```typescript
// tests/helpers/api-test-setup.ts
import { createMocks } from 'node-mocks-http'
import { POST as signUpHandler } from '@/app/api/auth/sign-up/route'

export function mockApiRequest(method: string, body?: any, headers?: any) {
  const { req, res } = createMocks({
    method,
    body,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  })
  return { req, res }
}

export async function createAuthenticatedRequest(userId: string) {
  // Create JWT token for testing
  const token = jwt.sign({ userId }, process.env.JWT_SECRET!)
  return {
    headers: {
      authorization: `Bearer ${token}`,
    },
  }
}
```

**Example test**:
```typescript
import { POST } from '@/app/api/transactions/route'
import { mockApiRequest, createAuthenticatedRequest } from '@/tests/helpers/api-test-setup'
import { prisma } from '@/lib/prisma'

describe('POST /api/transactions', () => {
  beforeEach(async () => {
    // Clean database
    await prisma.transaction.deleteMany()
  })

  it('creates transaction with valid data', async () => {
    const auth = await createAuthenticatedRequest('user-123')

    const { req } = mockApiRequest('POST', {
      type: 'expense',
      amount: 50.0,
      description: 'Grocery shopping',
      date: '2025-01-10',
      accountId: 'account-1',
      categoryId: 'category-1',
    }, auth.headers)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.transaction).toMatchObject({
      type: 'expense',
      amount: 50.0,
      description: 'Grocery shopping',
    })
  })
})
```

---

## 🧩 Phase 2: Component Testing (Priority: MEDIUM)

### Goal: 70%+ coverage for all client components

### Components to Test

#### 2.1 Form Components
- **transaction-form.tsx** (69% ✅ - improve to 85%+)
- **account-form.tsx** (0% ❌)
- **category-form.tsx** (0% ❌)
- **budget-form.tsx** (0% ❌)
- **goal-form.tsx** (0% ❌)

**Test strategy**:
```typescript
// tests/components/account-form.test.tsx
describe('AccountForm', () => {
  it('renders all required fields')
  it('validates account name')
  it('allows selecting account type')
  it('allows setting initial balance')
  it('submits form with valid data')
  it('displays validation errors')
  it('handles edit mode correctly')
  it('displays loading state during submission')
})
```

#### 2.2 List Components
- **transaction-list.tsx** (0% ❌)
- **account-list.tsx** (0% ❌)
- **category-list.tsx** (0% ❌)

**Test strategy**:
```typescript
// tests/components/transaction-list.test.tsx
describe('TransactionList', () => {
  it('renders list of transactions')
  it('groups transactions by date')
  it('displays transaction details correctly')
  it('shows empty state when no transactions')
  it('handles pagination')
  it('allows filtering by date range')
  it('allows sorting by amount/date')
  it('shows edit/delete actions')
})
```

#### 2.3 Chart Components
- **expense-chart.tsx** (0% ❌)
- **income-chart.tsx** (0% ❌)
- **budget-progress.tsx** (0% ❌)

**Test strategy**:
```typescript
// tests/components/expense-chart.test.tsx
describe('ExpenseChart', () => {
  it('renders chart with data')
  it('shows correct category breakdown')
  it('displays percentages correctly')
  it('handles empty data gracefully')
  it('allows switching time periods')
  it('updates when data changes')
})
```

#### 2.4 Navigation Components
- **nav.tsx** (0% ❌)
- **sidebar.tsx** (0% ❌)
- **breadcrumbs.tsx** (0% ❌)

**Test strategy**:
```typescript
// tests/components/nav.test.tsx
describe('Nav', () => {
  it('renders all navigation links')
  it('highlights active route')
  it('shows user menu when authenticated')
  it('handles logout correctly')
  it('toggles mobile menu')
  it('displays notifications badge')
})
```

### Component Testing Best Practices

**1. Mock external dependencies**:
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))
```

**2. Use Testing Library queries**:
```typescript
// Good ✅
expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()

// Avoid ❌
expect(container.querySelector('.submit-button')).toBeTruthy()
```

**3. Test user interactions**:
```typescript
const user = userEvent.setup()
await user.type(screen.getByLabelText(/amount/i), '100')
await user.click(screen.getByRole('button', { name: /submit/i }))
```

**4. Test accessibility**:
```typescript
expect(screen.getByLabelText(/amount/i)).toHaveAttribute('required')
expect(screen.getByRole('alert')).toHaveTextContent('Invalid amount')
```

---

## 🎭 Phase 3: E2E Testing with Playwright (Priority: HIGH)

### Goal: Cover critical user journeys

### Why Playwright?
- ✅ Better than Cypress for modern web apps
- ✅ Supports multiple browsers (Chromium, Firefox, WebKit)
- ✅ Built-in test generator
- ✅ Better API for async operations
- ✅ Network interception and mocking
- ✅ Auto-wait for elements
- ✅ Better TypeScript support

### Setup Playwright

**Installation**:
```bash
pnpm add -D @playwright/test
pnpx playwright install
```

**Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Critical E2E Test Scenarios

#### 3.1 Authentication Flow
**File**: `tests/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can sign up with valid credentials', async ({ page }) => {
    await page.goto('/auth/sign-up')

    await page.fill('[name="name"]', 'Test User')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.fill('[name="confirmPassword"]', 'SecurePass123!')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome, Test User')).toBeVisible()
  })

  test('user can sign in with existing credentials', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('[name="email"]', 'existing@example.com')
    await page.fill('[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
  })

  test('displays error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('[name="email"]', 'wrong@example.com')
    await page.fill('[name="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('user can sign out', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'existing@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Sign out
    await page.click('[aria-label="User menu"]')
    await page.click('text=Sign out')

    await expect(page).toHaveURL('/auth/login')
  })
})
```

#### 3.2 Transaction Management Flow
**File**: `tests/e2e/transactions.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
  })

  test('user can create a new expense transaction', async ({ page }) => {
    await page.goto('/dashboard/transactions/new')

    // Fill form
    await page.selectOption('[name="type"]', 'expense')
    await page.fill('[name="amount"]', '50.00')
    await page.fill('[name="description"]', 'Grocery shopping')
    await page.selectOption('[name="accountId"]', 'account-1')
    await page.selectOption('[name="categoryId"]', 'category-food')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page).toHaveURL('/dashboard/transactions')
    await expect(page.locator('text=Grocery shopping')).toBeVisible()
    await expect(page.locator('text=-$50.00')).toBeVisible()
  })

  test('user can edit existing transaction', async ({ page }) => {
    await page.goto('/dashboard/transactions')

    // Click edit on first transaction
    await page.locator('[data-testid="transaction-item"]').first().click()
    await page.click('[aria-label="Edit transaction"]')

    // Update amount
    await page.fill('[name="amount"]', '75.00')
    await page.click('button[type="submit"]')

    // Verify update
    await expect(page.locator('text=-$75.00')).toBeVisible()
  })

  test('user can delete transaction', async ({ page }) => {
    await page.goto('/dashboard/transactions')

    const transactionText = await page.locator('[data-testid="transaction-item"]').first().textContent()

    // Delete first transaction
    await page.locator('[data-testid="transaction-item"]').first().click()
    await page.click('[aria-label="Delete transaction"]')
    await page.click('button:has-text("Confirm")')

    // Verify deletion
    await expect(page.locator(`text=${transactionText}`)).not.toBeVisible()
  })

  test('form validates required fields', async ({ page }) => {
    await page.goto('/dashboard/transactions/new')

    // Try to submit without filling required fields
    await page.click('button[type="submit"]')

    // Verify validation messages
    await expect(page.locator('text=Amount is required')).toBeVisible()
    await expect(page.locator('text=Description is required')).toBeVisible()
    await expect(page.locator('text=Account is required')).toBeVisible()
  })

  test('user can filter transactions by date range', async ({ page }) => {
    await page.goto('/dashboard/transactions')

    // Open date filter
    await page.click('[aria-label="Filter by date"]')
    await page.fill('[name="startDate"]', '2025-01-01')
    await page.fill('[name="endDate"]', '2025-01-31')
    await page.click('button:has-text("Apply")')

    // Verify filtered results
    const transactions = page.locator('[data-testid="transaction-item"]')
    await expect(transactions).toHaveCount(5) // Assuming 5 transactions in January
  })
})
```

#### 3.3 WhatsApp Integration Flow
**File**: `tests/e2e/whatsapp.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('WhatsApp Integration', () => {
  test('webhook receives and processes expense message', async ({ request }) => {
    const webhookUrl = 'http://localhost:3000/api/webhooks/whatsapp'

    const whatsappMessage = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '5511999999999',
              text: { body: 'gastei 50 no mercado #alimentacao' },
              timestamp: Date.now().toString(),
            }],
          },
        }],
      }],
    }

    const response = await request.post(webhookUrl, {
      data: whatsappMessage,
      headers: {
        'x-hub-signature-256': 'sha256=valid_signature_here',
      },
    })

    expect(response.status()).toBe(200)
  })

  test('scheduled reminder is sent via WhatsApp', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navigate to reminders page (if exists)
    await page.goto('/dashboard/reminders')

    // Create reminder via WhatsApp message format
    // This would be tested via API call to webhook
    // Verify reminder appears in dashboard
  })
})
```

#### 3.4 Budget Tracking Flow
**File**: `tests/e2e/budgets.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Budget Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
  })

  test('user can create a budget', async ({ page }) => {
    await page.goto('/dashboard/budgets/new')

    await page.fill('[name="name"]', 'Monthly Groceries')
    await page.fill('[name="amount"]', '500')
    await page.selectOption('[name="categoryId"]', 'category-food')
    await page.selectOption('[name="period"]', 'monthly')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard/budgets')
    await expect(page.locator('text=Monthly Groceries')).toBeVisible()
  })

  test('budget shows progress bar when expenses added', async ({ page }) => {
    await page.goto('/dashboard/budgets')

    // Verify budget exists
    await expect(page.locator('text=Monthly Groceries')).toBeVisible()

    // Add expense in that category
    await page.goto('/dashboard/transactions/new')
    await page.selectOption('[name="type"]', 'expense')
    await page.fill('[name="amount"]', '150')
    await page.fill('[name="description"]', 'Grocery shopping')
    await page.selectOption('[name="categoryId"]', 'category-food')
    await page.click('button[type="submit"]')

    // Go back to budgets and verify progress
    await page.goto('/dashboard/budgets')
    await expect(page.locator('[data-testid="budget-progress"]')).toHaveAttribute('aria-valuenow', '30') // 150/500 = 30%
  })

  test('budget shows warning when 80% reached', async ({ page }) => {
    // Create transactions totaling 80% of budget
    await page.goto('/dashboard/budgets')

    await expect(page.locator('[data-testid="budget-warning"]')).toBeVisible()
    await expect(page.locator('text=80% of budget used')).toBeVisible()
  })

  test('budget shows alert when exceeded', async ({ page }) => {
    // Create transactions exceeding budget
    await page.goto('/dashboard/budgets')

    await expect(page.locator('[data-testid="budget-exceeded"]')).toBeVisible()
    await expect(page.locator('text=Budget exceeded')).toBeVisible()
  })
})
```

#### 3.5 Dashboard Overview
**File**: `tests/e2e/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
  })

  test('displays summary cards with correct data', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify summary cards
    await expect(page.locator('[data-testid="total-balance"]')).toBeVisible()
    await expect(page.locator('[data-testid="monthly-income"]')).toBeVisible()
    await expect(page.locator('[data-testid="monthly-expenses"]')).toBeVisible()

    // Verify values are numbers
    const balance = await page.locator('[data-testid="total-balance"]').textContent()
    expect(balance).toMatch(/\$[\d,]+\.[\d]{2}/)
  })

  test('displays recent transactions', async ({ page }) => {
    await page.goto('/dashboard')

    const recentTransactions = page.locator('[data-testid="recent-transactions"] [data-testid="transaction-item"]')
    await expect(recentTransactions).toHaveCount(5) // Last 5 transactions
  })

  test('displays expense breakdown chart', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.locator('[data-testid="expense-chart"]')).toBeVisible()
    await expect(page.locator('text=Food')).toBeVisible() // Category
    await expect(page.locator('text=Transport')).toBeVisible()
  })

  test('quick add transaction from dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    await page.click('[aria-label="Quick add transaction"]')

    // Modal should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    await page.fill('[name="amount"]', '25.50')
    await page.fill('[name="description"]', 'Coffee')
    await page.click('button[type="submit"]')

    // Modal closes and transaction appears in recent list
    await expect(page.locator('text=Coffee')).toBeVisible()
  })
})
```

### E2E Testing Best Practices

**1. Use test fixtures for authentication**:
```typescript
// tests/e2e/fixtures/auth.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await use(page)
  },
})
```

**2. Use data-testid for stable selectors**:
```tsx
// Good ✅
<button data-testid="submit-transaction">Submit</button>

// Then in test:
await page.click('[data-testid="submit-transaction"]')

// Avoid ❌
<button className="btn-primary">Submit</button>
await page.click('.btn-primary') // Fragile if CSS changes
```

**3. Mock external APIs**:
```typescript
await page.route('**/api/external-service', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ success: true }),
  })
})
```

**4. Use screenshots on failure**:
```typescript
test('complex workflow', async ({ page }) => {
  try {
    // Test steps...
  } catch (error) {
    await page.screenshot({ path: 'failure-screenshot.png', fullPage: true })
    throw error
  }
})
```

**5. Test responsive design**:
```typescript
test('mobile navigation works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })

  await page.goto('/dashboard')
  await page.click('[aria-label="Open menu"]')

  await expect(page.locator('[role="navigation"]')).toBeVisible()
})
```

---

## 📈 Phase 4: Integration Testing (Priority: MEDIUM)

### Goal: Test interactions between multiple modules

### Integration Test Scenarios

#### 4.1 Transaction Creation Flow (Full Stack)
**File**: `tests/integration/transaction-flow.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { POST as createTransaction } from '@/app/api/transactions/route'

describe('Transaction Creation Flow', () => {
  let userId: string
  let accountId: string

  beforeEach(async () => {
    // Create test user and account
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })
    userId = user.id

    const account = await prisma.financialAccount.create({
      data: {
        name: 'Test Account',
        userId: user.id,
        type: 'checking',
        balance: 1000,
        currency: 'USD',
      },
    })
    accountId = account.id
  })

  it('creates transaction and updates account balance', async () => {
    const transactionData = {
      type: 'expense',
      amount: 50,
      description: 'Test expense',
      accountId,
      date: new Date().toISOString(),
    }

    // Create transaction
    const response = await createTransaction(
      new Request('http://localhost/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
        headers: { 'user-id': userId },
      })
    )

    const result = await response.json()
    expect(result.success).toBe(true)

    // Verify account balance updated
    const updatedAccount = await prisma.financialAccount.findUnique({
      where: { id: accountId },
    })

    expect(updatedAccount?.balance.toNumber()).toBe(950) // 1000 - 50
  })
})
```

#### 4.2 WhatsApp to Database Flow
**File**: `tests/integration/whatsapp-flow.test.ts`

```typescript
describe('WhatsApp Message to Transaction', () => {
  it('processes WhatsApp message and creates transaction', async () => {
    // Mock WhatsApp webhook payload
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '5511999999999',
              text: { body: 'gastei 50 no mercado #alimentacao' },
            }],
          },
        }],
      }],
    }

    // Process webhook
    const response = await POST(
      new Request('http://localhost/api/webhooks/whatsapp', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      })
    )

    expect(response.status).toBe(200)

    // Verify transaction was created
    const transaction = await prisma.transaction.findFirst({
      where: {
        user: {
          phone: '5511999999999',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(transaction).toBeTruthy()
    expect(transaction?.amount.toNumber()).toBe(50)
    expect(transaction?.type).toBe('expense')
  })
})
```

---

## 🔧 Phase 5: Utility & Helper Testing (Priority: LOW)

### Files to Test

#### 5.1 Date Utilities
**File**: `tests/utils/date-utils.test.ts`

```typescript
import { formatDate, isWithinCurrentMonth, getMonthRange } from '@/lib/date-utils'

describe('Date Utilities', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-15')
    expect(formatDate(date)).toBe('Jan 15, 2025')
  })

  it('checks if date is within current month', () => {
    const now = new Date('2025-01-15')
    const withinMonth = new Date('2025-01-20')
    const outsideMonth = new Date('2025-02-01')

    expect(isWithinCurrentMonth(withinMonth, now)).toBe(true)
    expect(isWithinCurrentMonth(outsideMonth, now)).toBe(false)
  })
})
```

#### 5.2 Currency Utilities
**File**: `tests/utils/currency-utils.test.ts`

```typescript
import { formatCurrency, parseCurrency } from '@/lib/currency-utils'

describe('Currency Utilities', () => {
  it('formats currency correctly', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00')
    expect(formatCurrency(1000.5)).toBe('$1,000.50')
  })

  it('parses currency string to number', () => {
    expect(parseCurrency('$1,000.00')).toBe(1000)
    expect(parseCurrency('1.000,50')).toBe(1000.5) // European format
  })
})
```

#### 5.3 Validation Utilities
**File**: `tests/utils/validation.test.ts`

```typescript
import { validateEmail, validatePassword, validatePhoneNumber } from '@/lib/validation'

describe('Validation Utilities', () => {
  it('validates email correctly', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('invalid-email')).toBe(false)
  })

  it('validates password strength', () => {
    expect(validatePassword('weak')).toBe(false)
    expect(validatePassword('StrongPass123!')).toBe(true)
  })

  it('validates phone number formats', () => {
    expect(validatePhoneNumber('5511999999999')).toBe(true)
    expect(validatePhoneNumber('123')).toBe(false)
  })
})
```

---

## 🚀 Phase 6: Performance & Load Testing (Priority: LOW)

### Goal: Ensure system handles load gracefully

### Performance Test Scenarios

#### 6.1 API Load Testing with k6
**File**: `tests/performance/api-load.js`

```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
  },
}

export default function () {
  const token = 'test-jwt-token'

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

  // Test GET transactions
  const res = http.get('http://localhost:3000/api/transactions', params)

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })

  sleep(1)
}
```

**Run**: `k6 run tests/performance/api-load.js`

#### 6.2 Database Query Performance
**File**: `tests/performance/db-queries.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Database Query Performance', () => {
  it('fetches transactions within acceptable time', async () => {
    const start = Date.now()

    await prisma.transaction.findMany({
      where: {
        userId: 'test-user-id',
        createdAt: {
          gte: new Date('2025-01-01'),
          lte: new Date('2025-01-31'),
        },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const duration = Date.now() - start

    expect(duration).toBeLessThan(100) // Should complete in <100ms
  })
})
```

---

## 📊 Testing Metrics & Goals

### Coverage Targets

| Component                | Current | Target | Priority |
|-------------------------|---------|--------|----------|
| **API Routes**          | 0%      | 80%+   | HIGH     |
| **Business Logic**      | 100%    | 100%   | ✅       |
| **Components**          | 10%     | 70%+   | MEDIUM   |
| **Utilities**           | 40%     | 85%+   | LOW      |
| **Integration Tests**   | 0%      | 15+    | MEDIUM   |
| **E2E Tests**           | 0%      | 30+    | HIGH     |
| **Overall Project**     | 5.75%   | 75%+   | -        |

### Test Count Goals

- **Unit Tests**: 200+ (currently 102)
- **Integration Tests**: 30+
- **E2E Tests**: 40+
- **Performance Tests**: 10+

**Total Goal: 280+ tests**

---

## 🗓️ Implementation Timeline

### Week 1-2: API Routes Testing
- [ ] Set up API testing infrastructure
- [ ] Test authentication routes (sign-up, sign-in, session)
- [ ] Test transaction CRUD routes
- [ ] Test account routes
- [ ] Test insights generation route
- [ ] Test WhatsApp webhook route
- **Goal**: 80%+ API coverage

### Week 3: Component Testing
- [ ] Improve transaction-form coverage to 85%+
- [ ] Test account-form component
- [ ] Test category-form component
- [ ] Test list components (transaction-list, account-list)
- [ ] Test chart components
- **Goal**: 70%+ component coverage

### Week 4: E2E Setup & Core Flows
- [ ] Install and configure Playwright
- [ ] Create authentication fixtures
- [ ] Test authentication flow
- [ ] Test transaction CRUD flow
- [ ] Test dashboard overview
- **Goal**: 10+ E2E tests

### Week 5: E2E Advanced Flows
- [ ] Test budget tracking flow
- [ ] Test goal management flow
- [ ] Test WhatsApp integration scenarios
- [ ] Test reports generation
- [ ] Test responsive design (mobile/desktop)
- **Goal**: 30+ E2E tests

### Week 6: Integration & Performance Testing
- [ ] Test full-stack transaction flow
- [ ] Test WhatsApp-to-database flow
- [ ] Test budget-transaction integration
- [ ] Set up k6 for load testing
- [ ] Performance test critical API endpoints
- **Goal**: 15+ integration tests, 5+ performance tests

### Week 7: Utility & Polish
- [ ] Test date utilities
- [ ] Test currency utilities
- [ ] Test validation utilities
- [ ] Test file validation
- [ ] Fix any remaining coverage gaps
- **Goal**: 85%+ utility coverage

### Week 8: CI/CD & Documentation
- [ ] Set up GitHub Actions for automated testing
- [ ] Configure test coverage reports
- [ ] Add pre-commit hooks for tests
- [ ] Document testing standards
- [ ] Create testing guide for contributors

---

## 🛠️ Development Setup

### Scripts to Add to `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:performance": "k6 run tests/performance/api-load.js",
    "test:all": "pnpm test:coverage && pnpm test:e2e",
    "test:watch": "vitest --watch"
  }
}
```

### CI/CD Pipeline (GitHub Actions)

**File**: `.github/workflows/tests.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, rewrite]
  pull_request:
    branches: [main, rewrite]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests with coverage
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpx playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 📝 Testing Standards & Guidelines

### 1. Test File Organization

```
tests/
├── unit/
│   ├── lib/
│   │   ├── assistant/
│   │   │   ├── nlu.test.ts
│   │   │   └── providers/
│   │   │       └── whatsapp.test.ts
│   │   └── jobs/
│   │       ├── queue.test.ts
│   │       └── worker.test.ts
│   ├── utils/
│   │   ├── date-utils.test.ts
│   │   └── currency-utils.test.ts
│   └── components/
│       ├── transaction-form.test.tsx
│       └── account-form.test.tsx
├── integration/
│   ├── transaction-flow.test.ts
│   └── whatsapp-flow.test.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── transactions.spec.ts
│   ├── budgets.spec.ts
│   └── dashboard.spec.ts
├── performance/
│   ├── api-load.js
│   └── db-queries.test.ts
└── helpers/
    ├── api-test-setup.ts
    └── test-data.ts
```

### 2. Naming Conventions

- **Unit tests**: `*.test.ts` or `*.test.tsx`
- **E2E tests**: `*.spec.ts`
- **Performance tests**: `*.perf.js` or `*.perf.ts`

### 3. Test Structure (AAA Pattern)

```typescript
describe('Feature', () => {
  it('should do something', async () => {
    // Arrange - Set up test data
    const user = createTestUser()

    // Act - Perform the action
    const result = await someFunction(user)

    // Assert - Verify the result
    expect(result).toBe(expectedValue)
  })
})
```

### 4. Test Coverage Rules

- **Critical paths**: 100% coverage required
- **Business logic**: 90%+ coverage
- **UI components**: 70%+ coverage
- **Utilities**: 85%+ coverage
- **API routes**: 80%+ coverage

### 5. When to Use Each Test Type

| Test Type      | Use When...                                       | Example                          |
|---------------|---------------------------------------------------|----------------------------------|
| **Unit**      | Testing isolated functions/components             | NLU parsing, form validation     |
| **Integration** | Testing multiple modules together                | WhatsApp → DB, Transaction + Balance |
| **E2E**       | Testing complete user journeys                    | Sign up → Create transaction → View report |
| **Performance** | Verifying speed/load requirements               | API response time, DB query speed |

---

## 🎯 Success Criteria

### Phase Completion Checklist

- [ ] **Phase 1**: All API routes have 80%+ test coverage
- [ ] **Phase 2**: All components have 70%+ test coverage
- [ ] **Phase 3**: 30+ E2E tests covering critical flows
- [ ] **Phase 4**: 15+ integration tests for cross-module interactions
- [ ] **Phase 5**: All utility functions have 85%+ coverage
- [ ] **Phase 6**: Performance benchmarks established and passing

### Final Goals

- ✅ **100% test pass rate** (currently achieved)
- [ ] **75%+ overall code coverage** (currently 5.75%)
- [ ] **Zero critical bugs in production**
- [ ] **<500ms API response time (p95)**
- [ ] **CI/CD pipeline with automated testing**
- [ ] **Comprehensive test documentation**

---

## 📚 Resources

### Testing Libraries Documentation

- [Vitest](https://vitest.dev/) - Unit test framework
- [Testing Library](https://testing-library.com/) - Component testing
- [Playwright](https://playwright.dev/) - E2E testing
- [k6](https://k6.io/) - Performance testing
- [Prisma Testing](https://www.prisma.io/docs/guides/testing) - Database testing

### Best Practices

- [Testing Best Practices by Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [API Testing Guide](https://www.postman.com/api-platform/api-testing/)

---

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Run full test suite and review coverage reports
- **Monthly**: Review and update E2E tests for new features
- **Quarterly**: Performance benchmarking and optimization
- **Before major releases**: Full regression testing (unit + integration + E2E)

### When to Write Tests

- ✅ **Before** fixing a bug (reproduce it with a test first)
- ✅ **During** feature development (TDD approach)
- ✅ **After** finding a production issue (prevent regression)

---

**Last Updated**: January 11, 2025
**Status**: Ready for implementation
**Version**: 1.0
