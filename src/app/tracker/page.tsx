"use client";

import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// The columns for our Kanban board
const COLUMNS = ["Saved", "Applied", "Interviewing", "Offered", "Rejected"];

export default function TrackerPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch jobs from Firebase
  const fetchJobs = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "user_jobs"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const fetchedJobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by newest first
      fetchedJobs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  // Update job status
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    // Optimistic UI update for snappy feel
    setJobs(jobs.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
    
    try {
      const jobRef = doc(db, "user_jobs", jobId);
      await updateDoc(jobRef, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
      fetchJobs(); // Revert on failure
    }
  };

  // Delete a job
  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    
    setJobs(jobs.filter(job => job.id !== jobId));
    try {
      await deleteDoc(doc(db, "user_jobs", jobId));
    } catch (error) {
      console.error("Failed to delete job:", error);
      fetchJobs(); // Revert on failure
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recently";
    return new Date(timestamp.toMillis()).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <SidebarLayout>
      <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900 overflow-x-auto">
        <div className="max-w-7xl mx-auto space-y-8 min-w-[1000px]">
          
          <header className="border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Job Tracker</h1>
            <p className="text-gray-500 mt-1">Manage your applications and interview pipeline.</p>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading your pipeline...</p>
            </div>
          ) : (
            <div className="flex gap-6 pb-8">
              {COLUMNS.map(column => (
                <div key={column} className="flex-1 min-w-[280px] bg-gray-100/50 rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="font-bold text-gray-700">{column}</h2>
                    <span className="bg-white text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm border border-gray-200">
                      {jobs.filter(j => j.status === column).length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {jobs.filter(j => j.status === column).map(job => (
                      <div key={job.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
                        
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900 leading-tight">{job.jobTitle}</h3>
                          <button 
                            onClick={() => handleDelete(job.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Job"
                          >
                            ✖
                          </button>
                        </div>
                        
                        <p className="text-sm font-medium text-blue-600 mb-4">{job.companyName}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-xs text-gray-400 font-medium">{formatDate(job.createdAt)}</span>
                          
                          <select 
                            value={job.status}
                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                            className="text-xs bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                          >
                            {COLUMNS.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>

                      </div>
                    ))}
                    
                    {jobs.filter(j => j.status === column).length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                        <p className="text-xs text-gray-400 font-medium">No jobs here yet</p>
                      </div>
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