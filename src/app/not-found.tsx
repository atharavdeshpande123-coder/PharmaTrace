import Link from 'next/link'

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text">404</h1>
        <p className="mt-2 text-lg">Page Not Found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          Go to PharmaTrace
        </Link>
      </div>
    </div>
  )
}
