"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const ADMIN_EMAIL = "hailemichaelmekonenn@gmail.com";

type AdminView = "payments" | "users";

type PaymentRequest = {
  id: string;
  userId: string;
  userEmail: string;
  plan: string;
  price: number;
  creditsToAdd: number;
  receiptUrl: string;
  status: string;
  createdAt?: unknown;
};

type UserRecord = {
  id: string;
  email?: string;
  credits: number;
  createdAt?: unknown;
};

type ToastType = "success" | "error" | "info";

type ToastState = {
  message: string;
  type: ToastType;
};

function formatDate(value: unknown): string {
  if (!value) return "—";

  try {
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );
    }

    if (typeof value === "number") {
      return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    if (typeof value === "string") {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }
  } catch {
    // Ignore invalid dates.
  }

  return "—";
}

function formatTime(value: unknown): string {
  if (!value) return "—";

  try {
    let date: Date | null = null;

    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      date = (value as { toDate: () => Date }).toDate();
    } else if (typeof value === "number") {
      date = new Date(value);
    } else if (typeof value === "string") {
      date = new Date(value);
    }

    if (!date || Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatFullDate(value: unknown): string {
  if (!value) return "—";

  try {
    let date: Date | null = null;

    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      date = (value as { toDate: () => Date }).toDate();
    } else if (typeof value === "number") {
      date = new Date(value);
    } else if (typeof value === "string") {
      date = new Date(value);
    }

    if (!date || Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getRelativeTime(value: unknown): string {
  if (!value) return "";

  try {
    let date: Date | null = null;

    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      date = (value as { toDate: () => Date }).toDate();
    } else if (typeof value === "number") {
      date = new Date(value);
    } else if (typeof value === "string") {
      date = new Date(value);
    }

    if (!date || Number.isNaN(date.getTime())) return "";

    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return formatDate(value);
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function LogoMark() {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/10">
      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950">
        <span className="text-sm font-black tracking-tight text-white">A</span>
      </div>
    </div>
  );
}

function CreditCardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6.5 15h3" />
    </svg>
  );
}

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function RefreshIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-15.2-6.5L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 15.2 6.5L21 16" />
      <path d="M21 21v-5h-5" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function XIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ImageIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LoaderIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GiftIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13" />
      <path d="M3 12h18" />
      <path d="M12 8H7.5a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8Z" />
      <path d="M12 8h4.5a2.5 2.5 0 1 0 0-5C14 3 12 8 12 8Z" />
    </svg>
  );
}

function MoreIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

function ChevronDownIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function CopyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function MailIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function UserCircleIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6.5 19c1.4-2.2 3.3-3.5 5.5-3.5s4.1 1.3 5.5 3.5" />
    </svg>
  );
}

function TrendingUpIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

function WalletIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19a2 2 0 0 1 2 2v13H6.5A2.5 2.5 0 0 1 4 16.5v-10Z" />
      <path d="M4 7h15" />
      <path d="M16 12h5" />
      <circle cx="16" cy="12" r=".8" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable UI                                                                */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon,
  label,
  value,
  description,
  iconClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  iconClassName?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-100/70 transition-transform duration-300 group-hover:scale-125" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            iconClassName || "bg-slate-100 text-slate-700"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function AdminFinancePage() {
  const { user, loading: authLoading } = useAuth();

  const [activeView, setActiveView] = useState<AdminView>("payments");

  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<PaymentRequest | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [userSort, setUserSort] = useState<
    "credits-desc" | "credits-asc" | "newest" | "oldest" | "email"
  >("credits-desc");

  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAdmin =
    !!user &&
    user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });

      window.setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    []
  );

  const fetchPendingRequests = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);

      try {
        const q = query(
          collection(db, "payment_requests"),
          where("status", "==", "pending")
        );

        const snapshot = await getDocs(q);

        const data: PaymentRequest[] = snapshot.docs.map((paymentDoc) => {
          const paymentData = paymentDoc.data();

          return {
            id: paymentDoc.id,
            userId: paymentData.userId || "",
            userEmail: paymentData.userEmail || "",
            plan: paymentData.plan || "Unknown",
            price: Number(paymentData.price) || 0,
            creditsToAdd: Number(paymentData.creditsToAdd) || 0,
            receiptUrl: paymentData.receiptUrl || "",
            status: paymentData.status || "pending",
            createdAt: paymentData.createdAt,
          };
        });

        data.sort((a, b) => {
          const aTime = getDateValue(a.createdAt);
          const bTime = getDateValue(b.createdAt);
          return bTime - aTime;
        });

        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch payment requests:", error);
        showToast("Unable to load payment requests.", "error");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [showToast]
  );

  const fetchUsers = useCallback(
    async (silent = false) => {
      if (!silent) setIsUsersLoading(true);

      try {
        const snapshot = await getDocs(collection(db, "users"));

        const data: UserRecord[] = snapshot.docs.map((userDoc) => {
          const userData = userDoc.data();

          return {
            id: userDoc.id,
            email: userData.email || "",
            credits: Number(userData.credits) || 0,
            createdAt: userData.createdAt,
          };
        });

        setUsersList(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        showToast("Unable to load users.", "error");
      } finally {
        if (!silent) setIsUsersLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    if (activeView === "payments") {
      fetchPendingRequests();
    } else {
      fetchUsers();
    }
  }, [
    activeView,
    authLoading,
    isAdmin,
    fetchPendingRequests,
    fetchUsers,
  ]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (enlargedImage) {
        setEnlargedImage(null);
        return;
      }

      if (selectedRequest) {
        setSelectedRequest(null);
        return;
      }

      if (showCreditModal) {
        setShowCreditModal(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [enlargedImage, selectedRequest, showCreditModal]);

  useEffect(() => {
    if (enlargedImage || selectedRequest || showCreditModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [enlargedImage, selectedRequest, showCreditModal]);

  const filteredRequests = useMemo(() => {
    const queryText = paymentSearchQuery.trim().toLowerCase();

    if (!queryText) return requests;

    return requests.filter((request) => {
      return (
        request.userEmail.toLowerCase().includes(queryText) ||
        request.plan.toLowerCase().includes(queryText) ||
        String(request.price).includes(queryText)
      );
    });
  }, [requests, paymentSearchQuery]);

  const filteredUsers = useMemo(() => {
    const queryText = userSearchQuery.trim().toLowerCase();

    const filtered = usersList.filter((currentUser) => {
      return (
        currentUser.email?.toLowerCase().includes(queryText) ||
        currentUser.id.toLowerCase().includes(queryText)
      );
    });

    return [...filtered].sort((a, b) => {
      switch (userSort) {
        case "credits-asc":
          return a.credits - b.credits;

        case "newest":
          return getDateValue(b.createdAt) - getDateValue(a.createdAt);

        case "oldest":
          return getDateValue(a.createdAt) - getDateValue(b.createdAt);

        case "email":
          return (a.email || "").localeCompare(b.email || "");

        case "credits-desc":
        default:
          return b.credits - a.credits;
      }
    });
  }, [usersList, userSearchQuery, userSort]);

  const totalCreditsPending = useMemo(
    () =>
      requests.reduce(
        (total, request) => total + Number(request.creditsToAdd || 0),
        0
      ),
    [requests]
  );

  const totalPaymentValue = useMemo(
    () =>
      requests.reduce(
        (total, request) => total + Number(request.price || 0),
        0
      ),
    [requests]
  );

  const totalUsersInSystem = usersList.length;

  const totalCreditsInEconomy = useMemo(
    () =>
      usersList.reduce(
        (total, currentUser) => total + Number(currentUser.credits || 0),
        0
      ),
    [usersList]
  );

  const usersWithCredits = useMemo(
    () => usersList.filter((currentUser) => currentUser.credits > 0).length,
    [usersList]
  );

  const usersWithZeroCredits = useMemo(
    () => usersList.filter((currentUser) => currentUser.credits <= 0).length,
    [usersList]
  );

  const averageCredits = useMemo(() => {
    if (!usersList.length) return 0;

    return Math.round(totalCreditsInEconomy / usersList.length);
  }, [usersList, totalCreditsInEconomy]);

  const handleRefresh = async () => {
    if (!isAdmin || isRefreshing) return;

    setIsRefreshing(true);

    try {
      if (activeView === "payments") {
        await fetchPendingRequests(true);
      } else {
        await fetchUsers(true);
      }

      showToast("Dashboard refreshed.", "success");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApprove = async (request: PaymentRequest) => {
    if (processingId) return;

    setProcessingId(request.id);

    try {
      await setDoc(
        doc(db, "users", request.userId),
        {
          credits: increment(request.creditsToAdd),
        },
        { merge: true }
      );

      await updateDoc(doc(db, "payment_requests", request.id), {
        status: "approved",
        processedAt: new Date(),
      });

      setRequests((current) =>
        current.filter((item) => item.id !== request.id)
      );

      setSelectedRequest(null);

      showToast(
        `${request.creditsToAdd} credits added to ${request.userEmail}.`,
        "success"
      );
    } catch (error) {
      console.error("Failed to approve payment:", error);
      showToast(
        "The payment could not be approved. Please try again.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (processingId) return;

    setProcessingId(requestId);

    try {
      await updateDoc(doc(db, "payment_requests", requestId), {
        status: "rejected",
        processedAt: new Date(),
      });

      setRequests((current) =>
        current.filter((item) => item.id !== requestId)
      );

      setSelectedRequest(null);

      showToast("Payment request rejected.", "success");
    } catch (error) {
      console.error("Failed to reject payment:", error);
      showToast(
        "The payment could not be rejected. Please try again.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openCreditModal = (currentUser: UserRecord) => {
    setSelectedUser(currentUser);
    setCreditAmount("");
    setShowCreditModal(true);
  };

  const handleManualCreditAdd = async () => {
    if (!selectedUser || isAddingCredits) return;

    const amount = Number(creditAmount);

    if (!Number.isInteger(amount) || amount <= 0) {
      showToast("Enter a valid positive whole number of credits.", "error");
      return;
    }

    if (amount > 10000) {
      showToast("The maximum manual credit gift is 10,000 credits.", "error");
      return;
    }

    setIsAddingCredits(true);

    try {
      await setDoc(
        doc(db, "users", selectedUser.id),
        {
          credits: increment(amount),
        },
        { merge: true }
      );

      setUsersList((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === selectedUser.id
            ? {
                ...currentUser,
                credits: currentUser.credits + amount,
              }
            : currentUser
        )
      );

      setSelectedUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              credits: currentUser.credits + amount,
            }
          : null
      );

      setCreditAmount("");
      setShowCreditModal(false);

      showToast(
        `${amount.toLocaleString()} credits gifted to ${
          selectedUser.email || "the user"
        }.`,
        "success"
      );
    } catch (error) {
      console.error("Failed to add manual credits:", error);
      showToast("Credits could not be added. Please try again.", "error");
    } finally {
      setIsAddingCredits(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied.`, "success");
    } catch {
      showToast(`Could not copy ${label.toLowerCase()}.`, "error");
    }
  };

  const navigateTo = (view: AdminView) => {
    setActiveView(view);
    setMobileNavOpen(false);
  };

  /* ------------------------------------------------------------------------ */
  /* Auth / Access States                                                     */
  /* ------------------------------------------------------------------------ */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl">
            <LoaderIcon className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldIcon className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
            Access restricted
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            You do not have permission to access the finance administration
            area.
          </p>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Sidebar                                                                  */
  /* ------------------------------------------------------------------------ */

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`${
        mobile
          ? "fixed inset-y-0 left-0 z-[70] flex w-[290px] shadow-2xl"
          : "hidden lg:flex lg:w-[278px] lg:shrink-0"
      } flex-col overflow-hidden bg-[#101318] text-white`}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-white/[0.025] blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-[-80px] h-64 w-64 rounded-full bg-indigo-500/[0.035] blur-3xl" />

      <div className="relative flex h-full flex-col">
        {/* Brand */}
        <div className="px-5 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <LogoMark />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-[15px] font-bold tracking-tight text-white">
                  Awra
                </h1>
                <span className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Admin
                </span>
              </div>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Finance &amp; Operations
              </p>
            </div>

            {mobile && (
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Close navigation"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Admin identity */}
        <div className="mx-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-white shadow-lg">
              {getInitials(user.email || "Admin")}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#17191e] bg-emerald-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white">
                Administrator
              </p>
              <p className="mt-0.5 truncate text-[10px] text-slate-500">
                {user.email}
              </p>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500">
              <ShieldIcon className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pt-7">
          <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
            Workspace
          </p>

          <nav className="space-y-1">
            <SidebarNavItem
              active={activeView === "payments"}
              icon={<CreditCardIcon className="h-[18px] w-[18px]" />}
              label="Payment Requests"
              badge={requests.length}
              onClick={() => navigateTo("payments")}
            />

            <SidebarNavItem
              active={activeView === "users"}
              icon={<UsersIcon className="h-[18px] w-[18px]" />}
              label="Users"
              badge={usersList.length}
              onClick={() => navigateTo("users")}
            />
          </nav>
        </div>

        {/* Quick finance summary */}
        <div className="mt-auto px-4 pb-4">
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                  Credit economy
                </span>
                <WalletIcon className="h-4 w-4 text-slate-600" />
              </div>

              <p className="mt-2 text-lg font-bold tracking-tight text-white">
                {totalCreditsInEconomy.toLocaleString()}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                Credits currently distributed
              </p>
            </div>

            <div className="border-t border-white/[0.06] px-4 py-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Pending requests</span>
                <span className="font-semibold text-slate-300">
                  {requests.length}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 px-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-slate-600">
              Admin console secure
            </span>
          </div>
        </div>
      </div>
    </aside>
  );

  /* ------------------------------------------------------------------------ */
  /* Page                                                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        {mobileNavOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <Sidebar mobile />
          </>
        )}

        <main className="min-w-0 flex-1">
          {/* Top header */}
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
                  aria-label="Open navigation"
                >
                  <MoreIcon className="h-5 w-5 rotate-90" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                      {activeView === "payments"
                        ? "Payment Requests"
                        : "User Directory"}
                    </h2>

                    <span className="hidden rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:inline-flex">
                      Admin
                    </span>
                  </div>

                  <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                    {activeView === "payments"
                      ? "Review receipts and manage credit purchases."
                      : "Manage users and their credit balances."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Refresh"
                >
                  {isRefreshing ? (
                    <LoaderIcon className="h-4 w-4" />
                  ) : (
                    <RefreshIcon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <div className="hidden h-9 w-px bg-slate-200 sm:block" />

                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                    {getInitials(user.email || "A")}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {/* ---------------------------------------------------------------- */}
            {/* Payments                                                        */}
            {/* ---------------------------------------------------------------- */}

            {activeView === "payments" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Pending requests"
                    value={requests.length}
                    description="Awaiting review"
                    icon={
                      <CreditCardIcon className="h-5 w-5" />
                    }
                    iconClassName="bg-amber-50 text-amber-600"
                  />

                  <StatCard
                    label="Credits pending"
                    value={totalCreditsPending.toLocaleString()}
                    description="Ready to be issued"
                    icon={<GiftIcon className="h-5 w-5" />}
                    iconClassName="bg-violet-50 text-violet-600"
                  />

                  <StatCard
                    label="Pending value"
                    value={`$${totalPaymentValue.toLocaleString()}`}
                    description="Payment requests"
                    icon={<WalletIcon className="h-5 w-5" />}
                    iconClassName="bg-emerald-50 text-emerald-600"
                  />

                  <StatCard
                    label="Users"
                    value={totalUsersInSystem}
                    description="Registered accounts"
                    icon={<UsersIcon className="h-5 w-5" />}
                    iconClassName="bg-blue-50 text-blue-600"
                  />
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-950">
                          Pending payments
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Review submitted receipts before adding credits.
                        </p>
                      </div>

                      <div className="relative w-full lg:w-[320px]">
                        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={paymentSearchQuery}
                          onChange={(event) =>
                            setPaymentSearchQuery(event.target.value)
                          }
                          placeholder="Search email, plan or amount..."
                          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <LoaderIcon className="h-6 w-6 text-slate-500" />
                      <p className="mt-3 text-xs font-medium text-slate-500">
                        Loading payment requests...
                      </p>
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <EmptyState
                      icon={<CreditCardIcon className="h-6 w-6" />}
                      title={
                        paymentSearchQuery
                          ? "No matching payments"
                          : "No pending payments"
                      }
                      description={
                        paymentSearchQuery
                          ? "Try a different email, plan name or payment amount."
                          : "You're all caught up. New payment requests will appear here."
                      }
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredRequests.map((request) => (
                        <div
                          key={request.id}
                          className="group p-4 transition hover:bg-slate-50/70 sm:p-5"
                        >
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                            <button
                              type="button"
                              onClick={() =>
                                request.receiptUrl &&
                                setEnlargedImage(request.receiptUrl)
                              }
                              className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left sm:h-36 xl:h-28 xl:w-44"
                              disabled={!request.receiptUrl}
                            >
                              {request.receiptUrl ? (
                                <>
                                  <img
                                    src={request.receiptUrl}
                                    alt={`Payment receipt from ${request.userEmail}`}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition group-hover:bg-slate-950/20 group-hover:opacity-100">
                                    <div className="rounded-lg bg-white/95 p-2 text-slate-800 shadow-lg">
                                      <ImageIcon className="h-4 w-4" />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">
                                  <ImageIcon className="h-6 w-6" />
                                </div>
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                  {request.plan}
                                </span>

                                <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                  Pending
                                </span>
                              </div>

                              <p className="mt-3 truncate text-sm font-semibold text-slate-950">
                                {request.userEmail || "No email provided"}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span>
                                  ${Number(request.price).toLocaleString()}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>
                                  {Number(
                                    request.creditsToAdd
                                  ).toLocaleString()}{" "}
                                  credits
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>
                                  {getRelativeTime(request.createdAt)}
                                </span>
                              </div>

                              <p className="mt-2 text-[10px] text-slate-400">
                                {formatFullDate(request.createdAt)}
                              </p>
                            </div>

                            <div className="flex w-full gap-2 xl:w-auto xl:flex-col">
                              <button
                                type="button"
                                onClick={() => setSelectedRequest(request)}
                                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 xl:w-36"
                              >
                                Review
                              </button>

                              <button
                                type="button"
                                disabled={processingId === request.id}
                                onClick={() => handleApprove(request)}
                                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 xl:w-36"
                              >
                                {processingId === request.id ? (
                                  <LoaderIcon className="h-4 w-4" />
                                ) : (
                                  <CheckIcon className="h-4 w-4" />
                                )}
                                Approve
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Users                                                            */}
            {/* ---------------------------------------------------------------- */}

            {activeView === "users" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Total users"
                    value={totalUsersInSystem}
                    description="Accounts in system"
                    icon={<UsersIcon className="h-5 w-5" />}
                    iconClassName="bg-blue-50 text-blue-600"
                  />

                  <StatCard
                    label="Credit users"
                    value={usersWithCredits}
                    description="Users with balance"
                    icon={<TrendingUpIcon className="h-5 w-5" />}
                    iconClassName="bg-emerald-50 text-emerald-600"
                  />

                  <StatCard
                    label="Zero balance"
                    value={usersWithZeroCredits}
                    description="Users needing credits"
                    icon={<WalletIcon className="h-5 w-5" />}
                    iconClassName="bg-slate-100 text-slate-600"
                  />

                  <StatCard
                    label="Credits in economy"
                    value={totalCreditsInEconomy.toLocaleString()}
                    description={`Average ${averageCredits.toLocaleString()} per user`}
                    icon={<GiftIcon className="h-5 w-5" />}
                    iconClassName="bg-violet-50 text-violet-600"
                  />
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  {/* User toolbar */}
                  <div className="border-b border-slate-100 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-950">
                            User directory
                          </h3>

                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            {filteredUsers.length}
                            {userSearchQuery ? ` / ${usersList.length}` : ""}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          View balances and gift credits to individual users.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 flex-1 sm:w-[280px]">
                          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                          <input
                            value={userSearchQuery}
                            onChange={(event) =>
                              setUserSearchQuery(event.target.value)
                            }
                            placeholder="Search email or user ID..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                          />
                        </div>

                        <div className="relative">
                          <select
                            value={userSort}
                            onChange={(event) =>
                              setUserSort(
                                event.target.value as typeof userSort
                              )
                            }
                            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-[170px]"
                          >
                            <option value="credits-desc">
                              Credits: High → Low
                            </option>
                            <option value="credits-asc">
                              Credits: Low → High
                            </option>
                            <option value="newest">Newest users</option>
                            <option value="oldest">Oldest users</option>
                            <option value="email">Email A → Z</option>
                          </select>

                          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isUsersLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <LoaderIcon className="h-6 w-6 text-slate-500" />
                      <p className="mt-3 text-xs font-medium text-slate-500">
                        Loading users...
                      </p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <EmptyState
                      icon={<UsersIcon className="h-6 w-6" />}
                      title={
                        userSearchQuery
                          ? "No matching users"
                          : "No users found"
                      }
                      description={
                        userSearchQuery
                          ? "Try searching with a different email address or user ID."
                          : "Registered users will appear here."
                      }
                    />
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[760px]">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                User
                              </th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                User ID
                              </th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                Joined
                              </th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                Balance
                              </th>
                              <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                Action
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((currentUser) => (
                              <tr
                                key={currentUser.id}
                                className="group transition hover:bg-slate-50/70"
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                                      {getInitials(
                                        currentUser.email || currentUser.id
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="max-w-[280px] truncate text-xs font-semibold text-slate-900">
                                        {currentUser.email || "No email"}
                                      </p>

                                      <div className="mt-1 flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-[10px] text-slate-400">
                                          Account active
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(currentUser.id, "User ID")
                                    }
                                    className="group/id inline-flex max-w-[210px] items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-100"
                                    title="Copy user ID"
                                  >
                                    <span className="truncate font-mono text-[10px] text-slate-500">
                                      {currentUser.id}
                                    </span>
                                    <CopyIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover/id:text-slate-600" />
                                  </button>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-slate-300" />
                                    <div>
                                      <p className="text-xs font-medium text-slate-700">
                                        {formatDate(currentUser.createdAt)}
                                      </p>
                                      <p className="mt-0.5 text-[10px] text-slate-400">
                                        {formatTime(currentUser.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex min-w-[78px] items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                        currentUser.credits > 0
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-slate-100 text-slate-500"
                                      }`}
                                    >
                                      {currentUser.credits.toLocaleString()}
                                    </span>

                                    <span className="text-[10px] text-slate-400">
                                      credits
                                    </span>
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedUser(currentUser)
                                      }
                                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                                    >
                                      View
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openCreditModal(currentUser)
                                      }
                                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-[11px] font-bold text-white transition hover:bg-slate-800"
                                    >
                                      <GiftIcon className="h-3.5 w-3.5" />
                                      Gift
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile user cards */}
                      <div className="divide-y divide-slate-100 md:hidden">
                        {filteredUsers.map((currentUser) => (
                          <div
                            key={currentUser.id}
                            className="p-4 transition hover:bg-slate-50/70"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                                {getInitials(
                                  currentUser.email || currentUser.id
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-900">
                                  {currentUser.email || "No email"}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(currentUser.id, "User ID")
                                  }
                                  className="mt-1 flex max-w-full items-center gap-1.5"
                                >
                                  <span className="truncate font-mono text-[9px] text-slate-400">
                                    {currentUser.id}
                                  </span>
                                  <CopyIcon className="h-3 w-3 shrink-0 text-slate-300" />
                                </button>
                              </div>

                              <span
                                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                                  currentUser.credits > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {currentUser.credits.toLocaleString()} credits
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[10px] font-medium text-slate-500">
                                  Joined {formatDate(currentUser.createdAt)}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedUser(currentUser)
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600"
                                >
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openCreditModal(currentUser)
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white"
                                >
                                  <GiftIcon className="h-3 w-3" />
                                  Gift
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Receipt Review Modal                                                 */}
      {/* -------------------------------------------------------------------- */}

      {selectedRequest && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRequest(null);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Review payment
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Verify the receipt before approving credits.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Close"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-140px)] overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <button
                  type="button"
                  onClick={() =>
                    selectedRequest.receiptUrl &&
                    setEnlargedImage(selectedRequest.receiptUrl)
                  }
                  className="min-h-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                >
                  {selectedRequest.receiptUrl ? (
                    <img
                      src={selectedRequest.receiptUrl}
                      alt="Payment receipt"
                      className="h-full max-h-[520px] w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full min-h-[360px] items-center justify-center text-slate-400">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </button>

                <div className="space-y-3">
                  <InfoBox
                    label="Customer"
                    value={selectedRequest.userEmail || "No email"}
                    icon={<MailIcon className="h-4 w-4" />}
                  />

                  <InfoBox
                    label="Plan"
                    value={selectedRequest.plan}
                    icon={<CreditCardIcon className="h-4 w-4" />}
                  />

                  <InfoBox
                    label="Amount"
                    value={`$${Number(
                      selectedRequest.price
                    ).toLocaleString()}`}
                    icon={<WalletIcon className="h-4 w-4" />}
                  />

                  <InfoBox
                    label="Credits"
                    value={Number(
                      selectedRequest.creditsToAdd
                    ).toLocaleString()}
                    icon={<GiftIcon className="h-4 w-4" />}
                  />

                  <InfoBox
                    label="Submitted"
                    value={formatFullDate(selectedRequest.createdAt)}
                    icon={<CalendarIcon className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={processingId === selectedRequest.id}
                onClick={() => handleReject(selectedRequest.id)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingId === selectedRequest.id ? (
                  <LoaderIcon className="h-4 w-4" />
                ) : (
                  <XIcon className="h-4 w-4" />
                )}
                Reject
              </button>

              <button
                type="button"
                disabled={processingId === selectedRequest.id}
                onClick={() => handleApprove(selectedRequest)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingId === selectedRequest.id ? (
                  <LoaderIcon className="h-4 w-4" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                Approve &amp; add credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Enlarged Receipt                                                     */}
      {/* -------------------------------------------------------------------- */}

      {enlargedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEnlargedImage(null);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setEnlargedImage(null)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close image"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <img
            src={enlargedImage}
            alt="Enlarged payment receipt"
            className="max-h-[92vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* User Detail Modal                                                    */}
      {/* -------------------------------------------------------------------- */}

      {selectedUser && !showCreditModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
            <div className="relative overflow-hidden bg-[#101318] px-6 pb-7 pt-6 text-white">
              <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/[0.04] blur-2xl" />

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-slate-400 transition hover:bg-white/[0.12] hover:text-white"
                aria-label="Close"
              >
                <XIcon className="h-4 w-4" />
              </button>

              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-900 shadow-xl">
                  {getInitials(
                    selectedUser.email || selectedUser.id
                  )}
                </div>

                <div className="min-w-0 pr-10">
                  <p className="text-base font-bold">
                    {selectedUser.email || "No email"}
                  </p>
                  <p className="mt-1 truncate font-mono text-[10px] text-slate-500">
                    {selectedUser.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current balance
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                    {selectedUser.credits.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Credits
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Joined
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-950">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {formatTime(selectedUser.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <MailIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                        {selectedUser.email || "Not available"}
                      </p>
                    </div>
                  </div>

                  {selectedUser.email && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(selectedUser.email || "", "Email")
                      }
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                      title="Copy email"
                    >
                      <CopyIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => openCreditModal(selectedUser)}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                <GiftIcon className="h-4 w-4" />
                Gift credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Gift Credits Modal                                                   */}
      {/* -------------------------------------------------------------------- */}

      {showCreditModal && selectedUser && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              if (!isAddingCredits) {
                setShowCreditModal(false);
              }
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <GiftIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      Gift credits
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Add complimentary credits to this account.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAddingCredits}
                  onClick={() => setShowCreditModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
                  aria-label="Close"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-600 shadow-sm">
                    {getInitials(
                      selectedUser.email || selectedUser.id
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {selectedUser.email || "No email"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Current balance:{" "}
                      {selectedUser.credits.toLocaleString()} credits
                    </p>
                  </div>
                </div>
              </div>

              <label
                htmlFor="creditAmount"
                className="mt-5 block text-xs font-bold text-slate-700"
              >
                Credits to add
              </label>

              <div className="relative mt-2">
                <GiftIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="creditAmount"
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={creditAmount}
                  onChange={(event) => setCreditAmount(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleManualCreditAdd();
                    }
                  }}
                  placeholder="e.g. 10"
                  autoFocus
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[10, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCreditAmount(String(amount))}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
                      creditAmount === String(amount)
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    +{amount}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    New balance
                  </span>

                  <span className="text-base font-bold text-emerald-800">
                    {(
                      selectedUser.credits +
                      (Number(creditAmount) || 0)
                    ).toLocaleString()}{" "}
                    credits
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  disabled={isAddingCredits}
                  onClick={() => setShowCreditModal(false)}
                  className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    isAddingCredits ||
                    !creditAmount ||
                    !Number.isInteger(Number(creditAmount)) ||
                    Number(creditAmount) <= 0
                  }
                  onClick={handleManualCreditAdd}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAddingCredits ? (
                    <>
                      <LoaderIcon className="h-4 w-4" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <GiftIcon className="h-4 w-4" />
                      Add credits
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Toast                                                                */}
      {/* -------------------------------------------------------------------- */}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[120] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-5 sm:w-auto sm:max-w-md sm:translate-x-0">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-200 bg-white/95"
                : toast.type === "error"
                ? "border-red-200 bg-white/95"
                : "border-slate-200 bg-white/95"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : toast.type === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {toast.type === "success" ? (
                <CheckIcon className="h-4 w-4" />
              ) : toast.type === "error" ? (
                <XIcon className="h-4 w-4" />
              ) : (
                <ShieldIcon className="h-4 w-4" />
              )}
            </div>

            <p className="pr-2 text-xs font-semibold text-slate-700">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar Navigation                                                         */
/* -------------------------------------------------------------------------- */

function SidebarNavItem({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
        active
          ? "bg-white/[0.09] text-white shadow-lg shadow-black/10"
          : "text-slate-500 hover:bg-white/[0.045] hover:text-slate-200"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white" />
      )}

      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
          active
            ? "bg-white/[0.09] text-white"
            : "bg-transparent text-slate-600 group-hover:text-slate-300"
        }`}
      >
        {icon}
      </span>

      <span className="flex-1 text-xs font-semibold">{label}</span>

      {typeof badge === "number" && badge > 0 && (
        <span
          className={`min-w-5 rounded-md px-1.5 py-0.5 text-center text-[9px] font-bold ${
            active
              ? "bg-white/10 text-white"
              : "bg-white/[0.045] text-slate-500"
          }`}
        >
          {badge > 999 ? "999+" : badge}
        </span>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Info Box                                                             */
/* -------------------------------------------------------------------------- */

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-xs font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getDateValue(value: unknown): number {
  try {
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate().getTime();
    }

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const timestamp = new Date(value).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    }
  } catch {
    return 0;
  }

  return 0;
}

function getInitials(value: string): string {
  const cleanValue = value.trim();

  if (!cleanValue) return "A";

  if (cleanValue.includes("@")) {
    return cleanValue.charAt(0).toUpperCase();
  }

  const parts = cleanValue.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  return cleanValue.slice(0, 2).toUpperCase();
}