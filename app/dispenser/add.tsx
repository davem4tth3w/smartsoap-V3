import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";

export default function AddDispenserScreen() {
  const router = useRouter();

  // ─── Form State ─────────────────────────────────────────
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("ok");

  const [batteryLevel, setBatteryLevel] = useState("100");
  const [soapLevel, setSoapLevel] = useState("100");

  // ─── Submit Handler ─────────────────────────────────────
  const handleSubmit = () => {
    const payload = {
      id,
      name,
      floor: Number(floor),
      location,
      status,
      batteryLevel: Number(batteryLevel),
      soapLevel: Number(soapLevel),
      usageCount: 0,
      assignedTo: [],
      lastRefill: new Date(),
    };

    console.log("📦 Dispenser Data:", payload);

    // TODO: Firestore integration later

    router.back();
  };

  // ────────────────────────────────────────────────────────

  return (
    <>
      {/* ✅ Correct placement inside component */}
      <Stack.Screen options={{ title: "Add Dispenser" }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.title}>Add Dispenser</Text>

        {/* ID */}
        <Text style={styles.label}>Dispenser ID</Text>
        <TextInput
          value={id}
          onChangeText={setId}
          placeholder="e.g. disp001"
          style={styles.input}
        />

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

        {/* Status */}
        <Text style={styles.label}>Status</Text>
        <TextInput
          value={status}
          onChangeText={setStatus}
          placeholder="ok"
          style={styles.input}
        />

        {/* Soap */}
        <Text style={styles.label}>Soap Level (%)</Text>
        <TextInput
          value={soapLevel}
          onChangeText={setSoapLevel}
          keyboardType="numeric"
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
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
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
});