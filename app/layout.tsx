export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
