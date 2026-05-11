import { auth } from "../../../lib/firebase-config";
import { getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  Alert,
} from "react-native";
import LottieView from "lottie-react-native";

// 🔥 Firestore imports
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase-config";

export default function AssignDispenserScreen() {
  const router = useRouter();
  const { dispenserID } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  // ─── Form State ─────────────────────────────────────────
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [location, setLocation] = useState(""); 
  const [status] = useState("");
  const [soapLevel] = useState("");
  const [errors, setErrors] = useState<{ name?: string; floor?: string; location?: string }>({});

  // ─── Submit Handler ─────────────────────────────────────
  const handleSubmit = async () => {
    // ─── Validation ───────────────────────────────────────
    const newErrors: { name?: string; floor?: string; location?: string } = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    if (!floor.trim()) newErrors.floor = "Floor is required.";
    if (!location.trim()) newErrors.location = "Location is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true); //START LOADING

    // ──────────────────────────────────────────────────────

    try {
      // AUTH CHECK (must be first)
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "Not authenticated.");
        return;
      }

      // ROLE CHECK (must happen before writing data)
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));

      if (!userSnap.exists() || userSnap.data().role !== "admin") {
        Alert.alert("Error", "Unauthorized action.");
        return;
      }

      if (!dispenserID) {
        Alert.alert("Error", "No device selected.");
        return;
      }

      const payload = {
        assignmentStatus: "assigned",
        deviceName: `Dispenser ${dispenserID}`,
        name,
        floor,
        location,
        status,
        soapLevel: Number(soapLevel) || 0,
        usageCount: 0,
        lastRefill: new Date(),
      };

      await setDoc(doc(db, "dispensers", String(dispenserID)), payload);

      console.log("✅ Saved to Firestore:", payload);

      router.replace({
        pathname: "/dispenser/assign/success",
        params: {
          dispenserID,
          name,
          floor,
          location,
        },
      });

    } catch (error) {
      console.error("❌ Error saving dispenser:", error);
      Alert.alert("Error", "Failed to save dispenser.");
    }
    finally {
    setLoading(false); //STOP LOADING (important!)
  }
  };
  // ────────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen options={{ title: "Assign Dispenser" }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.title}>Assign Dispenser</Text>
        </View>

        <Text style={styles.label}>Dispenser ID</Text>

        <View style={styles.idBox}>
          <Text style={styles.idText}>
            {dispenserID ? dispenserID : "No ID selected yet"}
          </Text>
        </View>

      {/* Name */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: undefined })); }}
        placeholder="Example: Main Hallway A"
        style={[styles.input, errors.name ? styles.inputError : null]}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      {/* Floor */}
      <Text style={styles.label}>Floor</Text>
      <TextInput
        value={floor}
        onChangeText={(v) => { setFloor(v); setErrors((e) => ({ ...e, floor: undefined })); }}
        keyboardType="numeric"
        placeholder="Example: 1"
        style={[styles.input, errors.floor ? styles.inputError : null]}
      />
      {errors.floor && <Text style={styles.errorText}>{errors.floor}</Text>}

      {/* Location */}
      <Text style={styles.label}>Location</Text>
      <TextInput
        value={location}
        onChangeText={(v) => { setLocation(v); setErrors((e) => ({ ...e, location: undefined })); }}
        placeholder="Example: Hallway A"
        style={[styles.input, errors.location ? styles.inputError : null]}
      />
      {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

        {/* Submit Button */}
        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Processing..." : "Assign Dispenser"}
          </Text>
        </Pressable>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <LottieView
            source={require("../../../assets/Trail loading.json")}
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
          <Text style={styles.loadingText}>Saving...</Text>
        </View>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 16,
    textAlign: "center",
    color: "#ffffff"
  },
  label: {
    color: "#9CA3AF",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#5b5b5b",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
  },
  button: {
    backgroundColor: "#4aa7ff",
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  idBox: {
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
    marginTop: 6,
  },
  idText: {
    color: "#4aa7ff",
    fontWeight: "600",
  },

  header: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 20,
  marginBottom: 16,
},

backButton: {
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: "#1d2a45", 
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12,
},

backIcon: {
  color: "#FFFFFF",
  fontSize: 18,
  fontWeight: "600",
},

inputError: {
  borderColor: "#EF4444",
  borderWidth: 1.5,
},

errorText: {
  color: "#EF4444",
  fontSize: 12,
  marginTop: 4,
  marginLeft: 2,
},

loadingOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},

loadingText: {
  color: "#fff",
  marginTop: 10,
  fontSize: 14,
},
});