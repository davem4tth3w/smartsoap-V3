import { db, auth, retryFirebaseOperation } from "./firebase-config";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Initialize Firebase database with seed data.
 * Safe to call multiple times — skips if data already exists.
 * Must only be called after an admin user is confirmed signed in.
 */
export async function initializeFirebaseDatabase() {
  try {
    console.log("🔄 Initializing Firebase database...");

    // ✅ Guard: must have an authenticated user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("⏭️ Skipping DB init — no authenticated user.");
      return false;
    }

    // ✅ Guard: check role from Firestore, NOT custom claims
    // Custom claims require a backend/Admin SDK to set — not available client-side.
    // We already have the user's role in Firestore, so read it from there instead.
    const { getDoc } = await import("firebase/firestore");
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!userDoc.exists() || userDoc.data()?.role !== "admin") {
      console.log("⏭️ Skipping DB init — not an admin.");
      return false;
    }

    // ── Seed Dispensers ────────────────────────────────────────────────────
    const dispensersSnapshot = await retryFirebaseOperation(
      () => getDocs(collection(db, "dispensers")),
      3,
      1000
    );

    if (dispensersSnapshot.empty) {
      console.log("📝 Creating seed dispensers...");

      const dispensers = [
        {
          id: "disp001",
          name: "Main Hallway A",
          floor: 1,
          location: "Hallway A",
          soapLevel: 85,
          batteryLevel: 92,
          usageCount: 245,
          lastRefill: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: "ok",
          assignedTo: [],
        },
        {
          id: "disp002",
          name: "Restroom 101",
          floor: 1,
          location: "Restroom 101",
          soapLevel: 35,
          batteryLevel: 45,
          usageCount: 512,
          lastRefill: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: "low",
          assignedTo: [],
        },
        {
          id: "disp003",
          name: "Cafeteria",
          floor: 1,
          location: "Cafeteria",
          soapLevel: 10,
          batteryLevel: 15,
          usageCount: 892,
          lastRefill: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          status: "critical",
          assignedTo: [],
        },
        {
          id: "disp004",
          name: "Floor 2 Hallway",
          floor: 2,
          location: "Hallway B",
          soapLevel: 72,
          batteryLevel: 88,
          usageCount: 178,
          lastRefill: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: "ok",
          assignedTo: [],
        },
        {
          id: "disp005",
          name: "Floor 2 Restroom",
          floor: 2,
          location: "Restroom 201",
          soapLevel: 0,
          batteryLevel: 5,
          usageCount: 1024,
          lastRefill: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          status: "offline",
          assignedTo: [],
        },
        {
          id: "disp006",
          name: "Floor 3 Hallway",
          floor: 3,
          location: "Hallway C",
          soapLevel: 55,
          batteryLevel: 72,
          usageCount: 334,
          lastRefill: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          status: "ok",
          assignedTo: [],
        },
      ];

      for (const dispenser of dispensers) {
        await retryFirebaseOperation(
          () => setDoc(doc(db, "dispensers", dispenser.id), dispenser),
          3,
          1000
        );
      }
      console.log(`✅ Created ${dispensers.length} seed dispensers`);
    } else {
      console.log(`✅ Dispensers already seeded (${dispensersSnapshot.size} found)`);
    }

    // ── Seed Events ────────────────────────────────────────────────────────
    const eventsSnapshot = await retryFirebaseOperation(
      () => getDocs(collection(db, "events")),
      3,
      1000
    );

    if (eventsSnapshot.empty) {
      console.log("📝 Creating seed events...");

      const events = [
        {
          id: "evt001",
          dispenserId: "disp001",
          type: "refill",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          description: "Dispenser refilled",
          refillCount: 1,
        },
        {
          id: "evt002",
          dispenserId: "disp002",
          type: "low_soap",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          description: "Soap level low",
          soapLevel: 35,
        },
        {
          id: "evt003",
          dispenserId: "disp003",
          type: "critical",
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          description: "Critical refill needed",
          soapLevel: 10,
        },
        {
          id: "evt004",
          dispenserId: "disp005",
          type: "offline",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          description: "Dispenser offline",
          batteryLevel: 5,
        },
      ];

      for (const event of events) {
        await retryFirebaseOperation(
          () => setDoc(doc(db, "events", event.id), event),
          3,
          1000
        );
      }
      console.log(`✅ Created ${events.length} seed events`);
    } else {
      console.log(`✅ Events already seeded (${eventsSnapshot.size} found)`);
    }

    console.log("✅ Firebase database initialization complete!");
    return true;
  } catch (error) {
    console.error("❌ Error initializing Firebase database:", error);
    return false;
  }
}