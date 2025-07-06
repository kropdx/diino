export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto max-w-sm w-full space-y-6 p-6">
        {children}
      </div>
    </div>
  )
}