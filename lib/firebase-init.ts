import { db, auth } from "./firebase-config";
import { doc, getDoc } from "firebase/firestore";

/**
 * Initialize Firebase database.
 * Now only validates that an admin user is signed in.
 */
export async function initializeFirebaseDatabase() {
  try {
    console.log("🔄 Checking Firebase initialization...");

    // ✅ Ensure user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("⏭️ Skipping DB init — no authenticated user.");
      return false;
    }

    // ✅ Ensure user is admin
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!userDoc.exists() || userDoc.data()?.role !== "admin") {
      console.log("⏭️ Skipping DB init — not an admin.");
      return false;
    }

    console.log("✅ Firebase is ready (no seeding performed)");
    return true;
  } catch (error) {
    console.error("❌ Error during Firebase init check:", error);
    return false;
  }
}