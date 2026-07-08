import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MEMORY_PACKS, getMemoryPack } from "@/lib/bible/memory-verses";
import { MemoryTrainer } from "@/components/memorize/memory-trainer";

export function generateStaticParams() {
  return MEMORY_PACKS.map((p) => ({ pack: p.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/memorize/[pack]">): Promise<Metadata> {
  const { pack: id } = await params;
  const pack = getMemoryPack(id);
  if (!pack) return { title: "Pack not found" };
  return { title: `Memorize: ${pack.name}`, description: pack.description };
}

export default async function PackPage({ params }: PageProps<"/memorize/[pack]">) {
  const { pack: id } = await params;
  const pack = getMemoryPack(id);
  if (!pack) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/memorize"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All packs
      </Link>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {pack.name}
        </h1>
        <p className="mt-1 text-muted-foreground">{pack.description}</p>
      </div>
      <MemoryTrainer pack={pack} />
    </div>
  );
}
