import { db, auth } from "./firebase-config";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Initialize Firebase database.
 * Validates that the logged-in user is an admin.
 */
export async function initializeFirebaseDatabase() {
  try {
    console.log("🔄 Checking Firebase initialization...");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("⏭️ Skipping DB init — no authenticated user.");
      return false;
    }

    const email = currentUser.email?.trim().toLowerCase();

    if (!email) {
      console.log("⏭️ Skipping DB init — user email missing.");
      return false;
    }

    // Query by email (MATCHES signIn logic)
    const q = query(
      collection(db, "users"),
      where("email", "==", email)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("⏭️ Skipping DB init — user doc missing.");
      return false;
    }

    const userData = snapshot.docs[0].data();

    if (userData.role !== "admin") {
      console.log("⏭️ Skipping DB init — not an admin.");
      return false;
    }

    console.log("✅ Firebase is ready (admin verified)");
    return true;

  } catch (error) {
    console.error("❌ Error during Firebase init check:", error);
    return false;
  }
}