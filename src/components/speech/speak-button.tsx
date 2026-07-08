"use client";

import { useSpeech } from "@/lib/speech/use-speech";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** One-shot "read this aloud" button for a single passage of text. */
export function SpeakButton({
  text,
  lang = "en",
  label = "Listen",
  variant = "outline",
  size = "sm",
}: {
  text: string;
  lang?: string;
  label?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "sm" | "xs" | "default";
}) {
  const speech = useSpeech(lang);
  if (!speech.supported) return null;

  const active = speech.status !== "idle";

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => (active ? speech.stop() : speech.play([text]))}
    >
      {active ? <Square data-icon="inline-start" /> : <Volume2 data-icon="inline-start" />}
      {active ? "Stop" : label}
    </Button>
  );
}
