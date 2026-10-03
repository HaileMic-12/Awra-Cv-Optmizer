"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoverLetterCardProps {
  data: {
    subject: string;
    body: string;
  };
}

export function CoverLetterCard({ data }: CoverLetterCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    const fullText = `Subject: ${data.subject}\n\n${data.body}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-3xl my-4 border-slate-200 shadow-sm bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
          <FileText className="w-5 h-5 text-blue-600" />
          Generated Cover Letter
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {isCopied ? "Copied!" : "Copy Letter"}
        </Button>
      </CardHeader>

      <CardContent className="p-6">
        <div className="mb-6 bg-slate-50 p-3 rounded-md border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1 text-xs">Subject</p>
          <p className="text-slate-900 font-medium">{data.subject}</p>
        </div>
        
        <div className="prose prose-sm md:prose-base prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed font-serif">
          {data.body}
        </div>
      </CardContent>
    </Card>
  );
}