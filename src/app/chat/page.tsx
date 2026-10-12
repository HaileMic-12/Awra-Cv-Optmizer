"use client";

import { useState, useEffect, useRef } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Link } from "@react-pdf/renderer";

// 1. Advanced PDF Styles
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
      setShowServiceSelector(false);
      setIsGeneratingAssets(false);
      setActiveTab("score");
      setResults((prev: any) => ({
        ...(prev || analyzeData || {}),
        isGenerating: false,
        requiresUpgrade: false,
        requestedServices: [],
        generationSkipped: true,
      }));
      return;
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
      await generateSelectedAssets([], results);
      return;
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

      <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8 pb-32 font-sans text-gray-900">
        <div className="max-w-7xl mx-auto space-y-6">
          
         <header className="bg-white rounded-[2rem] border border-gray-200 p-8 md:p-10 shadow-sm">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div className="space-y-2 max-w-2xl">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
        Awra CV Optimizer
      </h1>
      <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">
        Drop your resume and the job posting below to see how well you match, then build a custom cover letter and optimized CV in seconds.
      </p>
    </div>

    {/* New Compact Top Up Button */}
    <div className="flex items-center w-full md:w-auto">
      {user && credits !== null && (
        <button 
          onClick={() => openPaymentModal("standard")}
          className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs px-4 py-2.5 rounded-xl font-bold shadow-sm transition-colors cursor-pointer w-full md:w-auto active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>{credits} Credits (Top Up)</span>
        </button>
      )}
    </div>
  </div>
</header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Inputs */}
            <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-[24px] border border-gray-200 shadow-sm space-y-6">
              
              {/* Step 1: Upload (Now includes the Clear Button) */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="block text-sm font-bold text-gray-900">1.Resume (PDF)</label>
                  
                  {/* Clear Button moved here */}
                  {(cvText || jobDescription || results) && (
                    <button 
                      onClick={handleClearWorkspace}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 shrink-0"
                      title="Clear Workspace"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear 
                    </button>
                  )}
                </div>

                <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors bg-gray-50 cursor-pointer group flex flex-col items-center justify-center overflow-hidden w-full">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-2 w-full max-w-full">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center mx-auto text-gray-400 group-hover:text-blue-500 transition-colors shrink-0">
                      {isExtracting ? (
                        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Truncated File Name */}
                    <div className="text-gray-900 font-semibold text-sm truncate px-4">
                      {isExtracting ? "Extracting your details..." : (fileName || "Click or drag your PDF here")}
                    </div>
                    
                    {!fileName && <p className="text-xs text-gray-400">PDF up to 5MB</p>}
                  </div>
                </div>
                
                {cvText && !isExtracting && (
                  <div className="text-xs text-green-600 font-bold flex items-center gap-1.5 px-1 mt-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Successfully extracted {cvText.split(/\s+/).filter(Boolean).length} words
                  </div>
                )}
              </div>

              {/* Step 1B: Company & Title */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">Company</label>
                  <input 
                    type="text" placeholder="e.g. Acme Corp" 
                    value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm p-3.5 border bg-gray-50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">Job Title</label>
                  <input 
                    type="text" placeholder="e.g. Lead Designer" 
                    value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm p-3.5 border bg-gray-50 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Step 2: Job Description */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">2. Job Description</label>
                <textarea
                  rows={6} placeholder="Paste the job requirements, qualifications, and role responsibilities here..."
                  value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm p-4 border bg-gray-50 outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Analyze Action */}
              <button
                onClick={handleAnalyze} disabled={isAnalyzing}
                className={`w-full py-4 mt-2 rounded-2xl text-white font-bold transition-all flex justify-center items-center gap-2 active:scale-[0.98] ${
                  isAnalyzing 
                    ? "bg-blue-300 cursor-wait shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Fit...
                  </>
                ) : "Analyze CV"}
              </button>
            </div>

            {/* RIGHT COLUMN: Results Dashboard */}
            <div className="lg:col-span-7 bg-white rounded-[24px] border border-gray-200 shadow-sm min-h-[460px] overflow-hidden">
              {!results && !isAnalyzing && (
                <div className="h-full min-h-[460px] flex flex-col items-center justify-center text-center p-12">
                  <svg className="w-12 h-12 text-gray-300 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-gray-700 font-bold">No active analysis</h3>
                  <p className="text-gray-500 text-sm mt-1 max-w-sm">
                    Your analysis will appear here once you upload your resume and add the job requirements.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="h-full min-h-[460px] flex items-center justify-center p-8 md:p-12">
                  <div className="w-full max-w-md">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <div className="h-5 w-5 rounded-full border-[3px] border-blue-100 border-t-blue-600 animate-spin" />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-blue-600">Checking your fit</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-0.5">Reading your CV against the role</h3>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        Comparing skills and requirements
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse [animation-delay:150ms]" />
                        Checking experience and evidence
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse [animation-delay:300ms]" />
                        Preparing your match report
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {results && !isAnalyzing && (
                <div className="flex flex-col h-full">
                  {results.isGenerating && (
                    <div className="mx-4 mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white border border-blue-100 flex items-center justify-center shrink-0">
                        <div className="h-4 w-4 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">Putting the finishing touches together</p>
                        <p className="text-xs text-gray-500 mt-0.5">Your ATS match is ready. We’re preparing the selected extras now.</p>
                      </div>
                      <span className="ml-auto text-[11px] font-bold text-blue-600 shrink-0">Working…</span>
                    </div>
                  )}

                  {/* Top Navigation Tabs */}
                  <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-2xl flex-wrap items-center pr-4">
                    <button 
                      onClick={() => setActiveTab("score")} 
                      className={`py-4 px-4 text-sm font-bold transition-colors border-b-2 ${
                        activeTab === "score" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      ATS Score
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab("coverLetter")} 
                      className={`py-4 px-4 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === "coverLetter" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Cover Letter 
                      {results.isGenerating && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab("optimizations")} 
                      className={`py-4 px-4 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === "optimizations" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      CV Tweaks 
                      {results.isGenerating && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab("optimizedCV")} 
                      className={`py-4 px-4 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === "optimizedCV" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"
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
                          isSavedToTracker ? "bg-green-50 text-green-700 border border-green-200" : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
                        }`}
                      >
                        {isSavedToTracker ? "Saved" : "Save to Tracker"}
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* TAB 1: ATS SCORE */}
{activeTab === "score" && (
  <div className="space-y-6">
    <div className="flex items-center gap-6">
      <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gray-50 border-8 border-gray-100 shadow-inner shrink-0">
        <span className={`text-3xl font-extrabold ${results.atsScore >= 80 ? 'text-green-600' : results.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {results.atsScore}%
        </span>
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Match Alignment Score</h2>
        <p className="text-sm text-gray-500 font-medium mt-1 leading-relaxed">
          A comprehensive breakdown of how well your resume matches the job description across key hiring metrics.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Box 1: Keywords & Formatting */}
      <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="font-extrabold text-gray-900">Keywords & Formatting</h3>
          <span className="bg-gray-100 text-gray-900 text-xs font-bold px-3 py-1 rounded-lg">
            {results.breakdown?.deterministic?.total ?? 0} / 50
          </span>
        </div>
        <div className="space-y-5">
          {[
            { label: "Required Skills", val: results.breakdown?.deterministic?.requiredSkills, max: 20, color: "bg-blue-500" },
            { label: "Preferred Skills", val: results.breakdown?.deterministic?.preferredSkills, max: 5, color: "bg-blue-500" },
            { label: "Keyword Coverage", val: results.breakdown?.deterministic?.keywordCoverage, max: 5, color: "bg-blue-500" },
            { label: "Experience Match", val: results.breakdown?.deterministic?.experience, max: 10, color: "bg-blue-500" },
            { label: "Completeness", val: results.breakdown?.deterministic?.completeness, max: 5, color: "bg-blue-500" },
          ].map((metric, i) => {
            const val = metric.val ?? 0;
            const pct = Math.min(100, Math.max(0, (val / metric.max) * 100));
            return (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>{metric.label}</span>
                  <span className="text-gray-500">{val} / {metric.max}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`${metric.color} h-1.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Box 2: Experience & Relevance */}
      <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="font-extrabold text-gray-900">Experience & Relevance</h3>
          <span className="bg-gray-100 text-gray-900 text-xs font-bold px-3 py-1 rounded-lg">
            {results.breakdown?.semantic?.total ?? 0} / 50
          </span>
        </div>
        <div className="space-y-5">
          {[
            { label: "Contextual Skills", val: results.breakdown?.semantic?.skills, max: 20, color: "bg-indigo-500" },
            { label: "Responsibility Scope", val: results.breakdown?.semantic?.responsibilities, max: 15, color: "bg-indigo-500" },
            { label: "Title Progression", val: results.breakdown?.semantic?.title, max: 5, color: "bg-indigo-500" },
            { label: "Evidence Quality", val: results.breakdown?.semantic?.evidenceQuality, max: 5, color: "bg-indigo-500" },
            { label: "Education Relevance", val: results.breakdown?.semantic?.education, max: 5, color: "bg-indigo-500" },
          ].map((metric, i) => {
            const val = metric.val ?? 0;
            const pct = Math.min(100, Math.max(0, (val / metric.max) * 100));
            return (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>{metric.label}</span>
                  <span className="text-gray-500">{val} / {metric.max}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`${metric.color} h-1.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Recommendations */}
    {results.recommendations && results.recommendations.length > 0 && (
      <div className="pt-2">
        <h3 className="font-extrabold text-gray-900 mb-4 text-sm uppercase tracking-wider">
          How to improve your score
        </h3>
        <div className="space-y-3">
          {results.recommendations.map((rec: string, idx: number) => (
            <div key={idx} className="flex gap-3 text-sm font-medium text-gray-700 bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm">
              <span className="text-blue-600 font-bold shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
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
                                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50"
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
                              value={results.isGenerating ? "Writing a cover letter around your actual experience and this role…" : (results.coverLetter || "No cover letter generated.")} 
                              rows={13} 
                              className={`w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm leading-relaxed resize-none focus:outline-none ${results.isGenerating ? 'text-gray-400 animate-pulse' : 'text-gray-900'}`} 
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
                                <p className="text-sm text-gray-400 animate-pulse">Finding the CV lines that would benefit most from a rewrite…</p>
                              ) : (
                                <ul className={`space-y-3 text-sm text-gray-700 list-disc pl-4 leading-relaxed ${results.cvOptimizations?.includes('Error:') ? 'text-red-600 font-bold list-none pl-0' : ''}`}>
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
                                  Putting your tailored CV into a clean, ATS-friendly structure…
                                </div>
                              ) : (
                                <div className={`whitespace-pre-wrap text-sm leading-relaxed font-mono bg-gray-50 p-4 rounded-lg border border-gray-200 ${results.optimizedCV?.includes('Error:') ? 'text-red-600 font-bold' : 'text-gray-800'}`}>
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
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="bg-gray-50 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[28px] shadow-2xl">
            <div className="bg-white text-gray-900 p-6 md:p-8 rounded-t-[28px] border-b border-gray-200">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-blue-600 font-bold">Next step · optional</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 text-gray-900">What would you like me to make?</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-xl leading-6">Your match report is already free. Pick only the extras you want — or pick nothing and keep the analysis.</p>
                </div>
                <button onClick={() => setShowServiceSelector(false)} className="h-9 w-9 shrink-0 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition flex items-center justify-center" aria-label="Close">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs text-gray-500">Available balance</span>
                <span className="text-sm font-bold text-gray-900">{credits ?? 0} credits</span>
              </div>
            </div>

            <div className="p-5 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ALL_GENERATION_SERVICES.map((service) => {
                  const selected = selectedServices.includes(service);
                  const cost = SERVICE_COSTS[service];
                  return (
                    <button key={service} type="button" onClick={() => toggleService(service)} className={`group text-left min-h-[175px] p-5 rounded-2xl border transition-all bg-white ${selected ? "border-blue-600 ring-1 ring-blue-600 shadow-md" : "border-gray-200 hover:border-gray-300 shadow-sm"}`}>
                      <div className="flex items-center justify-between">
                        <span className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs ${selected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-transparent"}`}>✓</span>
                        <span className="text-[11px] font-bold text-gray-500">{cost} credit{cost === 1 ? "" : "s"}</span>
                      </div>
                      <h4 className="mt-7 font-bold text-[15px] text-gray-900">{SERVICE_LABELS[service]}</h4>
                      <p className="mt-2 text-xs leading-5 text-gray-500">{SERVICE_DESCRIPTIONS[service]}</p>
                    </button>
                  );
                })}
              </div>

              <div className={`rounded-2xl border p-4 md:p-5 transition ${selectedServices.length === 0 ? "border-green-300 bg-green-50" : "border-gray-200 bg-white shadow-sm"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedServices.length === 0 ? "Analysis only" : `${selectedServices.length} generation service${selectedServices.length === 1 ? "" : "s"} selected`}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedServices.length === 0 ? "No AI generation will run. No credits will be used." : "Credits are charged only when you confirm this selection."}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-gray-900">{calculateServiceCost(selectedServices)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">credits</p>
                  </div>
                </div>
              </div>

              {selectedServices.length > 0 && typeof credits === "number" && credits < calculateServiceCost(selectedServices) && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-700">
                  You need {calculateServiceCost(selectedServices)} credits but have {credits}. Remove a service or top up.
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button type="button" onClick={() => setSelectedServices(ALL_GENERATION_SERVICES)} className="sm:w-auto px-5 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition shadow-sm">Select all</button>
                <button type="button" onClick={() => setShowServiceSelector(false)} className="sm:w-auto px-5 py-3.5 rounded-xl border border-transparent bg-transparent text-gray-600 text-sm font-bold hover:bg-gray-200 transition">Close</button>
                <button type="button" onClick={confirmServiceSelection} disabled={isGeneratingAssets || (selectedServices.length > 0 && typeof credits === "number" && credits < calculateServiceCost(selectedServices))} className="sm:flex-1 py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold transition shadow-sm active:scale-[0.98]">
                  {isGeneratingAssets ? "Generating…" : selectedServices.length === 0 ? "Continue — ATS only" : `Generate selected · ${calculateServiceCost(selectedServices)} credits`}
                </button>
              </div>

              <button type="button" onClick={() => { setShowServiceSelector(false); openPaymentModal("starter"); }} className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-bold transition">Need more credits? View top-up options</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP-UP MODAL OVERLAY */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-50 rounded-[24px] shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Top Up Credits</h3>
                <p className="text-xs font-medium text-gray-500 mt-1">Pick a package to see what your credits can unlock.</p>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {paymentSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-2xl tracking-tight">Receipt Submitted</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We will verify your transfer and credit <strong>{PLANS[selectedPlan].credits} credits</strong> to your account within 15–30 minutes.
                  </p>
                  <button 
                    onClick={() => setIsPaymentModalOpen(false)} 
                    className="mt-6 w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    Got it, close
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 1: Package Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      1. Choose Your Package
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((planKey) => {
                        const plan = PLANS[planKey];
                        const isSelected = selectedPlan === planKey;
                        return (
                          <button
                            key={planKey}
                            type="button"
                            onClick={() => setSelectedPlan(planKey)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            {plan.popular && (
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-[10px] text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                Popular
                              </span>
                            )}
                            <div className="font-extrabold text-sm text-gray-900">{plan.name.split(" ")[0]}</div>
                            <div className="text-xs text-gray-500 font-medium mt-1">{plan.credits} CRD</div>
                            <div className="text-sm text-blue-600 font-bold mt-2">{plan.price}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Value Showcase: What this package can do */}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        What {PLANS[selectedPlan].credits} Credits get you:
                      </span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                        {PLANS[selectedPlan].price}
                      </span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-2">
                      {PLANS[selectedPlan].capabilities.map((cap, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold shrink-0 mt-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span className="leading-relaxed font-medium">{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Credit Usage Quick Guide (Accordion/Card) */}
                  <div className="bg-gray-100 border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs text-gray-700">
                    <div className="font-extrabold text-gray-900 flex justify-between text-[10px] uppercase tracking-wider">
                      <span>Feature Credit Costs</span>
                      <span className="text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded">ATS Score: Free</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 text-[11px] font-medium">
                      <div>• Full Application: <strong className="text-gray-900">4 Credits</strong></div>
                      <div>• CV Tailoring: <strong className="text-gray-900">2 Credits</strong></div>
                      <div>• Cover Letter: <strong className="text-gray-900">1 Credit</strong></div>
                      <div>• CV Section Tweak: <strong className="text-gray-900">1 Credit</strong></div>
                    </div>
                  </div>

                  {/* Step 2: Payment Details */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      2. Transfer {PLANS[selectedPlan].price}
                    </p>
                    <div className="space-y-3 text-xs text-gray-900">
                      <div className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                        <span className="font-bold text-gray-500">Telebirr</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-gray-900 text-sm tracking-wider">0993965310</span>
                          <button 
                            type="button"
                            onClick={() => {
                              handleCopy("0993965310", "telebirr");
                              showToast("Telebirr number copied to clipboard.", "success");
                            }}
                            className="text-[11px] bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer shadow-sm active:scale-95"
                          >
                            {copiedField === "telebirr" ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                        <span className="font-bold text-gray-500">CBE Account</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-blue-700 text-sm tracking-wider">1000542163821</span>
                          <button 
                            type="button"
                            onClick={() => {
                              handleCopy("1000542163821", "cbe");
                              showToast("CBE number copied to clipboard.", "success");
                            }}
                            className="text-[11px] bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer shadow-sm active:scale-95"
                          >
                            {copiedField === "cbe" ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Screenshot Uploader */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      3. Upload Payment Screenshot
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-gray-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200 border border-gray-200 rounded-2xl cursor-pointer bg-white shadow-sm transition-colors"
                    />
                    {paymentFile && (
                      <p className="text-[11px] text-green-600 font-bold flex items-center gap-1.5 mt-2 px-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                    className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingPayment 
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                      : `Submit Receipt for ${PLANS[selectedPlan].credits} Credits`}
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