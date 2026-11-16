import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => (
  <div role="status" className="flex min-h-[50vh] w-full items-center justify-center gap-2 text-muted-foreground">
    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
    Loading…
  </div>
);

export default LoadingSpinner;
