"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  TRANSLATIONS,
  TRANSLATION_GROUPS,
  DEFAULT_TRANSLATION,
} from "@/lib/bible/translations";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TranslationPicker({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={current}
      onValueChange={(code) => {
        const target =
          code === DEFAULT_TRANSLATION ? pathname : `${pathname}?t=${code}`;
        router.push(target);
      }}
      items={TRANSLATIONS.map((t) => ({ value: t.code, label: t.code }))}
    >
      <SelectTrigger aria-label="Bible translation" className="min-w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-96" alignItemWithTrigger={false}>
        {TRANSLATION_GROUPS.map((group) => (
          <SelectGroup key={group.language}>
            <SelectLabel>{group.language}</SelectLabel>
            {group.translations.map((t) => (
              <SelectItem key={t.code} value={t.code}>
                <span className="font-medium">{t.code}</span>
                <span className="max-w-48 truncate text-muted-foreground">{t.name}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
