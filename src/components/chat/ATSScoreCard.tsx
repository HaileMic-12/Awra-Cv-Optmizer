"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface ATSScoreCardProps {
  data: {
    overallScore: number;
    keywordMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    matchedSkills: string[];
    missingSkills: string[];
    recommendations: string[];
  };
}

export function ATSScoreCard({ data }: ATSScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <Card className="w-full max-w-2xl my-4 border-slate-200 shadow-sm overflow-hidden">
      <div className={`p-4 flex items-center justify-between ${getScoreBg(data.overallScore)}`}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-700 opacity-80">Estimated ATS Compatibility</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-4xl font-bold ${getScoreColor(data.overallScore)}`}>{data.overallScore}</span>
            <span className="text-lg font-medium text-slate-600">/ 100</span>
          </div>
        </div>
        <TrendingUp className={`w-10 h-10 ${getScoreColor(data.overallScore)} opacity-50`} />
      </div>

      <CardContent className="p-5 space-y-6">
        <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-5">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">{data.keywordMatch}%</p>
            <p className="text-xs text-slate-500 font-medium uppercase mt-1">Keywords</p>
          </div>
          <div className="text-center border-l border-slate-100">
            <p className="text-2xl font-bold text-slate-800">{data.skillsMatch}%</p>
            <p className="text-xs text-slate-500 font-medium uppercase mt-1">Skills</p>
          </div>
          <div className="text-center border-l border-slate-100">
            <p className="text-2xl font-bold text-slate-800">{data.experienceMatch}%</p>
            <p className="text-xs text-slate-500 font-medium uppercase mt-1">Experience</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm text-slate-800 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Matched Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.matchedSkills.map(skill => (
                <span key={skill} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md border border-slate-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm text-slate-800 mb-3">
              <XCircle className="w-4 h-4 text-red-500" /> Missing Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.missingSkills.length > 0 ? data.missingSkills.map(skill => (
                <span key={skill} className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-md border border-red-100">
                  {skill}
                </span>
              )) : <span className="text-sm text-slate-500">None detected!</span>}
            </div>
          </div>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
          <h4 className="flex items-center gap-2 font-semibold text-sm text-blue-900 mb-2">
            <AlertTriangle className="w-4 h-4 text-blue-600" /> Recommendations
          </h4>
          <ul className="space-y-2 text-sm text-blue-800/80 list-disc list-inside">
            {data.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}