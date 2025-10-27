import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface LazyChartsProps {
  incomeExpenseData: any
  monthlyTrendData: any
  categoryBreakdownData: any
}

export function LazyCharts({ incomeExpenseData, monthlyTrendData, categoryBreakdownData }: LazyChartsProps) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
        <div className="h-[300px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
          Income Expense Chart Placeholder
        </div>
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
        <div className="h-[300px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
          Monthly Trend Chart Placeholder
        </div>
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
        <div className="h-[300px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
          Category Breakdown Chart Placeholder
        </div>
      </Suspense>
    </div>
  )
}