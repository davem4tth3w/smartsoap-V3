import { initializeApp } from "firebase/app";
import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, Switch, Alert, TextInput, Modal, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useFirebaseAuth } from "@/lib/firebase-auth-context";
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-config";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const { user, signOut } = useFirebaseAuth();
  const router = useRouter();

  // Notification preferences
  const [notifications, setNotifications] = useState({
    criticalRefill: true,
    lowSoap: true,
    lowBattery: true,
    offlineDevice: true,
    unusualActivity: false,
  });

  // Thresholds (Admin only)
  const [thresholds, setThresholds] = useState({
    soapLevel: 25,
    batteryLevel: 15,
    criticalSoapLevel: 10,
    criticalBatteryLevel: 5,
  });

  // User management
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [isEditThresholdModalVisible, setIsEditThresholdModalVisible] = useState(false);
  const [selectedThresholdKey, setSelectedThresholdKey] = useState<keyof typeof thresholds | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "maintenance" as "admin" | "maintenance",
    employeeId: "",
    shift: "morning" as "morning" | "afternoon" | "evening",
  });

  //Handle default users
  const defaultUsers = allUsers.filter((u) =>
    u.defaultAdmin === true || u.defaultMaintenance === true || u.defaultMaintenance === "true"
  );

  const normalUsers = allUsers.filter((u) =>
    !(u.defaultAdmin === true || u.defaultMaintenance === true || u.defaultMaintenance === "true")
  );
    

  // Load all users
  useEffect(() => {
    const loadUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllUsers(users);
    };

    loadUsers();
  }, []);

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

const handleAddUser = async () => {
  if (!newUserData.email || !newUserData.password) {
    Alert.alert("Error", "Missing fields");
    return;
  }

  const currentAdmin = auth.currentUser;

  if (!currentAdmin) {
    Alert.alert("Error", "Admin session not found");
    return;
  }

  try {
    // Create user (this may temporarily switch auth state internally)
    const cred = await createUserWithEmailAndPassword(
      auth,
      newUserData.email,
      newUserData.password
    );

    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
      name: newUserData.name,
      email: newUserData.email,
      role: newUserData.role,
      employeeId: newUserData.employeeId || null,
      shift: newUserData.shift || null,
    });

    // 🔥 CRITICAL FIX: immediately restore admin session
    await auth.updateCurrentUser(currentAdmin);

    setIsAddUserModalVisible(false);

    Alert.alert("Success", "User created successfully");

  } catch (e) {
    console.error(e);
    Alert.alert("Error", "Failed to create user");
  }
};

const handleDeleteUser = async (id: string) => {
  await deleteDoc(doc(db, "users", id));
};

  const handleUpdateThreshold = async () => {
    if (!thresholdValue || selectedThresholdKey === null) return;

    const newValue = parseInt(thresholdValue);
    if (isNaN(newValue) || newValue < 0 || newValue > 100) {
      Alert.alert("Error", "Please enter a valid number between 0 and 100");
      return;
    }

    setThresholds((prev) => ({
      ...prev,
      [selectedThresholdKey]: newValue,
    }));

    setIsEditThresholdModalVisible(false);
    setThresholdValue("");
    setSelectedThresholdKey(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderSettingRow = (label: string, value: boolean, onToggle: () => void) => (
    <View className="flex-row justify-between items-center py-3 border-b border-border">
      <Text className="text-sm text-foreground">{label}</Text>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );

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

        {/* Notifications Section */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-sm font-bold text-foreground mb-4">Push Notifications</Text>
          {renderSettingRow(
            "Critical Refill Alert",
            notifications.criticalRefill,
            () => toggleNotification("criticalRefill")
          )}
          {renderSettingRow("Low Soap", notifications.lowSoap, () => toggleNotification("lowSoap"))}
          {renderSettingRow(
            "Low Battery",
            notifications.lowBattery,
            () => toggleNotification("lowBattery")
          )}
          {renderSettingRow(
            "Offline Device",
            notifications.offlineDevice,
            () => toggleNotification("offlineDevice")
          )}
          {renderSettingRow(
            "Unusual Activity",
            notifications.unusualActivity,
            () => toggleNotification("unusualActivity")
          )}
        </View>

        {/* Admin-only: Thresholds Section */}
        {user?.role === "admin" && (
          <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
            <Text className="text-sm font-bold text-foreground mb-4">Alert Thresholds</Text>
            <Text className="text-xs text-muted mb-3">Tap to edit threshold values</Text>
            {renderThresholdRow("Low Soap Level", "soapLevel")}
            {renderThresholdRow("Critical Soap Level", "criticalSoapLevel")}
            {renderThresholdRow("Low Battery Level", "batteryLevel")}
            {renderThresholdRow("Critical Battery Level", "criticalBatteryLevel")}
          </View>
        )}

        {/* Admin-only: User Management Section */}
        {user?.role === "admin" && (
          <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm font-bold text-foreground">Manage Users</Text>
              <Pressable
                onPress={() => setIsAddUserModalVisible(true)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="bg-primary rounded-lg px-3 py-1"
              >
                <Text className="text-white text-xs font-bold">+ Add User</Text>
              </Pressable>
            </View>
              {/* Default Accounts (Pinned) */}
              {defaultUsers.length > 0 && (
                <View className="mb-4">
                  <Text className="text-xs font-bold text-muted mb-2">
                    Default Accounts
                  </Text>

                  {defaultUsers.map((u) => (
                    <View
                      key={u.id}
                      className="flex-row justify-between items-center py-3 border-b border-border opacity-80"
                    >
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">
                          {u.name} (Default)
                        </Text>
                        <Text className="text-xs text-muted">{u.email}</Text>
                      </View>

                      <View className="bg-primary px-2 py-1 rounded-lg">
                        <Text className="text-white text-xs font-bold capitalize">
                          {u.role}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Regular Users */}
              {normalUsers.map((u) => (
                <View
                  key={u.id}
                  className="flex-row justify-between items-center py-3 border-b border-border"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{u.name}</Text>
                    <Text className="text-xs text-muted">{u.email}</Text>
                  </View>

                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => Alert.alert("Edit", `Edit user: ${u.name}`)}
                      className="bg-primary bg-opacity-30 rounded-lg px-2 py-1 border border-primary border-opacity-50"
                    >
                      <Text className="text-xs font-bold text-white">Edit</Text>
                    </Pressable>

                    {/* Prevent deleting default accounts */}
                    <Pressable
                      onPress={() => handleDeleteUser(u.id)}
                      disabled={u.defaultAdmin === true || u.defaultMaintenance === true}
                      className="bg-error bg-opacity-30 rounded-lg px-2 py-1 border border-error border-opacity-50"
                    >
                      <Text className="text-xs font-bold text-white">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

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

      {/* Add User Modal */}
      <Modal
        visible={isAddUserModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddUserModalVisible(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-4/5">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-foreground">Add New User</Text>
                <Pressable onPress={() => setIsAddUserModalVisible(false)}>
                  <Text className="text-2xl text-muted">✕</Text>
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Full Name</Text>
                <TextInput
                  className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground"
                  placeholder="John Doe"
                  placeholderTextColor="#CBD5E1"
                  value={newUserData.name}
                  onChangeText={(text) => setNewUserData({ ...newUserData, name: text })}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
                <TextInput
                  className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground"
                  placeholder="user@school.com"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="email-address"
                  value={newUserData.email}
                  onChangeText={(text) => setNewUserData({ ...newUserData, email: text })}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
                <TextInput
                  className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground"
                  placeholder="••••••••"
                  placeholderTextColor="#CBD5E1"
                  secureTextEntry
                  value={newUserData.password}
                  onChangeText={(text) => setNewUserData({ ...newUserData, password: text })}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Role</Text>
                <View className="flex-row gap-2">
                  {(["admin", "maintenance"] as const).map((role) => (
                    <Pressable
                      key={role}
                      onPress={() => setNewUserData({ ...newUserData, role })}
                      style={{
                        backgroundColor:
                          newUserData.role === role ? "#0A5BA8" : "rgba(10, 91, 168, 0.2)",
                        borderColor: newUserData.role === role ? "#0A5BA8" : "#2D5A8C",
                      }}
                      className="flex-1 py-2 rounded-lg border items-center"
                    >
                      <Text
                        className={`font-semibold ${newUserData.role === role ? "text-white" : "text-foreground"}`}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {newUserData.role === "maintenance" && (
                <>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-foreground mb-2">Employee ID</Text>
                    <TextInput
                      className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground"
                      placeholder="EMP001"
                      placeholderTextColor="#CBD5E1"
                      value={newUserData.employeeId}
                      onChangeText={(text) => setNewUserData({ ...newUserData, employeeId: text })}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-foreground mb-2">Shift</Text>
                    <View className="flex-row gap-2">
                      {(["morning", "afternoon", "evening"] as const).map((shift) => (
                        <Pressable
                          key={shift}
                          onPress={() => setNewUserData({ ...newUserData, shift })}
                          style={{
                            backgroundColor:
                              newUserData.shift === shift ? "#0A5BA8" : "rgba(10, 91, 168, 0.2)",
                            borderColor: newUserData.shift === shift ? "#0A5BA8" : "#2D5A8C",
                          }}
                          className="flex-1 py-2 rounded-lg border items-center"
                        >
                          <Text
                            className={`font-semibold text-xs ${newUserData.shift === shift ? "text-white" : "text-foreground"}`}
                          >
                            {shift.charAt(0).toUpperCase() + shift.slice(1)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <Pressable
                onPress={handleAddUser}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="bg-primary rounded-xl py-3 items-center mb-3"
              >
                <Text className="text-white font-bold text-lg">Add User</Text>
              </Pressable>

              <Pressable
                onPress={() => setIsAddUserModalVisible(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="rounded-xl py-3 items-center border border-border"
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
