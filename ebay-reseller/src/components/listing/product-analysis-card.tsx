"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProductAnalysis } from "@/types";

interface ProductAnalysisCardProps {
  analysis: ProductAnalysis;
}

export function ProductAnalysisCard({ analysis }: ProductAnalysisCardProps) {
  const confidenceColor =
    analysis.confidence >= 80
      ? "text-green-600 dark:text-green-400"
      : analysis.confidence >= 60
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">AI Product Analysis</CardTitle>
            <Badge variant="secondary" className="font-mono">
              {analysis.confidence}% confidence
            </Badge>
          </div>
          <Progress value={analysis.confidence} className="h-2" />
          <p className={`text-xs font-medium ${confidenceColor}`}>
            {analysis.confidence >= 80
              ? "High confidence identification"
              : analysis.confidence >= 60
                ? "Moderate confidence — verify details"
                : "Low confidence — manual review recommended"}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
          {[
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
          ))}
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
      </Card>
    </motion.div>
  );
}
