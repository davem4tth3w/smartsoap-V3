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

// 🔥 Firestore imports
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase-config";

export default function AddDispenserScreen() {
  const router = useRouter();
  const { deviceId } = useLocalSearchParams();

  // ─── Form State ─────────────────────────────────────────
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [location, setLocation] = useState(""); 
  const [status] = useState("");
  const [soapLevel] = useState("");

  // ─── Submit Handler ─────────────────────────────────────
  const handleSubmit = async () => {
    try {
      if (!deviceId) {
        Alert.alert("Error", "No device selected.");
        return;
      }

      const payload = {
        assignmentStatus: "assigned", // required field
        deviceName: `Dispenser ${deviceId}`, // optional naming
        name,
        floor, 
        location,
        status,
        soapLevel: Number(soapLevel) || 0,
        usageCount: 0,
        lastRefill: new Date(),
      };

      // 🔥 Save to Firestore
      await setDoc(doc(db, "dispensers", String(deviceId)), payload);

      console.log("✅ Saved to Firestore:", payload);

      // Navigate to success page
      router.replace({
        pathname: "/dispenser/add/success",
        params: {
          deviceId,
          name: name,
          floor: floor,
          location: location,
        },
      });

    } catch (error) {
      console.error("❌ Error saving dispenser:", error);
      Alert.alert("Error", "Failed to save dispenser.");
    }
  };
  // ────────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen options={{ title: "Add Dispenser" }} />

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

          <Text style={styles.title}>Add dispenser</Text>
        </View>

        <Text style={styles.label}>Dispenser ID</Text>

        <View style={styles.idBox}>
          <Text style={styles.idText}>
            {deviceId ? deviceId : "No ID selected yet"}
          </Text>
        </View>

        {/* Name */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Main Hallway A"
          style={styles.input}
        />

        {/* Floor */}
        <Text style={styles.label}>Floor</Text>
        <TextInput
          value={floor}
          onChangeText={setFloor}
          keyboardType="numeric"
          placeholder="1"
          style={styles.input}
        />

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Hallway A"
          style={styles.input}
        />

        {/* Submit Button */}
        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Add Dispenser</Text>
        </Pressable>
      </ScrollView>
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
});