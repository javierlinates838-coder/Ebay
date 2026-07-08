import type { MetadataRoute } from "next";
import { BOOKS } from "@/lib/bible/books";
import { PLANS } from "@/lib/bible/plans";
import { MEMORY_PACKS } from "@/lib/bible/memory-verses";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/bible`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/search`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/plans`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/memorize`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/quiz`, changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const plan of PLANS) {
    entries.push({ url: `${base}/plans/${plan.id}`, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const pack of MEMORY_PACKS) {
    entries.push({ url: `${base}/memorize/${pack.id}`, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const book of BOOKS) {
    entries.push({ url: `${base}/bible/${book.slug}`, changeFrequency: "yearly", priority: 0.8 });
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      entries.push({
        url: `${base}/bible/${book.slug}/${chapter}`,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
