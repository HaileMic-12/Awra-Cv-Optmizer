"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, Sparkles, ArrowRight } from "lucide-react";

interface Optimization {
  section: string;
  originalText: string;
  optimizedText: string;
  rationale: string;
}

interface CVOptimizerCardProps {
  data: {
    generalFeedback: string;
    optimizations: Optimization[];
  };
}

export function CVOptimizerCard({ data }: CVOptimizerCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="w-full max-w-3xl my-4 border-slate-200 shadow-sm">
      <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
        <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
          <Sparkles className="w-5 h-5 text-blue-600" />
          CV Optimization Suggestions
        </CardTitle>
        <p className="text-sm text-blue-800/80 mt-2">{data.generalFeedback}</p>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-slate-100">
        {data.optimizations.map((opt, i) => (
          <div key={i} className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Section: {opt.section}
              </span>
              <button
                onClick={() => handleCopy(opt.optimizedText, i)}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md"
              >
                {copiedIndex === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIndex === i ? "Copied!" : "Copy Optimized Text"}
              </button>
            </div>

            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 line-through decoration-red-300/50 decoration-2">
                {opt.originalText}
              </div>
              
              <div className="hidden md:flex justify-center text-slate-300">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900 font-medium shadow-sm">
                {opt.optimizedText}
              </div>
            </div>

            <div className="text-xs text-slate-500 italic flex items-start gap-1.5 pt-1">
              <span className="font-semibold text-slate-700 not-italic">Why:</span>
              {opt.rationale}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}