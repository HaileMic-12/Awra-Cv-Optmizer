"use client";

import { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Ensure this path matches your setup

const STATUS_COLORS: Record<string, string> = {
  "Saved": "bg-gray-100 text-gray-700 border-gray-200",
  "Applied": "bg-blue-100 text-blue-700 border-blue-200",
  "Interviewing": "bg-purple-100 text-purple-700 border-purple-200",
  "Offered": "bg-green-100 text-green-700 border-green-200",
  "Rejected": "bg-red-100 text-red-700 border-red-200",
};

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "user_jobs"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedJobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort manually (newest first) to avoid needing a composite index initially
        fetchedJobs.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setJobs(fetchedJobs);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [user]);

  // Update the status directly in Firebase when the dropdown changes
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      // 1. Optimistically update the UI instantly so it feels fast
      setJobs(jobs.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
      
      // 2. Update the actual document in the database
      const jobRef = doc(db, "user_jobs", jobId);
      await updateDoc(jobRef, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Could not update status in the database.");
    }
  };

  return (
    <SidebarLayout>
      <div className="p-4 md:p-8 font-sans max-w-6xl mx-auto pb-32">
        <h1 className="text-3xl font-bold text-gray-900">Application Tracker</h1>
        <p className="text-gray-500 mt-2 mb-8">Keep track of your interviews and application statuses.</p>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center bg-white">
            <span className="text-4xl mb-3">💼</span>
            <h3 className="font-semibold text-gray-700">No jobs saved yet</h3>
            <p className="text-sm text-gray-400 mt-1">Go to the AI Analyzer and click "Save to Tracker" after generating a CV.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                
                {/* Job Info */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{job.jobTitle}</h3>
                  <p className="text-gray-500 font-medium text-sm">{job.companyName}</p>
                </div>
                
                {/* Footer with Date and Status Dropdown */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {job.createdAt ? new Date(job.createdAt.toMillis()).toLocaleDateString() : "Just now"}
                  </span>
                  
                  {/* Interactive Status Dropdown */}
                  <select 
                    value={job.status || "Saved"}
                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer outline-none transition-colors ${STATUS_COLORS[job.status] || STATUS_COLORS["Saved"]}`}
                  >
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offered">Offered 🎉</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}