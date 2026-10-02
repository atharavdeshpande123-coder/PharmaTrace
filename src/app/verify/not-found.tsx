import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-rose-300">Page Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The verification page you are looking for does not exist.
        </p>
        <a href="/" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          Go to PharmaTrace
        </a>
      </div>
    </div>
  )
}
