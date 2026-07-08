import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <LogoMark id="logo-404" className="size-12" />
      <h1 className="font-heading text-3xl font-semibold">Page not found</h1>
      <p className="scripture italic text-muted-foreground">
        &ldquo;I have gone astray like a lost sheep; seek thy servant.&rdquo; —
        Psalm 119:176
      </p>
      <div className="flex gap-2">
        <Button render={<Link href="/" />}>Go home</Button>
        <Button variant="outline" render={<Link href="/bible" />}>
          Open the library
        </Button>
      </div>
    </div>
  );
}
