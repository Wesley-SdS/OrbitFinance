"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="w-screen h-screen bg-gradient-to-br from-primary-900 via-gray-dark-900 to-primary-800 text-gray-dark-800 overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <div className="bg-transparent backdrop-blur-0 border border-primary-200/30 rounded-2xl shadow-xl shadow-primary-500/20 p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="mb-6">
                <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-dark-900 mb-2">
                OrbiFinance
              </h1>
              <p className="text-sm text-gray-dark-600">{subtitle}</p>
            </div>

            {children}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
