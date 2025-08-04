export default function Footer() {
  return (
    <footer className="bg-muted border-t border-border mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NextPress. All rights reserved.</p>
          <p className="mt-2 text-sm">
            Powered by NextPress - A modern WordPress alternative
          </p>
        </div>
      </div>
    </footer>
  )
} 