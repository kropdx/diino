import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserX } from 'lucide-react'

export default function UserNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <UserX className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>User not found</CardTitle>
          <CardDescription>
            This user doesn&apos;t exist or may have deleted their account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button className="w-full">
              Back to chat
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}