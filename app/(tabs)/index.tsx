import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import { useState, useEffect, useMemo } from "react";
import { StyleSheet, ScrollView, View, Text, Pressable, RefreshControl, FlatList, Modal} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useFirebaseAuth } from "@/lib/firebase-auth-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const { user } = useFirebaseAuth();
  const [dispensers, setDispensers] = useState<Dispenser[]>([]);  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedDispenser, setSelectedDispenser] = useState<Dispenser | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch "assigned" dispensers from Firestore in real-time
  useEffect(() => {
    const q = query(
      collection(db, "dispensers"),
      where("assignmentStatus", "==", "assigned")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let fetched: Dispenser[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name ?? data.deviceName ?? doc.id,
            location: data.location ?? "",
            floor: typeof data.floor === "string" ? parseInt(data.floor, 10) : (data.floor ?? 0),
            status: data.status || "ok",
            soapLevel: data.soapLevel ?? 0,
            usageCount: data.usageCount ?? 0,
            lastRefill: data.lastRefill?.toDate?.()?.toISOString() ?? new Date().toISOString(),
            assignedTo: data.assignedTo ?? [],
            assignmentStatus: data.assignmentStatus,
          } as Dispenser;
        });

        // Filter by floor if selected
        if (selectedFloor !== null) {
          fetched = fetched.filter((d) => d.floor === selectedFloor);
        }

        setDispensers(fetched);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
      }
    );

    return () => unsubscribe(); // cleanup listener on unmount
  }, [user, selectedFloor]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleDispenserPress = (dispenser: Dispenser) => {
    setSelectedDispenser(dispenser);
    setIsModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMarkRefilled = async () => {
    if (selectedDispenser) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsModalVisible(false);
      setSelectedDispenser(null);
    }
  };

  const nav = useRouter();

  // Assign Dispenser handler
  const handleAssignDispenser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    nav.push("/dispenser/assign/select-dispenser"); 
  };


  //Edit dispenser details handler
  const handleEditDetails = () => {
    if (!selectedDispenser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsModalVisible(false);

    nav.push({
      pathname: "/dispenser/edit/edit-details-form",
      params: {
        dispenserID: selectedDispenser.id,
        name: selectedDispenser.name,
        floor: String(selectedDispenser.floor),
        location: selectedDispenser.location,
      },
    });
  };

  //Unassign dispenser handler
  const handleUnassignDispenser = () => {
    if (!selectedDispenser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsModalVisible(false);

    nav.push({
      pathname: "/dispenser/unassign/unassign-form",
      params: {
        dispenserID: selectedDispenser.id,
        name: selectedDispenser.name,
        floor: String(selectedDispenser.floor),
        location: selectedDispenser.location,
      },
    });
  };

  const renderDispenserCard = ({ item }: { item: Dispenser }) => (
    <Pressable
      onPress={() => handleDispenserPress(item)}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="bg-surface rounded-2xl p-4 mb-3 border border-border"
    >
      {/* Header */}
      <View className="mb-3">
        {/* ID - Top Middle */}
        <View className="items-center mb-2">
          <Text className="text-sm text-muted font-semibold">{item.id}</Text>
        </View>

        {/* Name + Status */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">{item.name}</Text>
            <Text className="text-sm text-muted">{item.location}</Text>
            <Text className="text-sm text-muted">
              Floor: {item.floor}
            </Text>
          </View>

          <View
            style={{ backgroundColor: getStatusColor(item.status) }}
            className="rounded-full px-3 py-1"
          >
            <Text className="text-white text-xs font-bold">
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Metrics Grid */}
      <View className="flex-row gap-3 mb-3">
        {/* Soap Level */}
        <View className="flex-1 bg-primary bg-opacity-20 rounded-lg p-3 border border-primary border-opacity-30">
          <Text className="text-xs text-muted font-semibold mb-1">SOAP</Text>

          <Text className="text-2xl font-bold text-white">
            {item.soapLevel}%
          </Text>

          <View className="h-1 bg-border rounded-full mt-2 overflow-hidden">
            <View
              style={[{ width: `${item.soapLevel}%` }, styles.soapBar]}
            />
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row justify-between items-center pt-3 border-t border-border">
        <Text className="text-xs text-muted">
          Usage: {item.usageCount} times
        </Text>

        <Text className="text-xs text-muted">
          Tap for details
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-4" style={{ position: "relative" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        // Add bottom padding so last card isn't hidden behind the FAB
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground">Dashboard</Text>
          <Text className="text-sm text-muted">Real-time Dispenser Status</Text>
        </View>

        {/* Status Summary */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-success bg-opacity-20 rounded-lg p-3 border border-success border-opacity-30">
            <Text className="text-xs text-muted font-semibold">OK</Text>
            <Text className="text-2xl font-bold text-success">
              {dispensers.filter((d) => d.status === "ok").length}
            </Text>
          </View>
          <View className="flex-1 bg-warning bg-opacity-20 rounded-lg p-3 border border-warning border-opacity-30">
            <Text className="text-xs text-muted font-semibold">LOW</Text>
            <Text className="text-2xl font-bold text-warning">
              {dispensers.filter((d) => d.status === "low").length}
            </Text>
          </View>
          <View className="flex-1 bg-error bg-opacity-20 rounded-lg p-3 border border-error border-opacity-30">
            <Text className="text-xs text-muted font-semibold">CRITICAL</Text>
            <Text className="text-2xl font-bold text-error">
              {dispensers.filter((d) => d.status === "critical").length}
            </Text>
          </View>
        </View>

        {/* Dispensers List */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">
            Dispensers ({dispensers.length})
          </Text>
          <FlatList
            data={dispensers}
            renderItem={renderDispenserCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Text className="text-sm text-muted">No dispensers available</Text>
              </View>
            }
          />
        </View>

      </ScrollView>

      {/* ── Floating Action Button — Assign Dispenser ─────────────────────────── */}
      {user?.role === "admin" && (
        <Pressable
          onPress={handleAssignDispenser}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: pressed ? "#0847A3" : "#4aa7ff",
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          <Text style={styles.fabIcon}>＋</Text>
          <Text style={styles.fabText}>Assign Dispenser</Text>
        </Pressable>
      )}
      {/* ──────────────────────────────────────────────────────────────────── */}

      {/* Dispenser Detail Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-4/5">
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Close Button */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-foreground">Dispenser Details</Text>
                <Pressable onPress={() => setIsModalVisible(false)}>
                  <Text className="text-2xl text-muted">✕</Text>
                </Pressable>
              </View>

              {selectedDispenser && (
                <>
                  {/* Dispenser Name & Location */}
                  <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
                    
                    {/* ID - Top Middle */}
                    <View className="items-center mb-2">
                      <Text className="text-sm text-muted font-semibold">
                        {selectedDispenser.id}
                      </Text>
                    </View>

                    {/* Name + Status */}
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-xl font-bold text-foreground mb-1">
                          {selectedDispenser.name}
                        </Text>

                        <Text className="text-sm text-muted">
                          {selectedDispenser.location}
                        </Text>

                        <Text className="text-sm text-muted">
                          Floor: {selectedDispenser.floor}
                        </Text>
                      </View>

                      <View
                        style={{ backgroundColor: getStatusColor(selectedDispenser.status) }}
                        className="rounded-full px-3 py-1 ml-3"
                      >
                        <Text className="text-white text-xs font-bold">
                          {getStatusLabel(selectedDispenser.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Real-time Metrics */}
                  <Text className="text-sm font-semibold text-foreground mb-3">Real-time Metrics</Text>

                  {/* Soap Level */}
                  <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-sm font-semibold text-foreground">Soap Level</Text>
                      <Text className="text-lg font-bold text-white">{selectedDispenser.soapLevel}%</Text>
                    </View>
                    <View className="h-2 bg-border rounded-full overflow-hidden">
                      <View
                        style={[{ width: `${selectedDispenser.soapLevel}%` }, styles.soapBar]}
                      />
                    </View>
                  </View>

                  {/* Usage Stats */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                      <Text className="text-xs text-muted font-semibold mb-1">Usage Count</Text>
                      <Text className="text-2xl font-bold text-primary">
                        {selectedDispenser.usageCount}
                      </Text>
                    </View>
                    <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                      <Text className="text-xs text-muted font-semibold mb-1">Last Refill</Text>
                      <Text className="text-xs font-semibold text-foreground">
                        {new Date(selectedDispenser.lastRefill).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Mark Refilled Button */}
                  <Pressable
                    onPress={handleMarkRefilled}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed ? "#0847A3" : "#0A5BA8",
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                    className="rounded-xl py-4 items-center mb-3"
                  >
                    <Text className="text-white font-bold text-lg">✓ Mark Refilled</Text>
                  </Pressable>

                  {/* Edit details */}
                  {user?.role === "admin" && (
                    <Pressable
                      onPress={handleEditDetails}
                      style={({ pressed }) => [
                      {
                        backgroundColor: pressed ? "#4a4a4a" : "#737373",
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                    className="rounded-xl py-4 items-center mb-3"
                  >
                    <Text className="text-white font-bold text-lg">Edit Details</Text>
                  </Pressable>
                  )}

                  {/* Unassign Dispenser Button */}
                  {user?.role === "admin" && (
                    <Pressable
                      onPress={handleUnassignDispenser}
                      style={({ pressed }) => [
                        {
                          backgroundColor: pressed ? "#a21d1d" : "#b92f2f",
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                    className="rounded-xl py-4 items-center mb-3"
                  >
                    <Text className="text-white font-bold text-lg">Unassign Dispenser</Text>
                  </Pressable>
                  )}

                  {/* Close Button */}
                  <Pressable
                    onPress={() => setIsModalVisible(false)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    className="rounded-xl py-3 items-center border border-border mb-4"
                  >
                    <Text className="text-foreground font-semibold">Close</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// ── Style sheet

// ── Dispenser Interface ───────────────────────────────────────────────
export interface Dispenser {
  id: string;
  name: string;
  location: string;
  floor: number;
  soapLevel: number;
  status: "ok" | "low" | "critical" | "offline";
  lastRefill: string;
  usageCount: number;
  assignedTo: string[];
}

function getStatusColor(status: Dispenser["status"]): string {
  switch (status) {
    case "ok":       return "#10B981";
    case "low":      return "#F59E0B";
    case "critical": return "#DC2626";
    case "offline":  return "#9CA3AF";
    default:         return "#6B7280";
  }
}

function getStatusLabel(status: Dispenser["status"]): string {
  switch (status) {
    case "ok":       return "OK";
    case "low":      return "Low";
    case "critical": return "Critical";
    case "offline":  return "Offline";
    default:         return "Unknown";
  }
}
// ─────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    // Shadow — iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    // Shadow — Android
    elevation: 8,
  },
  fabIcon: {
    color: "#ffffff",
    fontSize: 22,
    lineHeight: 24,
    marginRight: 8,
  },
  fabText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },

    // ── Progress Bar Fill Colors ──────────────────────────────────────────
  soapBar: {
    height: "100%",
    backgroundColor: "#77bdfe", // ← change this to adjust soap bar color
  }
});