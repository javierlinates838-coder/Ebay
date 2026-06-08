"use client";

import { Camera, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PHOTO_SUCCESS_TIPS } from "@/lib/ai/health-check";

export function AnalysisPhotoTips() {
  return (
    <Card className="border-dashed border-[#0064D2]/30 bg-[#0064D2]/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4 text-[#0064D2]" />
          For best results (like Google Lens)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-2 sm:grid-cols-2">
          {PHOTO_SUCCESS_TIPS.map(({ title, detail }, i) => (
            <li key={title} className="flex gap-2 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0064D2]/15 text-[10px] font-bold text-[#0064D2]">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
          AI searches Google for matching products — clear brand tags make the biggest difference.
        </p>
      </CardContent>
    </Card>
  );
}
