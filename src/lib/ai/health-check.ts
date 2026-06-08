import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export interface AIHealthResult {
  ok: boolean;
  provider: "gemini" | "openai" | null;
  /** API key is present */
  configured: boolean;
  /** Text model responds */
  textPing: boolean;
  /** Google Search grounding works (Lens-style ID) */
  googleSearch: boolean;
  model?: string;
  latencyMs?: number;
  error?: string;
  /** Actionable fix when not ok */
  fix?: string;
}

function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  );
}

function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function checkAIHealth(): Promise<AIHealthResult> {
  const start = Date.now();

  if (!isGeminiConfigured() && !isOpenAIConfigured()) {
    return {
      ok: false,
      provider: null,
      configured: false,
      textPing: false,
      googleSearch: false,
      fix: "Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.",
    };
  }

  if (isOpenAIConfigured()) {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: 'Reply with exactly the word OK',
        maxOutputTokens: 10,
      });
      const ok = text.toUpperCase().includes("OK");
      return {
        ok,
        provider: "openai",
        configured: true,
        textPing: ok,
        googleSearch: false,
        model: "gpt-4o-mini",
        latencyMs: Date.now() - start,
        fix: ok ? undefined : "OpenAI responded but check your API key quota.",
      };
    } catch (err) {
      return {
        ok: false,
        provider: "openai",
        configured: true,
        textPing: false,
        googleSearch: false,
        error: err instanceof Error ? err.message : String(err),
        fix: "Verify OPENAI_API_KEY is valid and has credits.",
      };
    }
  }

  const google = createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
  const modelName =
    process.env.GEMINI_VISION_MODEL?.trim() ||
    process.env.GEMINI_ANALYSIS_MODEL?.trim() ||
    "gemini-2.5-flash";

  try {
    const { text } = await generateText({
      model: google(modelName),
      prompt: "Reply with exactly the word OK",
      maxOutputTokens: 10,
      providerOptions: { google: { structuredOutputs: false } },
    });

    if (!text.toUpperCase().includes("OK")) {
      return {
        ok: false,
        provider: "gemini",
        configured: true,
        textPing: false,
        googleSearch: false,
        model: modelName,
        latencyMs: Date.now() - start,
        fix: "Gemini key works but returned an unexpected response. Try redeploying.",
      };
    }

    let googleSearch = false;
    let searchError: string | undefined;

    try {
      await generateText({
        model: google("gemini-2.5-flash"),
        tools: {
          google_search: google.tools.googleSearch({
            searchTypes: { webSearch: {} },
          }),
        },
        prompt: "What company makes Nike shoes? Answer in one word only.",
        maxOutputTokens: 30,
        providerOptions: { google: { structuredOutputs: false } },
      });
      googleSearch = true;
    } catch (err) {
      searchError = err instanceof Error ? err.message : String(err);
      googleSearch = false;
    }

    const latencyMs = Date.now() - start;

    if (!googleSearch) {
      return {
        ok: true,
        provider: "gemini",
        configured: true,
        textPing: true,
        googleSearch: false,
        model: modelName,
        latencyMs,
        error: searchError,
        fix:
          "Gemini works but Google Search grounding failed. Photo ID will use vision-only. Enable billing on Google AI Studio or check grounding access on your API key.",
      };
    }

    return {
      ok: true,
      provider: "gemini",
      configured: true,
      textPing: true,
      googleSearch: true,
      model: modelName,
      latencyMs,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    let fix =
      "Check GEMINI_API_KEY in Vercel, redeploy, and confirm the key is active at aistudio.google.com.";

    if (/API key|401|403|PERMISSION|invalid/i.test(message)) {
      fix =
        "Invalid or restricted API key. Create a new key at aistudio.google.com/apikey, update Vercel, redeploy.";
    } else if (/429|quota|rate/i.test(message)) {
      fix = "Gemini quota exceeded. Wait or enable billing on your Google AI project.";
    }

    return {
      ok: false,
      provider: "gemini",
      configured: true,
      textPing: false,
      googleSearch: false,
      model: modelName,
      error: message,
      fix,
    };
  }
}

/** Tips shown in UI for successful photo analysis */
export const PHOTO_SUCCESS_TIPS = [
  {
    title: "Full item shot",
    detail: "Show the whole product — front or 3/4 angle, good lighting.",
  },
  {
    title: "Brand / logo close-up",
    detail: "Tongue tag, heel logo, label, or box branding. This is what Google Lens uses.",
  },
  {
    title: "Model / size tag",
    detail: "Style code, SKU, size label, or serial plate — fills in exact model.",
  },
  {
    title: "Wear or defects (optional)",
    detail: "Scuffs, dirt, cracks — helps condition and pricing.",
  },
] as const;

export const SUCCESS_CHECKLIST = [
  {
    step: 1,
    title: "Set GEMINI_API_KEY",
    detail: "Vercel → Settings → Environment Variables → add key → Redeploy",
    link: "https://aistudio.google.com/apikey",
  },
  {
    step: 2,
    title: "Test connection",
    detail: "Settings → Test AI — should show green for Gemini + Google Search",
  },
  {
    step: 3,
    title: "Upload 2–4 clear photos",
    detail: "Include brand tag + full item. Avoid blurry or dark shots.",
  },
  {
    step: 4,
    title: "Analyze & verify",
    detail: "Check 'Matched on the web' links. Edit anything wrong, then continue.",
  },
] as const;
