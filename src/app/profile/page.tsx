"use client";

import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setFormData((prev) => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setMessage({ text: "", type: "" });

    try {
      // Save to a "users" collection, using the auth UID as the document ID
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        email: user.email, 
        updatedAt: new Date()
      }, { merge: true });
      
      setMessage({ text: "Profile saved successfully! Awra will now use these details on your CVs.", type: "success" });
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ text: "Failed to save profile. Please try again.", type: "error" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  return (
    <SidebarLayout>
      <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900 selection:bg-gray-200">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <header className="border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Personal Profile</h1>
            <p className="text-gray-500 mt-1">Set your contact info once. We'll automatically perfectly format it on every resume you generate.</p>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                  <input 
                    type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    placeholder="e.g. Hailemichael Mekonenn" 
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Account Email</label>
                  <input 
                    type="email" disabled value={user?.email || ""}
                    className="w-full rounded-xl border-gray-200 text-gray-400 shadow-sm text-sm p-3 border bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
                  <input 
                    type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="e.g. +251 911 234 567" 
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Location</label>
                  <input 
                    type="text" name="location" value={formData.location} onChange={handleChange}
                    placeholder="e.g. Addis Ababa, Ethiopia" 
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Professional Links</h3>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">LinkedIn URL</label>
                  <input 
                    type="url" name="linkedin" value={formData.linkedin} onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile" 
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">GitHub URL</label>
                  <input 
                    type="url" name="github" value={formData.github} onChange={handleChange}
                    placeholder="https://github.com/yourusername" 
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Portfolio URL (Optional)</label>
                  <input 
                    type="url" name="portfolio" value={formData.portfolio} onChange={handleChange}
                    placeholder="https://yourwebsite.com" 
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-gray-50"
                  />
                </div>
              </div>

              {message.text && (
                <div className={`p-3 rounded-lg text-sm font-medium border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                  {message.text}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full md:w-auto px-8 py-3 rounded-xl text-white font-bold transition-all shadow-md ${
                    isSaving 
                      ? "bg-gray-400 cursor-wait"
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
                  }`}
                >
                  {isSaving ? "Saving..." : "Save Profile Details"}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}