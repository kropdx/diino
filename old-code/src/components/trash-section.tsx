'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

interface TrashData {
  count: number;
  stories: unknown[];
}

export function TrashSection() {
  const [trashData, setTrashData] = useState<TrashData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrashData() {
      try {
        const response = await fetch('/api/user/trash');
        if (response.ok) {
          const data = await response.json();
          setTrashData(data);
        }
      } catch (error) {
        console.error('Error fetching trash data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrashData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Trash Management
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Trash Management
        </CardTitle>
        <CardDescription>
          Manage stories that were moved to trash when you deleted tags
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trashData && trashData.count > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You have {trashData.count} story{trashData.count === 1 ? '' : 's'} in trash
            </p>
            <Link href="/settings/trash">
              <Button variant="outline" className="w-full">
                View Trash ({trashData.count})
              </Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No stories in trash. When you delete tags, their stories will be moved here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
