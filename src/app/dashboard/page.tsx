"use client";

import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Link } from "@react-pdf/renderer";
import NextLink from "next/link";

// --- PDF Styling & Components ---
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

const renderCVContent = (text: string) => {
  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <View key={index} style={{ height: 6 }} />;
    if (index === 0 && trimmed.length < 40) return <Text key={index} style={pdfStyles.headerName}>{trimmed}</Text>;
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 40 && !trimmed.startsWith('•')) {
      return <Text key={index} style={pdfStyles.sectionTitle}>{trimmed}</Text>;
    }
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      return (
        <View key={index} style={pdfStyles.bulletRow}>
          <Text style={pdfStyles.bulletIcon}>•</Text>
          <Text style={pdfStyles.bulletText}>{renderTextWithLinks(trimmed.substring(1).trim())}</Text>
        </View>
      );
    }
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "user_cvs"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        docs.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recently";
    return new Date(timestamp.toMillis()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <SidebarLayout>
      <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900 selection:bg-gray-200">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Documents</h1>
              <p className="text-gray-500 mt-1">Your vault of perfectly tailored, ATS-ready resumes.</p>
            </div>
            <NextLink 
              href="/chat"
              className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create New CV
            </NextLink>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading your vault...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No resumes generated yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Head over to the AI Analyzer to upload your current CV and target a new job description.
              </p>
              <NextLink 
                href="/chat"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm inline-block"
              >
                Optimize your first CV
              </NextLink>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-bold text-gray-900 truncate">
                        {doc.fileName ? doc.fileName.replace('.pdf', '') : "Untitled CV"}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    <div className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm border-4 ${doc.atsScore >= 80 ? 'border-green-100 bg-green-50 text-green-700' : doc.atsScore >= 60 ? 'border-yellow-100 bg-yellow-50 text-yellow-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
                      {doc.atsScore || 0}%
                    </div>
                  </div>

                  {/* FIXED SCROLLABLE PREVIEW BOX */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200 mb-6 flex-grow flex flex-col h-48 overflow-hidden">
                    <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 flex justify-between items-center shrink-0">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Optimized Preview
                      </span>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    
                    <div className="p-4 text-xs text-gray-700 font-sans leading-relaxed whitespace-pre-wrap overflow-y-auto">
                      {doc.optimizedText}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-auto flex flex-col sm:flex-row gap-3">
                    {/* OPTIMIZED DOWNLOAD BUTTON */}
                    {isClient && doc.optimizedText && (
                      <PDFDownloadLink
                        document={<ATSResumePDF cvText={doc.optimizedText} />}
                        fileName={`${doc.fileName ? doc.fileName.replace('.pdf', '') : 'Awra'}_Optimized.pdf`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                      >
                        {({ loading }) => (
                          loading ? "Preparing PDF..." : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Optimized PDF
                            </>
                          )
                        )}
                      </PDFDownloadLink>
                    )}
                    
                    {/* ORIGINAL DOWNLOAD BUTTON */}
                    {isClient && doc.originalText && (
                      <PDFDownloadLink
                        document={<ATSResumePDF cvText={doc.originalText} />}
                        fileName={`${doc.fileName ? doc.fileName.replace('.pdf', '') : 'Awra'}_Original.pdf`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-bold text-sm transition-colors"
                      >
                        {({ loading }) => (
                          loading ? "Preparing PDF..." : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Original PDF
                            </>
                          )
                        )}
                      </PDFDownloadLink>
                    )}
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}