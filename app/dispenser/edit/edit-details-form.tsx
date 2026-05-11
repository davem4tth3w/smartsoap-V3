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

export default function EditDispenserScreen() {
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
    const newErrors: {
      name?: string;
      floor?: string;
      location?: string;
    } = {};

    if (!name.trim()) newErrors.name = "Name is required.";
    if (!floor.trim()) newErrors.floor = "Floor is required.";
    if (!location.trim()) newErrors.location = "Location is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
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
        name,
        floor,
        location,
      });

      console.log("✅ Dispenser edited successfully");

      router.replace({
        pathname: "/dispenser/edit/edit-success",
        params: {
          dispenserID,
          name,
          floor,
          location,
        },
      });

    } catch (error) {
      console.error("❌ Error editing dispenser:", error);
      Alert.alert("Error", "Failed to edit dispenser.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Edit Dispenser" }} />

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

          <Text style={styles.title}>Edit dispenser</Text>
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

        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            setErrors((e) => ({ ...e, name: undefined }));
          }}
          style={[styles.input, errors.name ? styles.inputError : null]}
        />

        {errors.name && (
          <Text style={styles.errorText}>{errors.name}</Text>
        )}

        {/* Floor */}
        <Text style={styles.label}>Floor</Text>

        <TextInput
          value={floor}
          onChangeText={(v) => {
            setFloor(v);
            setErrors((e) => ({ ...e, floor: undefined }));
          }}
          keyboardType="numeric"
          style={[styles.input, errors.floor ? styles.inputError : null]}
        />

        {errors.floor && (
          <Text style={styles.errorText}>{errors.floor}</Text>
        )}

        {/* Location */}
        <Text style={styles.label}>Location</Text>

        <TextInput
          value={location}
          onChangeText={(v) => {
            setLocation(v);
            setErrors((e) => ({ ...e, location: undefined }));
          }}
          style={[styles.input, errors.location ? styles.inputError : null]}
        />

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
            {loading ? "Editing..." : "Edit Dispenser"}
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

          <Text style={styles.loadingText}>Editing...</Text>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
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
    marginTop: 12,
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

  button: {
    backgroundColor: "#4aa7ff",
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