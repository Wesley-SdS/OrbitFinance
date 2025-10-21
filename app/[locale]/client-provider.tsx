import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { ClientWrapper } from "./client-wrapper"

export default async function ClientProvider({ 
  children, 
  locale 
}: { 
  children: React.ReactNode
  locale: string 
}) {
  const messages = await getMessages({ locale })

  return (
    <div className="min-h-svh flex flex-col">
      <ClientWrapper locale={locale} />
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </div>
  )
}
