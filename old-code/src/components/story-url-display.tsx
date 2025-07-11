'use client';

import { FaviconImage } from '@/components/favicon-image';

interface StoryUrlDisplayProps {
  url: string;
  title: string;
  favicon: string | null;
  faviconBlobUrl?: string | null;
}

export const StoryUrlDisplay: React.FC<StoryUrlDisplayProps> = ({
  url,
  title,
  favicon,
  faviconBlobUrl,
}) => {
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors group cursor-pointer"
      onClick={() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
    >
      <FaviconImage url={favicon} blobUrl={faviconBlobUrl} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{url}</p>
      </div>
    </div>
  );
};
