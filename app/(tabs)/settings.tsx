import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, Switch, Alert, TextInput, Modal, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useFirebaseAuth } from "@/lib/firebase-auth-context";
import { auth, db } from "@/lib/firebase-config";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function SettingsScreen() {
  const { user, signOut } = useFirebaseAuth();
  const router = useRouter();

  // Thresholds (Admin only)
  const [thresholds, setThresholds] = useState({
    soapLevel: 0,
    criticalSoapLevel: 0,
  });

  //fetch thresholds on load
  useEffect(() => {
  fetchThresholds();
  }, []);

  // User management

  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [isEditThresholdModalVisible, setIsEditThresholdModalVisible] = useState(false);
  const [selectedThresholdKey, setSelectedThresholdKey] = useState<keyof typeof thresholds | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "maintenance" as "admin" | "maintenance",
    employeeId: ""
  });


  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Sign Out",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await signOut();
          router.replace("/login");
        },
        style: "destructive",
      },
    ]);
  };



  const fetchThresholds = async () => {
    try {
      const thresholdRef = doc(db, "thresholds", "global");
      const thresholdSnap = await getDoc(thresholdRef);

      if (thresholdSnap.exists()) {
        const data = thresholdSnap.data();

        setThresholds({
          soapLevel: data.lowSoapLevel ?? 0,
          criticalSoapLevel: data.criticalSoapLevel ?? 0,
        });
      }
    } catch (error) {
      console.error("Error fetching thresholds:", error);
    }
  };


  const handleUpdateThreshold = async () => {
  if (!thresholdValue || selectedThresholdKey === null) return;

  const newValue = parseInt(thresholdValue);

  if (isNaN(newValue) || newValue < 0 || newValue > 100) {
    Alert.alert("Error", "Please enter a valid number between 0 and 100");
    return;
  }

  try {
    const thresholdRef = doc(db, "thresholds", "global");

    const firestoreField =
      selectedThresholdKey === "soapLevel"
        ? "lowSoapLevel"
        : "criticalSoapLevel";

    await updateDoc(thresholdRef, {
      [firestoreField]: newValue,
    });

    setThresholds((prev) => ({
      ...prev,
      [selectedThresholdKey]: newValue,
    }));

    setIsEditThresholdModalVisible(false);
    setThresholdValue("");
    setSelectedThresholdKey(null);

    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
  } catch (error) {
    console.error("Error updating threshold:", error);
    Alert.alert("Error", "Failed to update threshold");
  }
  };

  const renderThresholdRow = (label: string, key: keyof typeof thresholds) => (
    <Pressable
      onPress={() => {
        setSelectedThresholdKey(key);
        setThresholdValue(thresholds[key].toString());
        setIsEditThresholdModalVisible(true);
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="flex-row justify-between items-center py-3 border-b border-border"
    >
      <Text className="text-sm text-foreground">{label}</Text>
      <View className="bg-primary rounded-lg px-4 py-2 border border-primary border-opacity-50">
        <Text className="text-sm font-bold text-white">{thresholds[key]}%</Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
          <Text className="text-sm text-muted">Preferences & Configuration</Text>
        </View>

        {/* Account Section */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-sm font-bold text-foreground mb-4">Account</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-border">
            <Text className="text-sm text-muted">Name</Text>
            <Text className="text-sm font-semibold text-foreground">{user?.fullName || "N/A"}</Text>
          </View>
          <View className="flex-row justify-between items-center py-3 border-b border-border">
            <Text className="text-sm text-muted">Email</Text>
            <Text className="text-sm font-semibold text-foreground">{user?.email || "N/A"}</Text>
          </View>
          <View className="flex-row justify-between items-center py-3">
            <Text className="text-sm text-muted">Role</Text>
            <View className="bg-primary rounded-lg px-3 py-1">
              <Text className="text-xs font-bold text-white capitalize">{user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Admin-only: Thresholds Section */}
        {user?.role === "admin" && (
          <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
            <Text className="text-sm font-bold text-foreground mb-4">Alert Thresholds</Text>
            <Text className="text-xs text-muted mb-3">Tap to edit threshold values</Text>
            {renderThresholdRow("Low Soap Level", "soapLevel")}
            {renderThresholdRow("Critical Soap Level", "criticalSoapLevel")}
          </View>
        )}

        {/* Admin-only: Manage Users Navigation */}
        {user?.role === "admin" && (
          <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
            <Text className="text-sm font-bold text-foreground mb-4">
              User Management
            </Text>

            <Pressable
              onPress={() => router.push("/users/manage_users")}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="bg-primary rounded-xl py-4 items-center"
            >
              <Text className="text-white font-bold">
                Open Manage Users
              </Text>
            </Pressable>
          </View>
        )}

        {/* Sign Out Button */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
          className="bg-error rounded-2xl py-4 items-center mb-6"
        >
          <Text className="text-white font-bold text-lg">Sign Out</Text>
        </Pressable>


        {/* About Section */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6 bg-opacity-50">
          <Text className="text-sm font-bold text-foreground mb-3">About</Text>
          <View className="flex-row justify-between items-center py-2 mb-2">
            <Text className="text-sm text-muted">App Version</Text>
            <Text className="text-sm font-semibold text-foreground">1.0.0</Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-sm text-muted">Built with</Text>
            <Text className="text-sm font-semibold text-foreground">React Native</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Threshold Modal */}
      <Modal
        visible={isEditThresholdModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditThresholdModalVisible(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center items-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-xs">
            <Text className="text-lg font-bold text-foreground mb-4">Edit Threshold</Text>
            <TextInput
              className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground mb-4"
              placeholder="Enter value (0-100)"
              placeholderTextColor="#CBD5E1"
              keyboardType="number-pad"
              value={thresholdValue}
              onChangeText={setThresholdValue}
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleUpdateThreshold}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-1 bg-primary rounded-lg py-2 items-center"
              >
                <Text className="text-white font-bold">Save</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsEditThresholdModalVisible(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-1 bg-surface rounded-lg py-2 items-center border border-border"
              >
                <Text className="text-foreground font-bold">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
