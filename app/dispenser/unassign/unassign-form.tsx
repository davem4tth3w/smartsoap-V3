import { auth } from "../../../lib/firebase-config";
import { getDoc, updateDoc, doc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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

import { db } from "../../../lib/firebase-config";

export default function UnassignDispenserScreen() {
  const router = useRouter();

  const {
    dispenserID,
    name: initialName,
    floor: initialFloor,
    location: initialLocation,
  } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);

  // ─── Form State ─────────────────────────
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [location, setLocation] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    floor?: string;
    location?: string;
  }>({});

  // ─── Prefill Existing Values ─────────────────────────
  useEffect(() => {
    if (typeof initialName === "string") setName(initialName);
    if (typeof initialFloor === "string") setFloor(initialFloor);
    if (typeof initialLocation === "string") setLocation(initialLocation);
  }, []);

    // ─── Submit Handler ─────────────────────────────────────
    const handleSubmit = async () => {
    setLoading(true);

        try {
            // AUTH CHECK
            const currentUser = auth.currentUser;

            if (!currentUser) {
            Alert.alert("Error", "Not authenticated.");
            return;
            }

            // ROLE CHECK
            const userSnap = await getDoc(doc(db, "users", currentUser.uid));

            if (!userSnap.exists() || userSnap.data().role !== "admin") {
            Alert.alert("Error", "Unauthorized action.");
            return;
            }

            if (!dispenserID || typeof dispenserID !== "string") {
            Alert.alert("Error", "Invalid dispenser ID.");
            return;
            }

            // UPDATE FIRESTORE
            await updateDoc(doc(db, "dispensers", dispenserID), {
            assignmentStatus: "unassigned",

            // Clear assignment details
            name: "",
            floor: "",
            location: "",

            // Optional reset fields
            status: "",
            usageCount: 0,
            soapLevel: 0,
            });

            console.log("✅ Dispenser unassigned successfully");

            router.replace({
            pathname: "/dispenser/unassign/unassign-success",
            params: {
                dispenserID,
            },
            });

        } catch (error) {
            console.error("❌ Error unassigning dispenser:", error);
            Alert.alert("Error", "Failed to unassign dispenser.");
        } finally {
            setLoading(false);
        }
    };

  return (
    <>
      <Stack.Screen options={{ title: "Unassign Dispenser" }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
                >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>

                <Text style={styles.title}>Unassign Dispenser</Text>
            </View>
        </View>

        {/* Dispenser ID */}
        <Text style={styles.label}>Dispenser ID</Text>

        <View style={styles.idBox}>
          <Text style={styles.idText}>
            {dispenserID ? dispenserID : "No ID selected"}
          </Text>
        </View>

       {/* Name */}
        <Text style={styles.label}>Name</Text>

        <View style={styles.readOnlyBox}>
          <Text style={styles.readOnlyText}>
            {name || "No name assigned"}
          </Text>
        </View>

        {/* Floor */}
        <Text style={styles.label}>Floor</Text>

        <View style={styles.readOnlyBox}>
          <Text style={styles.readOnlyText}>
            {floor || "No floor assigned"}
          </Text>
        </View>

        {/* Location */}
        <Text style={styles.label}>Location</Text>

        <View style={styles.readOnlyBox}>
          <Text style={styles.readOnlyText}>
            {location || "No location assigned"}
          </Text>
        </View>

        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Ionicons
            name="warning-outline"
            size={22}
            color="#FACC15"
          />

          <Text style={styles.warningText}>
            This will remove all current dispenser data and mark the dispenser as unassigned.
            The dispenser can still be assigned again later.
          </Text>
        </View>

        {errors.location && (
          <Text style={styles.errorText}>{errors.location}</Text>
        )}

        {/* Submit Button */}
        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Unassigning..." : "Unassign Dispenser"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LottieView
            source={require("../../../assets/Trail loading.json")}
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />

          <Text style={styles.loadingText}>Unassigning...</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    padding: 20,
  },

    header: {
    marginBottom: 10,
    },

    headerTop: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    },

  backButton: {
    marginRight: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  label: {
    color: "#FFFFFF",
    marginBottom: 8,
    marginTop: 10,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#334155",
  },

  inputError: {
    borderColor: "#EF4444",
  },

  errorText: {
    color: "#EF4444",
    marginTop: 4,
  },

  idBox: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },

  idText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600",
  },

  warningBox: {
  flexDirection: "row",
  backgroundColor: "#1E293B",
  borderWidth: 1,
  borderColor: "#FACC15",
  borderRadius: 12,
  padding: 16,
  marginTop: 20,
  alignItems: "flex-start",
},

readOnlyBox: {
  backgroundColor: "#111827",
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: "#334155",
},

readOnlyText: {
  color: "#E5E7EB",
  fontSize: 16,
  fontWeight: "500",
},

warningText: {
  color: "#E5E7EB",
  marginLeft: 10,
  flex: 1,
  lineHeight: 20,
},

  button: {
    backgroundColor: "#b92f2f",
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
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
  },

  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },


});