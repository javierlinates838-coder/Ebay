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
      : analysis.confidence >= 60
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  const updateField = <K extends keyof ProductAnalysis>(key: K, value: ProductAnalysis[K]) => {
    onChange?.({ ...analysis, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">AI Product Analysis</CardTitle>
            <div className="flex items-center gap-2">
              {source === "demo" && (
                <Badge variant="outline" className="text-xs">
                  Demo mode
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
              ? "High confidence identification"
              : analysis.confidence >= 60
                ? "Moderate confidence — verify details"
                : "Low confidence — edit the fields below"}
          </p>
          {warning && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{warning}</p>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
          {editable ? (
            <>
              <Field label="Product" value={analysis.product} onChange={(v) => updateField("product", v)} />
              <Field label="Brand" value={analysis.brand} onChange={(v) => updateField("brand", v)} />
              <Field label="Model" value={analysis.model} onChange={(v) => updateField("model", v)} />
              <Field label="Color" value={analysis.color} onChange={(v) => updateField("color", v)} />
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
            </>
          ) : (
            [
              { label: "Product", value: analysis.product },
              { label: "Brand", value: analysis.brand },
              { label: "Model", value: analysis.model },
              { label: "Color", value: analysis.color },
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
              Wrong item? Edit the fields above — market search uses product, brand, and model.
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
