import { AccountFormClient } from "@/components/account-form-client"

export default function NewAccountPage() {
  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Account</h1>
        <p className="text-muted-foreground">Create a new account to track your finances</p>
      </div>

      <AccountFormClient />
    </div>
  )
}
