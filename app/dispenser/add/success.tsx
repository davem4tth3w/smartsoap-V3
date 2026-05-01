import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SuccessScreen() {
  const router = useRouter();
  const { deviceId, name, floor, location } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4aa7ff" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Dispenser Added!</Text>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Device ID</Text>
            <Text style={styles.value}>{deviceId}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{name}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Floor</Text>
            <Text style={styles.value}>{floor}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{location}</Text>
          </View>
        </View>

        {/* Button */}
        <Pressable
          style={styles.button}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.buttonText}>Go to Dashboard</Text>
        </Pressable>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  iconContainer: {
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 30,
  },

  row: {
    marginBottom: 12,
  },

  label: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 2,
  },

  value: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#4aa7ff",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});