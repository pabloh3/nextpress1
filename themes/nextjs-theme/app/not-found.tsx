import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center content-fade-in">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/"
          className="inline-block bg-wp-blue text-white px-6 py-3 rounded-lg hover:bg-wp-blue-dark transition-colors font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
} 