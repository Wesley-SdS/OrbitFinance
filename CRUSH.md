CRUSH.md

# OrbiFinance MVP - Development Commands & Guidelines

## Commands

### Development

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
```

### Code Quality

```bash
pnpm lint             # Run oxlint linter
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format with Prettier
pnpm type-check       # TypeScript type checking
```

### Testing

```bash
pnpm test             # Run Vitest tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Generate coverage report
```

### Database (Prisma)

```bash
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database
pnpm db:studio        # Open Prisma Studio
```

## Code Style Guidelines

### Import Patterns

- Path alias: `@/*` maps to root directory
- `"use client"` directive at top of client components
- Type imports: `import type React from "react"`
- Third-party libraries after internal imports

### Naming Conventions

- Components: PascalCase (TransactionForm)
- Files: kebab-case (transaction-form.tsx)
- Variables/Functions: camelCase
- Database: camelCase (userId, createdAt)

### Component Structure

```tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type ComponentProps = {
  // props definition
}

export function Component({ prop }: ComponentProps) {
  const [state, setState] = useState()

  return (
    // JSX
  )
}
```

### Error Handling

- Try-catch blocks in async operations
- Consistent error format: `Error instanceof Error ? error.message : "An error occurred"`
- Database: `if (error) throw error`

### Authentication

- Use Better Auth with Prisma adapter
- Client: `useSession()` hook from `@/lib/auth-client`
- Server: `auth.api.getSession()` from `@/lib/auth`

### Database

- Use Prisma ORM with `@/lib/prisma` client
- Follow Prisma schema types
- Handle relations properly with `include` or `select`

### TypeScript

- Strict mode enabled
- Infer types from Zod schemas: `export type Input = z.infer<typeof Schema>`
- Use generated Prisma types from `@prisma/client`

## Architecture

- Next.js 15 with App Router
- PostgreSQL + Prisma ORM
- Better Auth for authentication
- TailwindCSS 4.1 + shadcn/ui
- Zustand for state management
- oxlint for modern linting
- Vitest for testing
