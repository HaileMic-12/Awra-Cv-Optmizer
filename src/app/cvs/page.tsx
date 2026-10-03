"use client";

import { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Update this path to match your setup

export default function CVsPage() {
  const { user } = useAuth();
  const [cvHistory, setCvHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOriginal, setViewingOriginal] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCVs() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "user_cvs"),
          where("userId", "==", user.uid),
          // orderBy("createdAt", "desc") // Uncomment if you have created a Firestore index for this
        );
        const querySnapshot = await getDocs(q);
        const cvs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort manually if you don't have a Firestore index set up yet
        cvs.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setCvHistory(cvs);
      } catch (error) {
        console.error("Failed to fetch CVs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCVs();
  }, [user]);

  const handleDownloadOptimized = async (cv: any) => {
    const html2pdf = (await import("html2pdf.js")).default;
    
    // Create a temporary hidden div to format the PDF
    const element = document.createElement("div");
    element.innerHTML = `<div style="white-space: pre-wrap; font-family: serif; padding: 20px; font-size: 14px; color: #1f2937;">${cv.optimizedText}</div>`;
    
    const opt = {
      margin: 0.5,
      filename: `Optimized_${cv.fileName}`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <SidebarLayout>
      <div className="p-4 md:p-8 font-sans max-w-5xl mx-auto pb-32">
        <h1 className="text-3xl font-bold text-gray-900">My CVs</h1>
        <p className="text-gray-500 mt-2 mb-8">Manage your original uploads and optimized resumes.</p>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : cvHistory.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center bg-white">
            <span className="text-4xl mb-3">📄</span>
            <h3 className="font-semibold text-gray-700">No CVs saved yet</h3>
            <p className="text-sm text-gray-400 mt-1">Go to the AI Analyzer to generate your first optimized CV.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {cvHistory.map((cv) => (
              <div key={cv.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">
                
                {/* Info Section */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{cv.fileName}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-gray-500">
                      {cv.createdAt ? new Date(cv.createdAt.toMillis()).toLocaleDateString() : "Just now"}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className={`font-medium ${cv.atsScore >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {cv.atsScore}% ATS Score
                    </span>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setViewingOriginal(viewingOriginal === cv.id ? null : cv.id)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                  >
                    {viewingOriginal === cv.id ? "Hide Original" : "View Original"}
                  </button>
                  <button 
                    onClick={() => handleDownloadOptimized(cv)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
                  >
                    ⬇ Download Optimized
                  </button>
                </div>

                {/* Expanding Original View */}
                {viewingOriginal === cv.id && (
                  <div className="w-full mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 whitespace-pre-wrap h-64 overflow-y-auto">
                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-2">Original Extracted Text</h4>
                    {cv.originalText}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}