import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary/80">404</h1>
          <h2 className="text-4xl font-bold tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground text-lg">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="relative h-64 w-full max-w-lg mx-auto my-8">
          <div className="absolute inset-0 bg-muted rounded-full opacity-20 blur-3xl"></div>
          <div className="relative h-full flex items-center justify-center">
            <div className="text-9xl">🕵️‍♂️</div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            Let's get you back on track. Here are some helpful links:
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button asChild variant="default" size="lg">
              <Link href="/">
                Go to Homepage
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
