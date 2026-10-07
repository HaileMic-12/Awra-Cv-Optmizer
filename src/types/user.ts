import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  plan: "free" | "starter" | "standard" | "pro";
  credits: number;             // Default 0 for new signups
  freeAnalysesRemaining: number; // Default 2 for new signups
  createdAt: Timestamp;
  updatedAt: Timestamp;
}