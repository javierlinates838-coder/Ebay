"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ExternalLink, Search, Sparkles, Tag } from "lucide-react";
import type { ProductAnalysis } from "@/types";

interface ProductAnalysisCardProps {
  analysis: ProductAnalysis;
  editable?: boolean;
  warning?: string;
  source?: "gemini" | "openai" | "demo";
  onChange?: (analysis: ProductAnalysis) => void;
}

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

export function ProductAnalysisCard({
  analysis,
  editable = false,
  warning,
  source,
  onChange,
}: ProductAnalysisCardProps) {
  const confidenceColor =
    analysis.confidence >= 80
      ? "text-green-600 dark:text-green-400"
      : analysis.confidence >= 65
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  const updateField = <K extends keyof ProductAnalysis>(key: K, value: ProductAnalysis[K]) => {
    onChange?.({ ...analysis, [key]: value });
  };

  const extraFields = [
    analysis.productType && { label: "Type", value: analysis.productType, key: "productType" as const },
    analysis.size && { label: "Size", value: analysis.size, key: "size" as const },
    analysis.gender && { label: "Department", value: analysis.gender, key: "gender" as const },
    analysis.material && { label: "Material", value: analysis.material, key: "material" as const },
  ].filter(Boolean) as { label: string; value: string; key: keyof ProductAnalysis }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#0064D2]/10 to-[#0064D2]/5 pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">AI Product Analysis</CardTitle>
            <div className="flex items-center gap-2">
              {source === "demo" && (
                <Badge variant="outline" className="text-xs">
                  Demo mode
                </Badge>
              )}
              {source === "gemini" && (
                <Badge variant="outline" className="text-xs text-[#0064D2]">
                  {analysis.usedWebSearch ? "Google Search + Vision" : "Gemini Vision"}
                </Badge>
              )}
              <Badge variant="secondary" className="font-mono">
                {analysis.confidence}% confidence
              </Badge>
            </div>
          </div>
          <Progress value={analysis.confidence} className="h-2" />
          <p className={`text-xs font-medium ${confidenceColor}`}>
            {analysis.confidence >= 80
              ? "High confidence — brand/model likely confirmed from photos"
              : analysis.confidence >= 65
                ? "Moderate confidence — verify brand and model"
                : "Low confidence — add a clear photo of the label or tag"}
          </p>
          {warning && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{warning}</p>
          )}
        </CardHeader>

        {analysis.ebayTitleSuggestion && (
          <CardContent className="border-b bg-[#0064D2]/5 py-3">
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[#0064D2]">
              <Sparkles className="h-3 w-3" />
              Suggested eBay title
            </p>
            <p className="mt-1 text-sm font-medium">{analysis.ebayTitleSuggestion}</p>
          </CardContent>
        )}

        {analysis.webSources && analysis.webSources.length > 0 && (
          <CardContent className="border-b bg-muted/30 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Matched on the web
            </p>
            <ul className="mt-2 space-y-1">
              {analysis.webSources.map((src) => (
                <li key={src.url}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#0064D2] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {src.title}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        )}

        {analysis.identificationNotes && (
          <CardContent className="border-b bg-muted/30 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              What AI saw
            </p>
            <p className="mt-1 text-sm">{analysis.identificationNotes}</p>
            {analysis.conditionNotes && (
              <p className="mt-2 text-xs text-muted-foreground">
                Condition: {analysis.conditionNotes}
              </p>
            )}
          </CardContent>
        )}

        <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
          {editable ? (
            <>
              <Field label="Product" value={analysis.product} onChange={(v) => updateField("product", v)} />
              <Field label="Brand" value={analysis.brand} onChange={(v) => updateField("brand", v)} />
              <Field label="Model" value={analysis.model} onChange={(v) => updateField("model", v)} />
              <Field label="Color" value={analysis.color} onChange={(v) => updateField("color", v)} />
              {extraFields.map(({ label, value, key }) => (
                <Field
                  key={key}
                  label={label}
                  value={value}
                  onChange={(v) => updateField(key, v as ProductAnalysis[typeof key])}
                />
              ))}
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Condition
                </Label>
                <Select
                  value={analysis.condition}
                  onValueChange={(value) => updateField("condition", value ?? analysis.condition)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Category" value={analysis.category} onChange={(v) => updateField("category", v)} />
              {analysis.searchQuery && (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                    <Search className="h-3 w-3" />
                    Suggested market search
                  </Label>
                  <Input
                    value={analysis.searchQuery}
                    onChange={(e) => updateField("searchQuery", e.target.value)}
                  />
                </div>
              )}
            </>
          ) : (
            [
              { label: "Product", value: analysis.product },
              { label: "Brand", value: analysis.brand },
              { label: "Model", value: analysis.model },
              { label: "Color", value: analysis.color },
              ...extraFields.map(({ label, value }) => ({ label, value })),
              { label: "Condition", value: analysis.condition },
              { label: "Category", value: analysis.category },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            ))
          )}
        </CardContent>

        {analysis.defects && analysis.defects.length > 0 && (
          <CardContent className="border-t pt-4">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              Defects noted
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.defects.map((defect) => (
                <Badge key={defect} variant="destructive" className="text-xs font-normal">
                  {defect}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}

        {analysis.visibleText && analysis.visibleText.length > 0 && (
          <CardContent className="border-t pt-4">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3 w-3" />
              Text read from labels
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.visibleText.map((text) => (
                <Badge key={text} variant="secondary" className="text-xs font-normal">
                  {text}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}

        {analysis.compsKeywords && analysis.compsKeywords.length > 0 && (
          <CardContent className="border-t pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Comp search keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.compsKeywords.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs font-normal">
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}

        {Object.keys(analysis.itemSpecifics).length > 0 && (
          <CardContent className="border-t pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Item Specifics
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analysis.itemSpecifics).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}

        {editable && (
          <CardContent className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Tip: include close-ups of brand tags, tongues, and model labels. Wrong item? Edit
              the fields above.
            </p>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
