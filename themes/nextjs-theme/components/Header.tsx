import Link from 'next/link'

interface HeaderProps {
  siteName?: string
  siteDescription?: string
}

export default function Header({ siteName = 'NextPress', siteDescription = 'A modern WordPress alternative' }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-wp-blue">
              {siteName}
            </Link>
            {siteDescription && (
              <p className="ml-4 text-gray-600 hidden md:block">
                {siteDescription}
              </p>
            )}
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-wp-blue transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-wp-blue transition-colors">
              Blog
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-wp-blue transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-wp-blue transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
} 