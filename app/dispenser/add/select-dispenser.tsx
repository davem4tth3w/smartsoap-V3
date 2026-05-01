import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../lib/firebase-config";

type Dispenser = {
  id: string;
  name?: string;
  location?: string;
  floor?: number;
  assignmentStatus: string;
};

export default function SelectDeviceScreen() {
  const router = useRouter();

  const [devices, setDevices] = useState<Dispenser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  // Fetch unassigned dispensers
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const q = query(
          collection(db, "dispensers"),
          where("assignmentStatus", "==", "unassigned")
        );

        const snapshot = await getDocs(q);

        const list: Dispenser[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any),
        }));

        setDevices(list);
      } catch (error) {
        console.error("Error fetching dispensers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Handle selection
  const handleSelect = async (deviceId: string) => {
    try {
      setSelectingId(deviceId);
      
      router.push({
        pathname: "/dispenser/add/details-form",
        params: { deviceId },
      });

    } catch (error) {
      console.error("Error selecting dispenser:", error);
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Select Dispenser" }} />

      <View style={styles.container}>

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.title}>Unassigned dispensers</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : devices.length === 0 ? (
          <Text style={styles.emptyText}>
            No unassigned dispensers available.
          </Text>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => handleSelect(item.id)}
                disabled={selectingId !== null}
              >
                <View>
                  <Text style={styles.deviceId}>{item.id}</Text>
                </View>

                {selectingId === item.id && (
                  <ActivityIndicator size="small" />
                )}
              </Pressable>
            )}
          />
        )}
      </View>
    </>
  );
}


// Style sheet

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0B1220",
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 16,
    textAlign: "center",
    color: "#ffffff"
  },

  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  deviceId: {
    fontSize: 16,
    fontWeight: "600",
  },

  subText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
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