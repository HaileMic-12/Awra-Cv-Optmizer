import { db } from "@/lib/firebase/config";
import { collection, doc, setDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";

// Save a parsed CV to Firestore
export async function saveUserCV(userId: string, parsedCVData: any) {
  try {
    // Generate a new document reference in the users/{userId}/cvs subcollection
    const cvRef = doc(collection(db, `users/${userId}/cvs`));
    
    await setDoc(cvRef, {
      ...parsedCVData,
      id: cvRef.id,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // We also want to update the user's main career profile if it doesn't exist
    const profileRef = doc(db, "careerProfiles", userId);
    await setDoc(profileRef, {
      latestTitle: parsedCVData.headline || "Professional",
      skills: parsedCVData.skills || [],
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return cvRef.id;
  } catch (error) {
    console.error("Error saving CV to Firestore:", error);
    throw new Error("Failed to save CV to your profile.");
  }
}

// Fetch all CVs for a specific user
export async function getUserCVs(userId: string) {
  try {
    const q = query(
      collection(db, `users/${userId}/cvs`), 
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user CVs:", error);
    return [];
  }
}