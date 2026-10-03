"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Award, Lightbulb, ChevronRight } from "lucide-react";

interface Question {
  question: string;
  category: string;
  focus: string;
  tips: string;
}

interface Evaluation {
  score: number;
  feedback: string;
  improvedAnswer: string;
}

interface InterviewCardProps {
  data: {
    questions: Question[];
  };
  activeContext: any;
}

export function InterviewCard({ data, activeContext }: InterviewCardProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluations, setEvaluations] = useState<Record<number, Evaluation>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<number, string>>({});

  const handleEvaluate = async (index: number, question: string) => {
    const answer = answers[index];
    if (!answer || !answer.trim()) return;

    setLoadingMap(prev => ({ ...prev, [index]: true }));
    setErrorMap(prev => ({ ...prev, [index]: "" }));

    try {
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          cvData: activeContext.data,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error);

      setEvaluations(prev => ({ ...prev, [index]: resData.data }));
    } catch (error: any) {
      setErrorMap(prev => ({ ...prev, [index]: error.message || "Failed to evaluate." }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <Card className="w-full max-w-3xl my-4 border-slate-200 shadow-sm">
      <CardHeader className="bg-indigo-50 border-b border-indigo-100 pb-4 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Mock Interview Practice
        </CardTitle>
        <p className="text-sm text-indigo-800/80 mt-1">
          Type your answers below to receive instant AI feedback and scoring based on your CV.
        </p>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-slate-100">
        {data.questions.map((q, i) => (
          <div key={i} className="p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md mb-2 inline-block">
                {q.category}
              </span>
              <h4 className="text-slate-900 font-medium text-base leading-snug">{q.question}</h4>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-slate-700">Tip:</span> {q.tips}
              </p>
            </div>

            {!evaluations[i] ? (
              <div className="space-y-3">
                <textarea
                  value={answers[i] || ""}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                  placeholder="Type your answer here using the STAR method..."
                  className="w-full h-32 rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                />
                
                {errorMap[i] && <p className="text-xs text-red-600">{errorMap[i]}</p>}
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleEvaluate(i, q.question)}
                    disabled={loadingMap[i] || !answers[i]?.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 h-9 text-xs"
                  >
                    {loadingMap[i] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                    Evaluate Answer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h5 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" /> Evaluation Result
                  </h5>
                  <div className="flex items-baseline gap-1 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    <span className={`text-lg font-bold ${evaluations[i].score >= 7 ? 'text-green-600' : 'text-amber-600'}`}>
                      {evaluations[i].score}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ 10</span>
                  </div>
                </div>
                
                <div>
                  <h6 className="text-xs font-bold uppercase text-slate-500 mb-1">Feedback</h6>
                  <p className="text-sm text-slate-700 leading-relaxed">{evaluations[i].feedback}</p>
                </div>
                
                <div className="bg-white p-3 rounded border border-indigo-100">
                  <h6 className="text-xs font-bold uppercase text-indigo-600 mb-1">Improved Example</h6>
                  <p className="text-sm text-indigo-900/80 italic leading-relaxed">"{evaluations[i].improvedAnswer}"</p>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setEvaluations(prev => { const next = {...prev}; delete next[i]; return next; });
                    }}
                    className="h-8 text-xs text-slate-500 hover:text-slate-900"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}