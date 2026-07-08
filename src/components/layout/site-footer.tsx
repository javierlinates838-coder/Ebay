import Link from "next/link";
import { LogoMark, Ornament } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-muted-foreground">
        <LogoMark id="logo-footer" className="size-9 opacity-90" />
        <p className="scripture text-center italic">
          &ldquo;Thy word is a lamp unto my feet, and a light unto my
          path.&rdquo; — Psalm 119:105
        </p>
        <Ornament />
        <nav className="flex items-center gap-5">
          <Link href="/bible" className="hover:text-foreground">
            Read
          </Link>
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
          <Link href="/plans" className="hover:text-foreground">
            Plans
          </Link>
          <Link href="/memorize" className="hover:text-foreground">
            Memorize
          </Link>
          <Link href="/quiz" className="hover:text-foreground">
            Quiz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
