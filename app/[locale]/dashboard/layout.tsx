import type React from "react"
import { getSession } from "@/lib/session"
import { redirect } from "@/lib/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <DashboardNav />
      </Sidebar>
      <SidebarInset>
        <div className="min-h-screen bg-background">
          <main className="px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
