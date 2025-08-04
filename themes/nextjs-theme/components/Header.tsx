import Link from 'next/link'

interface HeaderProps {
  siteName?: string
  siteDescription?: string
}

export default function Header({ siteName = 'NextPress', siteDescription = 'A modern WordPress alternative' }: HeaderProps) {
  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-wp-blue hover:text-wp-blue-dark transition-colors">
              {siteName}
            </Link>
            {siteDescription && (
              <p className="ml-4 text-muted-foreground hidden md:block">
                {siteDescription}
              </p>
            )}
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-foreground hover:text-wp-blue transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-foreground hover:text-wp-blue transition-colors">
              Blog
            </Link>
            <Link href="/about" className="text-foreground hover:text-wp-blue transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-foreground hover:text-wp-blue transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
} 