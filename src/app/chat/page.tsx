"use client";

import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Link } from "@react-pdf/renderer";

// 1. Advanced PDF Styles
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#111827", lineHeight: 1.5 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 6, borderBottom: "1pt solid #E5E7EB", paddingBottom: 2, textTransform: "uppercase" },
  paragraph: { marginBottom: 4 },
  bulletRow: { flexDirection: "row", marginBottom: 3, paddingLeft: 8 },
  bulletIcon: { width: 12, fontFamily: "Helvetica-Bold" },
  bulletText: { flex: 1 },
  link: { color: "#2563EB", textDecoration: "none" },
  headerName: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 },
});

// 2. Helper function to make links clickable
const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|io|app|dev|me|co)(?:\/[^\s]*)?)/gi;
  return text.split(urlRegex).map((part, index) => {
    if (part && part.match(urlRegex)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return <Link key={index} src={href} style={pdfStyles.link}>{part}</Link>;
    }
    return <Text key={index}>{part}</Text>;
  });
};

// 3. Helper function for CVs
const renderCVContent = (text: string) => {
  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <View key={index} style={{ height: 6 }} />;
    if (index === 0 && trimmed.length < 40) return <Text key={index} style={pdfStyles.headerName}>{trimmed}</Text>;
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 40 && !trimmed.startsWith('•')) {
      return <Text key={index} style={pdfStyles.sectionTitle}>{trimmed}</Text>;
    }
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const cleanText = trimmed.substring(1).trim();
      return (
        <View key={index} style={pdfStyles.bulletRow}>
          <Text style={pdfStyles.bulletIcon}>•</Text>
          <Text style={pdfStyles.bulletText}>{renderTextWithLinks(cleanText)}</Text>
        </View>
      );
    }
    return <Text key={index} style={pdfStyles.paragraph}>{renderTextWithLinks(trimmed)}</Text>;
  });
};

// 4. Helper function for Cover Letters
const renderCoverLetterContent = (text: string) => {
  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <View key={index} style={{ height: 12 }} />; // Larger spacing for cover letter paragraphs
    return <Text key={index} style={pdfStyles.paragraph}>{renderTextWithLinks(trimmed)}</Text>;
  });
};

const ATSResumePDF = ({ cvText }: { cvText: string }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View>{renderCVContent(cvText)}</View>
    </Page>
  </Document>
);

const ATSCoverLetterPDF = ({ clText }: { clText: string }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View>{renderCoverLetterContent(clText)}</View>
    </Page>
  </Document>
);

export default function ChatPage() {
  const { user } = useAuth();
  
  const [isClient, setIsClient] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  
  // States
  const [cvText, setCvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavedToTracker, setIsSavedToTracker] = useState(false);
  
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("score"); 

  useEffect(() => {
    setIsClient(true);
    const savedResults = localStorage.getItem("awra_results");
    if (savedResults) setResults(JSON.parse(savedResults));
    
    setCvText(localStorage.getItem("awra_cvText") || "");
    setFileName(localStorage.getItem("awra_fileName") || "");
    setCompanyName(localStorage.getItem("awra_companyName") || "");
    setJobTitle(localStorage.getItem("awra_jobTitle") || "");
    setJobDescription(localStorage.getItem("awra_jobDescription") || "");
    
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return; 
    
    localStorage.setItem("awra_cvText", cvText);
    localStorage.setItem("awra_fileName", fileName);
    localStorage.setItem("awra_companyName", companyName);
    localStorage.setItem("awra_jobTitle", jobTitle);
    localStorage.setItem("awra_jobDescription", jobDescription);
    
    if (results) {
      localStorage.setItem("awra_results", JSON.stringify(results));
    } else {
      localStorage.removeItem("awra_results");
    }
  }, [cvText, fileName, companyName, jobTitle, jobDescription, results, isDataLoaded]);

  const handleClearWorkspace = () => {
    if(confirm("Are you sure you want to clear your current workspace? This won't delete saved files in your Dashboard.")) {
      setCvText("");
      setFileName("");
      setCompanyName("");
      setJobTitle("");
      setJobDescription("");
      setResults(null);
      setIsSavedToTracker(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsExtracting(true);
    setCvText(""); 

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Failed to extract PDF");

      const data = await response.json();
      setCvText(data.text);
    } catch (error) {
      console.error(error);
      alert("Could not read the PDF file. Please ensure it is a valid text-based PDF.");
      setFileName("");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!cvText) return alert("Wait! The CV text is empty. The PDF extractor hasn't found any words yet.");
    if (!jobDescription) return alert("Please paste a job description.");

    setIsAnalyzing(true);
    setResults(null);
    setActiveTab("score"); 
    setIsSavedToTracker(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData: cvText, jobDescription }),
      });

      const data = await response.json();
      setResults(data);

      if (user) {
        try {
          await addDoc(collection(db, "user_cvs"), {
            userId: user.uid,
            fileName: fileName || "Untitled CV",
            originalText: cvText || "",
            optimizedText: data.optimizedCV || "Optimization not available.",
            atsScore: data.atsScore || 0,
            createdAt: serverTimestamp(),
          });
        } catch (firebaseError: any) {
          console.error("FIREBASE ERROR:", firebaseError);
        }
      }
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Something went wrong during analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToTracker = async () => {
    if (!user) return;
    if (!companyName || !jobTitle) return alert("Please enter the Company Name and Job Title on the left side first!");
    
    try {
      await addDoc(collection(db, "user_jobs"), {
        userId: user.uid,
        companyName,
        jobTitle,
        status: "Saved",
        createdAt: serverTimestamp(),
      });
      setIsSavedToTracker(true);
    } catch (error) {
      console.error("Failed to save job", error);
      alert("Failed to save to tracker.");
    }
  };

  if (!isDataLoaded) return <SidebarLayout><div className="min-h-screen bg-gray-50" /></SidebarLayout>;

  return (
    <SidebarLayout>
      <div className="w-full bg-gray-50 p-4 md:p-8 pb-32 font-sans text-gray-900">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <header className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="text-left space-y-1">
             <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
  Awra  <span className="text-blue-600">CV Optimizer</span>
</h1>
              <p className="text-gray-500 max-w-xl text-sm md:text-base">
                Upload your resume and the target job description.
              </p>
            </div>
            
            {(cvText || jobDescription || results) && (
              <button 
                onClick={handleClearWorkspace}
                className="text-sm font-bold text-gray-500 hover:text-red-600 transition-colors bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm"
              >
                🗑️ Start Fresh
              </button>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">1. Upload your CV (PDF)</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-gray-50">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="text-blue-600 font-medium text-sm">
                      {isExtracting ? "Extracting..." : "Click or drag PDF"}
                    </div>
                    <p className="text-xs text-gray-400">
                      {fileName ? fileName : "Max file size: 5MB"}
                    </p>
                  </div>
                </div>
                {cvText && !isExtracting && (
                  <div className="text-xs text-green-600 font-medium">
                    ✅ CV extracted ({cvText.split(" ").length} words)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Company</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Google" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Job Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Frontend Dev" 
                    value={jobTitle} 
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">2. Target Job Description</label>
                <textarea
                  rows={4}
                  placeholder="Paste the job requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-4 border bg-gray-50"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`w-full py-3.5 mt-2 rounded-xl text-white font-bold transition-all shadow-md ${
                  isAnalyzing 
                    ? "bg-gray-400 cursor-wait"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
                }`}
              >
                {isAnalyzing ? "Analyzing Match..." : "Analyze & Optimize"}
              </button>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
              {!results && !isAnalyzing && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12">
                  <div className="text-gray-400 mb-2 text-4xl">📊</div>
                  <h3 className="text-gray-600 font-medium">No results yet</h3>
                  <p className="text-gray-400 text-sm mt-1">Upload a CV and Job Description to see your results.</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 p-12">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Running AI Analysis...</p>
                </div>
              )}

              {results && !isAnalyzing && (
                <div className="flex flex-col h-full">
                  
                  <div className="flex border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex-wrap items-center pr-2">
                    <button onClick={() => setActiveTab("score")} className={`py-4 px-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "score" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}>ATS Score</button>
                    <button onClick={() => setActiveTab("coverLetter")} className={`py-4 px-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "coverLetter" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Cover Letter</button>
                    <button onClick={() => setActiveTab("optimizations")} className={`py-4 px-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "optimizations" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}>CV Tweaks</button>
                    <button onClick={() => setActiveTab("optimizedCV")} className={`py-4 px-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "optimizedCV" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Optimized CV</button>

                    <div className="ml-auto flex items-center">
                      <button 
                        onClick={handleSaveToTracker}
                        disabled={isSavedToTracker}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                          isSavedToTracker ? "bg-green-100 text-green-700" : "bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                        }`}
                      >
                        {isSavedToTracker ? "✅ Saved to Tracker" : "💾 Save to Tracker"}
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {activeTab === "score" && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-6">
                          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 border-8 border-gray-100">
                            <span className={`text-2xl font-bold ${results.atsScore >= 80 ? 'text-green-600' : results.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {results.atsScore}%
                            </span>
                          </div>
                          <div><h2 className="text-xl font-bold text-gray-900">Match Analysis</h2></div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 text-sm leading-relaxed whitespace-pre-wrap">
                          {results.atsFeedback}
                        </div>
                      </div>
                    )}

                    {activeTab === "coverLetter" && (
                      <div className="space-y-4 flex flex-col">
                        <div className="flex justify-between items-center shrink-0">
                          <h2 className="font-bold text-gray-900">Tailored Cover Letter</h2>
                          <div className="flex gap-2">
                            <button onClick={() => navigator.clipboard.writeText(results.coverLetter)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">
                              Copy Text
                            </button>
                            {isClient && (
                              <PDFDownloadLink
                                document={<ATSCoverLetterPDF clText={results.coverLetter} />}
                                fileName={`${companyName ? companyName.replace(/\s+/g, '_') : 'Company'}_Cover_Letter.pdf`}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
                              >
                                {({ loading }) => (loading ? "Generating..." : "⬇ Download PDF")}
                              </PDFDownloadLink>
                            )}
                          </div>
                        </div>
                        <textarea readOnly value={results.coverLetter} rows={12} className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none" />
                      </div>
                    )}

                    {activeTab === "optimizations" && (
                      <div className="space-y-4">
                        <h2 className="font-bold text-gray-900">Actionable CV Improvements</h2>
                        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 h-[320px] overflow-y-auto">
                          <ul className="space-y-3 text-sm text-gray-700 list-disc pl-4 leading-relaxed">
                            {results.cvOptimizations.split('\n').map((item: string, i: number) => (
                              <li key={i}>{item.replace('• ', '')}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTab === "optimizedCV" && (
                      <div className="space-y-4 flex flex-col">
                        <div className="flex justify-between items-center shrink-0">
                          <h2 className="font-bold text-gray-900">Your Ready-to-Use CV</h2>
                          {isClient && (
                            <PDFDownloadLink
                              document={<ATSResumePDF cvText={results.optimizedCV} />}
                              fileName={`${fileName ? fileName.replace('.pdf', '') : 'Awra'}_Optimized.pdf`}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
                            >
                              {({ loading }) => (loading ? "Generating PDF..." : "⬇ Download ATS-Friendly PDF")}
                            </PDFDownloadLink>
                          )}
                        </div>
                        <div className="p-6 rounded-xl border border-gray-200 bg-white h-[320px] overflow-y-auto">
                          <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                            {results.optimizedCV}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}