import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p className="scripture italic">
          &ldquo;Thy word is a lamp unto my feet, and a light unto my
          path.&rdquo; — Psalm 119:105
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/bible" className="hover:text-foreground">
            Read
          </Link>
          <Link href="/plans" className="hover:text-foreground">
            Plans
          </Link>
          <Link href="/quiz" className="hover:text-foreground">
            Quiz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
