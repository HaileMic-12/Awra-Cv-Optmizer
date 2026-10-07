"use client";

import { useState, useEffect, useRef } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Link } from "@react-pdf/renderer";

// 1. Advanced PDF Styles (Royal Blue Theme)
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1F2937", lineHeight: 1.4 },
  headerName: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#1E3A8A", marginBottom: 2, textAlign: "center" },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1E3A8A", marginTop: 12, marginBottom: 4, borderBottom: "1.5pt solid #2563EB", paddingBottom: 2, textTransform: "uppercase" },
  paragraph: { marginBottom: 3 },
  bulletRow: { flexDirection: "row", marginBottom: 3, paddingLeft: 6 },
  bulletIcon: { width: 10, color: "#2563EB", fontFamily: "Helvetica-Bold" },
  bulletText: { flex: 1 },
  link: { color: "#2563EB", textDecoration: "none" },
});

// 2. Helper function to make links clickable in PDFs
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

// 3. Helper function for CV rendering (Crash-proof)
const renderCVContent = (text: string) => {
  if (!text) return null;
  
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

// 4. Helper function for Cover Letter rendering (Crash-proof)
const renderCoverLetterContent = (text: string) => {
  if (!text) return null;
  
  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <View key={index} style={{ height: 12 }} />;
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

// Payment Plans Configuration
const PLANS = {
  starter: { 
    name: "Starter Bundle", 
    price: "49 ETB", 
    credits: 10, 
    popular: false,
    capabilities: [
      "2 Full Application Packages (Optimized CV + Cover Letter)",
      "or up to 5 Job-Specific CV Tailorings",
      "or up to 10 Custom Cover Letters",
    ]
  },
  standard: { 
    name: "Standard Bundle", 
    price: "99 ETB", 
    credits: 25, 
    popular: true,
    capabilities: [
      "6 Full Application Packages (Optimized CV + Cover Letter)",
      "or up to 12 Job-Specific CV Tailorings",
      "or up to 25 Custom Cover Letters",
      "Best for active weekly job applications",
    ]
  },
  pro: { 
    name: "Pro Bundle", 
    price: "199 ETB", 
    credits: 60, 
    popular: false,
    capabilities: [
      "15 Full Application Packages (Optimized CV + Cover Letter)",
      "or up to 30 Job-Specific CV Tailorings",
      "or up to 60 Custom Cover Letters",
      "Maximum value for intense job hunting across many roles",
    ]
  },
};

const SERVICE_COSTS = {
  coverLetter: 1,
  cvTweaks: 1,
  optimizedCV: 2,
} as const;

type PaidService = keyof typeof SERVICE_COSTS;
const ALL_GENERATION_SERVICES: PaidService[] = ["coverLetter", "cvTweaks", "optimizedCV"];

const SERVICE_LABELS: Record<PaidService, string> = {
  coverLetter: "Cover Letter",
  cvTweaks: "CV Tweaks",
  optimizedCV: "Optimized CV",
};

const SERVICE_DESCRIPTIONS: Record<PaidService, string> = {
  coverLetter: "A tailored cover letter written for this specific job.",
  cvTweaks: "Specific bullet-point improvements based on the job requirements.",
  optimizedCV: "A complete ATS-formatted CV rewrite tailored to the job.",
};

export default function ChatPage() {
  const { user } = useAuth();
  
  const [isClient, setIsClient] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [credits, setCredits] = useState<number | null>(null);

  // --- EMOJI-FREE TOAST NOTIFICATION SYSTEM ---
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "warning" } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: "error" | "success" | "warning" = "error") => {
    setToast({ message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  // -------------------------------------------
  
  // Input Workspace States
  const [cvText, setCvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  // Status States
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavedToTracker, setIsSavedToTracker] = useState(false);
  
  // Results & Tabs
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("score"); 

  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>("standard");
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [selectedServices, setSelectedServices] = useState<PaidService[]>(ALL_GENERATION_SERVICES);
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);

  // Initialize and load saved local state
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

  // Sync user credits live from Firestore
  useEffect(() => {
    if (!user) {
      setCredits(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCredits(typeof data.credits === "number" ? data.credits : 0);
      }
    });

    return () => unsub();
  }, [user]);

  // Persist workspace changes
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
    setCvText("");
    setFileName("");
    setCompanyName("");
    setJobTitle("");
    setJobDescription("");
    setResults(null);
    setIsSavedToTracker(false);
    showToast("Workspace cleared. Ready for your next application.", "success");
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
      showToast("We could not read that PDF. Please ensure it contains selectable text.", "error");
      setFileName("");
    } finally {
      setIsExtracting(false);
    }
  };

  const isUsingPaidCredits = typeof credits === "number" && credits > 0;

  const calculateServiceCost = (services: PaidService[]) =>
    services.reduce((total, service) => total + SERVICE_COSTS[service], 0);

  const toggleService = (service: PaidService) => {
    setSelectedServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  };

  const selectFullPackage = () => {
    setSelectedServices(ALL_GENERATION_SERVICES);
  };

  const handleAnalyze = async () => {
    if (!cvText) return showToast("The CV text is empty. Please upload a readable PDF or paste content first.", "warning");
    if (!jobDescription) return showToast("Please enter the target job description so we can map your alignment.", "warning");

    setIsAnalyzing(true);
    setResults(null);
    setActiveTab("score");
    setIsSavedToTracker(false);
    setShowServiceSelector(false);

    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData: cvText, jobDescription }),
      });

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok || analyzeData.error) {
        showToast(analyzeData.error || "Something went wrong analyzing this CV. Please try again.", "error");
        setIsAnalyzing(false);
        return;
      }

      const servicesForFreeUser = ALL_GENERATION_SERVICES;

      setResults({
        ...analyzeData,
        isGenerating: false,
        requiresUpgrade: false,
        requestedServices: isUsingPaidCredits ? [] : servicesForFreeUser,
        generationSkipped: isUsingPaidCredits,
      });
      setIsAnalyzing(false);

      if (isUsingPaidCredits) {
        setSelectedServices(ALL_GENERATION_SERVICES);
        setShowServiceSelector(true);
        return;
      }

      await generateSelectedAssets(servicesForFreeUser, analyzeData);
    } catch (error) {
      console.error("Analysis failed", error);
      showToast("An error occurred during analysis. Please try again.", "error");
      setIsAnalyzing(false);
    }
  };

  const generateSelectedAssets = async (
    services: PaidService[],
    analyzeData = results
  ) => {
    if (!services.length) {
      return showToast("Please select at least one service to continue.", "warning");
    }

    if (!cvText || !jobDescription || !analyzeData) return;

    const requestedCost = calculateServiceCost(services);

    if (isUsingPaidCredits && typeof credits === "number" && credits < requestedCost) {
      setResults((prev: any) => ({
        ...prev,
        isGenerating: false,
        requiresUpgrade: true,
        requestedServices: services,
        upgradeMessage: `You need ${requestedCost} credits for this selection, but your balance is ${credits}. Please top up.`,
      }));
      setShowServiceSelector(false);
      return;
    }

    setShowServiceSelector(false);
    setIsGeneratingAssets(true);
    setResults((prev: any) => ({
      ...prev,
      isGenerating: true,
      requiresUpgrade: false,
      requestedServices: services,
      generationSkipped: false,
    }));

    try {
      const generateRes = await fetch("/api/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvData: cvText,
          jobDescription,
          missingSkills: analyzeData.skills?.missingRequired || [],
          userId: user?.uid || null,
          services,
          requestedServices: services,
        }),
      });

      const generateData = await generateRes.json();

      if (generateRes.status === 402) {
        setResults((prev: any) => ({
          ...prev,
          isGenerating: false,
          requiresUpgrade: true,
          requestedServices: services,
          upgradeMessage: generateData.error || "You do not have enough credits for the selected services.",
        }));
        return;
      }

      if (!generateRes.ok || generateData.error) {
        const errorMessage = generateData.error || "The service is temporarily overloaded (Quota Exceeded). Please wait a moment and try again.";
        showToast(errorMessage, "error");
        
        setResults((prev: any) => ({
          ...prev,
          isGenerating: false,
          requiresUpgrade: false, 
          requestedServices: services,
          coverLetter: prev?.coverLetter || `Error: ${errorMessage}`,
          cvOptimizations: prev?.cvOptimizations || `Error: ${errorMessage}`,
          optimizedCV: prev?.optimizedCV || `Error: ${errorMessage}`,
        }));
        return;
      }

      setResults((prev: any) => ({
        ...prev,
        ...generateData,
        isGenerating: false,
        requiresUpgrade: false,
        requestedServices: services,
        generationSkipped: false,
      }));

      if (typeof generateData.remainingCredits === "number") {
        setCredits(generateData.remainingCredits);
      }

      if (user && services.includes("optimizedCV") && generateData.optimizedCV) {
        try {
          await addDoc(collection(db, "user_cvs"), {
            userId: user.uid,
            fileName: fileName || "Untitled CV",
            originalText: cvText || "",
            optimizedText: generateData.optimizedCV,
            atsScore: analyzeData.atsScore || 0,
            createdAt: serverTimestamp(),
          });
        } catch (firebaseError: any) {
          console.error("FIREBASE ERROR:", firebaseError);
        }
      }
    } catch (error) {
      console.error("Asset generation failed", error);
      const errorMessage = "A network error or timeout occurred. Please try generating again.";
      showToast(errorMessage, "error");
      setResults((prev: any) => ({
        ...prev,
        isGenerating: false,
        requiresUpgrade: false,
        requestedServices: services,
        coverLetter: prev?.coverLetter || `Error: ${errorMessage}`,
        cvOptimizations: prev?.cvOptimizations || `Error: ${errorMessage}`,
        optimizedCV: prev?.optimizedCV || `Error: ${errorMessage}`,
      }));
    } finally {
      setIsGeneratingAssets(false);
    }
  };

  const confirmServiceSelection = async () => {
    if (!selectedServices.length) {
      return showToast("Please select at least one service before generating.", "warning");
    }

    if (isUsingPaidCredits && typeof credits === "number") {
      const cost = calculateServiceCost(selectedServices);
      if (credits < cost) {
        return showToast(`You need ${cost} credits for this, but your balance is ${credits}. Please top up.`, "error");
      }
    }

    await generateSelectedAssets(selectedServices, results);
  };

  const handleSaveToTracker = async () => {
    if (!user) return showToast("You must be signed in to save jobs to your tracker.", "warning");
    if (!companyName || !jobTitle) return showToast("Please fill in the company name and job title first.", "warning");
    
    try {
      await addDoc(collection(db, "user_jobs"), {
        userId: user.uid,
        companyName,
        jobTitle,
        status: "Saved",
        createdAt: serverTimestamp(),
      });
      setIsSavedToTracker(true);
      showToast("Job successfully saved to your tracker.", "success");
    } catch (error) {
      console.error("Failed to save job", error);
      showToast("Failed to save the job application. Please try again.", "error");
    }
  };

  const openPaymentModal = (plan: keyof typeof PLANS) => {
    if (!user) return showToast("Please log in to purchase credits.", "warning");
    setSelectedPlan(plan);
    setPaymentSuccess(false);
    setPaymentFile(null);
    setIsPaymentModalOpen(true);
  };

  const submitPaymentReceipt = async () => {
    if (!paymentFile) return showToast("Please attach your payment screenshot.", "warning");
    if (!user) return showToast("You must be logged in to submit a payment.", "error");
    setIsSubmittingPayment(true);

    try {
      const formData = new FormData();
      formData.append("file", paymentFile);
      formData.append("upload_preset", "awra_payments");

      const uploadRes = await fetch("https://api.cloudinary.com/v1_1/dvv6oiddv/image/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error("Image upload failed");

      await addDoc(collection(db, "payment_requests"), {
        userId: user.uid,
        userEmail: user.email,
        plan: PLANS[selectedPlan].name,
        price: PLANS[selectedPlan].price,
        creditsToAdd: PLANS[selectedPlan].credits,
        receiptUrl: uploadData.secure_url,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setPaymentSuccess(true);
    } catch (error) {
      console.error(error);
      showToast("There was an error uploading your receipt. Please try again.", "error");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000); 
  };

  if (!isDataLoaded) return <SidebarLayout><div className="min-h-screen bg-gray-50" /></SidebarLayout>;

  return (
    <SidebarLayout>
      {/* GLOBAL TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`px-5 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-3 ${
            toast.type === "error" ? "bg-red-50 text-red-700 border-red-200" :
            toast.type === "success" ? "bg-green-50 text-green-700 border-green-200" :
            "bg-yellow-50 text-yellow-700 border-yellow-200"
          }`}>
            <span className="shrink-0">
              {toast.type === "error" && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {toast.type === "success" && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === "warning" && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </span>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600 font-normal">
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="w-full bg-gray-50 p-4 md:p-8 pb-32 font-sans text-gray-900">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <header className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="text-left space-y-1">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                Awra <span className="text-blue-600">CV Optimizer</span>
              </h1>
              <p className="text-gray-500 max-w-xl text-sm md:text-base">
Drop your resume and the job posting below to see how well you match, then build a custom cover letter and optimized CV in seconds.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {user && credits !== null && (
                <button 
                  onClick={() => openPaymentModal("standard")} 
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>{credits} Credits (Top Up)</span>
                </button>
              )}

              {(cvText || jobDescription || results) && (
                <button 
                  onClick={handleClearWorkspace}
                  className="text-sm font-bold text-gray-500 hover:text-red-600 transition-colors bg-white px-4 py-2 border border-gray-200 rounded-xl shadow-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Inputs */}
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
                      {isExtracting ? "Extracting text..." : "Click or drag PDF"}
                    </div>
                    <p className="text-xs text-gray-400">
                      {fileName ? fileName : "Maximum file size: 5MB"}
                    </p>
                  </div>
                </div>
                {cvText && !isExtracting && (
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    CV extracted successfully ({cvText.split(/\s+/).filter(Boolean).length} words)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Company</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Commercial Bank of Ethiopia" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Job Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Full-Stack Developer" 
                    value={jobTitle} 
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">2. Target Job Description</label>
                <textarea
                  rows={5}
                  placeholder="Paste requirements, qualifications, and role responsibilities here..."
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
                {isAnalyzing ? "Analyzing Alignment..." : (isUsingPaidCredits ? "Analyze & Choose Services" : "Analyze & Get Free Package")}
              </button>
            </div>

            {/* RIGHT COLUMN: Results Dashboard */}
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[460px]">
              {!results && !isAnalyzing && (
                <div className="h-full min-h-[460px] flex flex-col items-center justify-center text-center p-12">
                  <svg className="w-12 h-12 text-gray-300 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-gray-700 font-semibold">No active analysis</h3>
                  <p className="text-gray-400 text-sm mt-1 max-w-sm">
                  Your analysis will appear here once you upload your resume and add the job requirements.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="h-full min-h-[460px] flex flex-col items-center justify-center space-y-4 p-12">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-600 font-medium animate-pulse">Running ATS Hybrid Evaluation...</p>
                </div>
              )}

              {results && !isAnalyzing && (
                <div className="flex flex-col h-full">
                  
                  {/* Top Navigation Tabs */}
                  <div className="flex border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex-wrap items-center pr-4">
                    <button 
                      onClick={() => setActiveTab("score")} 
                      className={`py-4 px-4 text-sm font-semibold transition-colors border-b-2 ${
                        activeTab === "score" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      ATS Score
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab("coverLetter")} 
                      className={`py-4 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === "coverLetter" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Cover Letter 
                      {results.isGenerating && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab("optimizations")} 
                      className={`py-4 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === "optimizations" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      CV Tweaks 
                      {results.isGenerating && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab("optimizedCV")} 
                      className={`py-4 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === "optimizedCV" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Optimized CV 
                      {results.isGenerating && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                    </button>

                    <div className="ml-auto flex items-center py-2">
                      <button 
                        onClick={handleSaveToTracker}
                        disabled={isSavedToTracker}
                        className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                          isSavedToTracker ? "bg-green-100 text-green-700" : "bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                        }`}
                      >
                        {isSavedToTracker ? "Saved to Tracker" : "Save to Tracker"}
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* TAB 1: ATS SCORE */}
                    {activeTab === "score" && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-6">
                          <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gray-50 border-8 border-gray-100 shadow-inner">
                            <span className={`text-3xl font-extrabold ${results.atsScore >= 80 ? 'text-green-600' : results.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {results.atsScore}%
                            </span>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">Match Alignment</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                              Independent verification: 50% Deterministic Rules + 50% Verified Semantic Evidence
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/50">
                            <h3 className="font-bold text-blue-900 mb-3 flex justify-between text-sm">
                              <span>Deterministic Keyword Alignment</span>
                              <span>{results.breakdown?.deterministic?.total ?? 0} / 50</span>
                            </h3>
                            <ul className="text-xs text-blue-800 space-y-2">
                              <li className="flex justify-between"><span>Required Skills:</span> <strong>{results.breakdown?.deterministic?.requiredSkills ?? 0} / 20</strong></li>
                              <li className="flex justify-between"><span>Preferred Skills:</span> <strong>{results.breakdown?.deterministic?.preferredSkills ?? 0} / 5</strong></li>
                              <li className="flex justify-between"><span>Keyword Coverage:</span> <strong>{results.breakdown?.deterministic?.keywordCoverage ?? 0} / 5</strong></li>
                              <li className="flex justify-between"><span>Experience Match:</span> <strong>{results.breakdown?.deterministic?.experience ?? 0} / 10</strong></li>
                              <li className="flex justify-between"><span>Structure & Completeness:</span> <strong>{results.breakdown?.deterministic?.completeness ?? 0} / 5</strong></li>
                            </ul>
                          </div>

                          <div className="p-5 rounded-xl border border-purple-100 bg-purple-50/50">
                            <h3 className="font-bold text-purple-900 mb-3 flex justify-between text-sm">
                              <span>Validated Semantic Relevance</span>
                              <span>{results.breakdown?.semantic?.total ?? 0} / 50</span>
                            </h3>
                            <ul className="text-xs text-purple-800 space-y-2">
                              <li className="flex justify-between"><span>Contextual Skills:</span> <strong>{results.breakdown?.semantic?.skills ?? 0} / 20</strong></li>
                              <li className="flex justify-between"><span>Responsibility Scope:</span> <strong>{results.breakdown?.semantic?.responsibilities ?? 0} / 15</strong></li>
                              <li className="flex justify-between"><span>Title & Progression:</span> <strong>{results.breakdown?.semantic?.title ?? 0} / 5</strong></li>
                              <li className="flex justify-between"><span>Evidence Quality:</span> <strong>{results.breakdown?.semantic?.evidenceQuality ?? 0} / 5</strong></li>
                              <li className="flex justify-between"><span>Education Relevance:</span> <strong>{results.breakdown?.semantic?.education ?? 0} / 5</strong></li>
                            </ul>
                          </div>
                        </div>

                        {results.recommendations && results.recommendations.length > 0 && (
                          <div className="pt-2">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm">
                              Recommendations for Defensible Alignment
                            </h3>
                            <div className="space-y-2.5">
                              {results.recommendations.map((rec: string, idx: number) => (
                                <div key={idx} className="flex gap-2.5 text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <p className="leading-relaxed">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: COVER LETTER */}
                    {activeTab === "coverLetter" && (
                      <div className="space-y-4 flex flex-col">
                        {!results.requestedServices?.includes("coverLetter") && results.requestedServices?.length > 0 ? (
                          <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                            <svg className="w-10 h-10 text-gray-400 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-bold text-gray-900 text-lg">Cover Letter Not Selected</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                              This service was not included in your selected package, so no credit was charged for it.
                            </p>
                          </div>
                        ) : results.requiresUpgrade ? (
                          <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                            <svg className="w-10 h-10 text-gray-400 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h3 className="font-bold text-gray-900 text-lg">Premium Asset Generation</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                              {results.upgradeMessage || "Generating tailored cover letters requires active generation credits."}
                            </p>
                            <div className="pt-2">
                              <span 
                                onClick={() => openPaymentModal("starter")} 
                                className="inline-block bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors"
                              >
                                Get Starter Bundle (49 ETB / 10 Credits)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center shrink-0">
                              <h2 className="font-bold text-gray-900">Tailored Cover Letter</h2>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(results.coverLetter || "");
                                    showToast("Cover letter copied to clipboard.", "success");
                                  }} 
                                  disabled={results.isGenerating}
                                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                  Copy Text
                                </button>
                                {isClient && !results.isGenerating && results.coverLetter && !results.coverLetter.includes("Error:") && (
                                  <PDFDownloadLink
                                    document={<ATSCoverLetterPDF clText={results.coverLetter} />}
                                    fileName={`${companyName ? companyName.replace(/\s+/g, '_') : 'Target_Company'}_Cover_Letter.pdf`}
                                    className="flex items-center text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
                                  >
                                    {({ loading }) => (
                                      loading ? "Preparing PDF..." : (
                                        <>
                                          <svg className="w-3.5 h-3.5 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                          Download PDF
                                        </>
                                      )
                                    )}
                                  </PDFDownloadLink>
                                )}
                              </div>
                            </div>
                            <textarea 
                              readOnly 
                              value={results.isGenerating ? "Synthesizing custom cover letter based on validated evidence..." : (results.coverLetter || "No cover letter generated.")} 
                              rows={13} 
                              className={`w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm leading-relaxed resize-none focus:outline-none ${results.isGenerating ? 'text-gray-400 animate-pulse' : 'text-gray-800'}`} 
                            />
                          </>
                        )}
                      </div>
                    )}

                    {/* TAB 3: CV TWEAKS */}
                    {activeTab === "optimizations" && (
                      <div className="space-y-4">
                        {!results.requestedServices?.includes("cvTweaks") && results.requestedServices?.length > 0 ? (
                          <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                            <svg className="w-10 h-10 text-gray-400 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-bold text-gray-900 text-lg">CV Tweaks Not Selected</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                              This service was not included in your selected package, so no credit was charged for it.
                            </p>
                          </div>
                        ) : results.requiresUpgrade ? (
                          <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                            <svg className="w-10 h-10 text-gray-400 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h3 className="font-bold text-gray-900 text-lg">Actionable Optimization Insights</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                              Unlock point-by-point suggestions tailored to this specific job post.
                            </p>
                            <div className="pt-2">
                              <span 
                                onClick={() => openPaymentModal("starter")} 
                                className="inline-block bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors"
                              >
                                Unlock with Starter (49 ETB)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h2 className="font-bold text-gray-900">Specific Bullet Point Enhancements</h2>
                            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 h-[340px] overflow-y-auto">
                              {results.isGenerating ? (
                                <p className="text-sm text-gray-400 animate-pulse">Computing targeted bullet enhancements...</p>
                              ) : (
                                <ul className={`space-y-3 text-sm text-gray-700 list-disc pl-4 leading-relaxed ${results.cvOptimizations?.includes('Error:') ? 'text-red-600 font-medium list-none pl-0' : ''}`}>
                                  {(results.cvOptimizations || '').split('\n').map((item: string, i: number) => {
                                    const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim();
                                    if (!cleanItem) return null;
                                    return <li key={i}>{cleanItem}</li>;
                                  })}
                                </ul>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* TAB 4: OPTIMIZED CV */}
                    {activeTab === "optimizedCV" && (
                      <div className="space-y-4 flex flex-col">
                        {!results.requestedServices?.includes("optimizedCV") && results.requestedServices?.length > 0 ? (
                          <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                            <svg className="w-10 h-10 text-gray-400 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-bold text-gray-900 text-lg">Optimized CV Not Selected</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                              This service was not included in your selected package, so no credit was charged for it.
                            </p>
                          </div>
                        ) : results.requiresUpgrade ? (
                          <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                            <svg className="w-10 h-10 text-gray-400 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h3 className="font-bold text-gray-900 text-lg">Full ATS-Formatted Resume</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                              {results.upgradeMessage || "Get the full structurally formatted ATS resume rewrite ready for export."}
                            </p>
                            <div className="pt-2">
                              <span 
                                onClick={() => openPaymentModal("standard")} 
                                className="inline-block bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors"
                              >
                                Top up Credits (99 ETB / 25 Credits)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center shrink-0">
                              <h2 className="font-bold text-gray-900">ATS Blueprint Presentation</h2>
                              {isClient && !results.isGenerating && results.optimizedCV && !results.optimizedCV.includes("Error:") && (
                                <PDFDownloadLink
                                  document={<ATSResumePDF cvText={results.optimizedCV} />}
                                  fileName={`${fileName ? fileName.replace('.pdf', '') : 'Awra'}_Optimized.pdf`}
                                  className="flex items-center text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
                                >
                                  {({ loading }) => (
                                    loading ? "Building Document..." : (
                                      <>
                                        <svg className="w-3.5 h-3.5 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download ATS PDF
                                      </>
                                    )
                                  )}
                                </PDFDownloadLink>
                              )}
                            </div>
                            
                            <div className="p-8 rounded-xl border border-gray-200 bg-white shadow-sm h-[360px] overflow-y-auto font-sans">
                              {results.isGenerating ? (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm animate-pulse">
                                  Constructing ATS-compliant blueprint format...
                                </div>
                              ) : (
                                <div className={`whitespace-pre-wrap text-sm leading-relaxed font-mono bg-gray-50/50 p-4 rounded-lg border border-gray-100 ${results.optimizedCV?.includes('Error:') ? 'text-red-600 font-bold' : 'text-slate-800'}`}>
                                  {results.optimizedCV || "No optimized CV available."}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAID SERVICE SELECTION MODAL */}
      {showServiceSelector && results && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Choose What You Need</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Your ATS score is free. Credits are charged only for the service(s) you select.
                </p>
              </div>
              <button
                onClick={() => setShowServiceSelector(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div>
                  <p className="text-xs font-bold text-blue-900">Available credits</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">Only selected services will use them.</p>
                </div>
                <span className="text-lg font-extrabold text-blue-700">{credits ?? 0}</span>
              </div>

              <div className="space-y-2">
                {ALL_GENERATION_SERVICES.map((service) => {
                  const selected = selectedServices.includes(service);
                  const cost = SERVICE_COSTS[service];

                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selected
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/10"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          selected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 bg-white"
                        }`}>
                          {selected && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-sm text-gray-900">{SERVICE_LABELS[service]}</span>
                            <span className="text-xs font-extrabold text-blue-700">
                              {cost} credit{cost === 1 ? "" : "s"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {SERVICE_DESCRIPTIONS[service]}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={selectFullPackage}
                className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                Select Full Package — 4 Credits
              </button>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800">Total</span>
                  <span className="text-lg font-extrabold text-gray-900">
                    {calculateServiceCost(selectedServices)} credits
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  No credits are deducted until you click Generate Selected Services.
                </p>
              </div>

              {typeof credits === "number" && credits < calculateServiceCost(selectedServices) && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                  You need {calculateServiceCost(selectedServices)} credits but have {credits}. Remove a service or top up.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowServiceSelector(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmServiceSelection}
                  disabled={!selectedServices.length || isGeneratingAssets || (typeof credits === "number" && credits < calculateServiceCost(selectedServices))}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm transition-colors"
                >
                  {isGeneratingAssets
                    ? "Generating..."
                    : `Generate Selected Services (${calculateServiceCost(selectedServices)} Credits)`}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowServiceSelector(false);
                  openPaymentModal("starter");
                }}
                className="w-full text-xs text-blue-600 hover:text-blue-700 font-bold"
              >
                Need more credits? Top up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP-UP MODAL OVERLAY */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 sticky top-0 bg-white/95 backdrop-blur z-10">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Top Up Credits</h3>
                <p className="text-xs text-gray-500">Pick a package to see what your credits can unlock.</p>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {paymentSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">Receipt Submitted</h4>
                  <p className="text-sm text-gray-500">
                    We will verify your transfer and credit <strong>{PLANS[selectedPlan].credits} credits</strong> to your account within 15–30 minutes.
                  </p>
                  <button 
                    onClick={() => setIsPaymentModalOpen(false)} 
                    className="mt-4 w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 1: Package Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      1. Choose Your Package
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((planKey) => {
                        const plan = PLANS[planKey];
                        const isSelected = selectedPlan === planKey;
                        return (
                          <button
                            key={planKey}
                            type="button"
                            onClick={() => setSelectedPlan(planKey)}
                            className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            {plan.popular && (
                              <span className="absolute -top-2 right-2 bg-blue-600 text-[9px] text-white font-bold px-1.5 py-0.5 rounded-full uppercase">
                                Popular
                              </span>
                            )}
                            <div className="font-bold text-sm text-gray-900">{plan.name.split(" ")[0]}</div>
                            <div className="text-xs text-blue-600 font-bold mt-0.5">{plan.price}</div>
                            <div className="text-[11px] text-gray-500 mt-1">{plan.credits} Credits</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Value Showcase: What this package can do */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        What {PLANS[selectedPlan].credits} Credits get you:
                      </span>
                      <span className="text-[10px] font-semibold bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-full">
                        {PLANS[selectedPlan].price}
                      </span>
                    </div>
                    <ul className="text-xs text-blue-950 space-y-1.5">
                      {PLANS[selectedPlan].capabilities.map((cap, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-600 font-bold shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Credit Usage Quick Guide (Accordion/Card) */}
                  <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 space-y-1.5 text-xs text-gray-600">
                    <div className="font-semibold text-gray-800 flex justify-between text-[11px] uppercase tracking-wider">
                      <span>Feature Credit Costs</span>
                      <span className="text-green-600 font-bold">ATS Score: Free</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
                      <div>• Full Application: <strong>4 Credits</strong></div>
                      <div>• CV Tailoring: <strong>2 Credits</strong></div>
                      <div>• Cover Letter: <strong>1 Credit</strong></div>
                      <div>• CV Section Tweak: <strong>1 Credit</strong></div>
                    </div>
                  </div>

                  {/* Step 2: Payment Details */}
                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-blue-900">
                      2. Transfer <strong className="text-sm font-extrabold text-blue-700">{PLANS[selectedPlan].price}</strong> via mobile banking:
                    </p>
                    <div className="space-y-2 text-xs text-blue-900">
                      <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-sm">
                        <span className="font-semibold text-gray-600">Telebirr:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold tracking-wider text-gray-900">0993965310</span>
                          <button 
                            type="button"
                            onClick={() => {
                              handleCopy("0993965310", "telebirr");
                              showToast("Telebirr number copied to clipboard.", "success");
                            }}
                            className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
                          >
                            {copiedField === "telebirr" ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-sm">
                        <span className="font-semibold text-gray-600">CBE Account:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold tracking-wider text-blue-700">1000542163821</span>
                          <button 
                            type="button"
                            onClick={() => {
                              handleCopy("1000542163821", "cbe");
                              showToast("CBE number copied to clipboard.", "success");
                            }}
                            className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
                          >
                            {copiedField === "cbe" ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Screenshot Uploader */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      3. Upload Payment Screenshot
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 border border-gray-200 rounded-xl cursor-pointer"
                    />
                    {paymentFile && (
                      <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Selected: {paymentFile.name}
                      </p>
                    )}
                  </div>

                  {/* Submit Action */}
                  <button 
                    onClick={submitPaymentReceipt} 
                    disabled={isSubmittingPayment || !paymentFile}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99] text-sm cursor-pointer"
                  >
                    {isSubmittingPayment 
                      ? "Uploading receipt securely..." 
                      : `Submit Receipt for ${PLANS[selectedPlan].credits} Credits (${PLANS[selectedPlan].price})`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}