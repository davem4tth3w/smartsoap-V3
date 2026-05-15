import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";

import { auth, db } from "@/lib/firebase-config";

import { createUserWithEmailAndPassword } from "firebase/auth";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

export default function ManageUsersScreen() {
  const router = useRouter();

  const [allUsers, setAllUsers] = useState<any[]>([]);

  const [isAddUserModalVisible, setIsAddUserModalVisible] =
    useState(false);

  const [newUserData, setNewUserData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "maintenance" as "admin" | "maintenance",
    employeeId: "",
  });

  const defaultUsers = allUsers.filter(
    (u) =>
      u.defaultAdmin === true ||
      u.defaultMaintenance === true ||
      u.defaultMaintenance === "true"
  );

  const normalUsers = allUsers.filter(
    (u) =>
      !(
        u.defaultAdmin === true ||
        u.defaultMaintenance === true ||
        u.defaultMaintenance === "true"
      )
  );

  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));

      const users = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setAllUsers(users);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
      const cred = await createUserWithEmailAndPassword(
        auth,
        newUserData.email,
        newUserData.password
      );

      const uid = cred.user.uid;

      await setDoc(doc(db, "users", uid), {
        fullName: newUserData.fullName,
        email: newUserData.email,
        role: newUserData.role,
        employeeId: newUserData.employeeId || null,
      });

      await auth.updateCurrentUser(currentAdmin);

      setIsAddUserModalVisible(false);

      setNewUserData({
        fullName: "",
        email: "",
        password: "",
        role: "maintenance",
        employeeId: "",
      });

      await loadUsers();

      Alert.alert("Success", "User created successfully");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    Alert.alert(
      "Delete User",
      "Are you sure you want to delete this user?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", id));

              await loadUsers();
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="mr-4"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          <View className="flex-1 p-4">
            <Text className="text-3xl font-bold text-foreground">
              Manage Users
            </Text>

            <Text className="text-sm text-muted">
              Add and manage system users
            </Text>
          </View>
        </View>

        {/* Manage Users */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-sm font-bold text-foreground">
              Users
            </Text>

            <Pressable
              onPress={() => setIsAddUserModalVisible(true)}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              className="bg-primary rounded-lg px-3 py-2"
            >
              <Text className="text-white text-xs font-bold">
                + Add User
              </Text>
            </Pressable>
          </View>

          {/* Default Users */}
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
                      {u.fullName} (Default)
                    </Text>

                    <Text className="text-xs text-muted">
                      {u.email}
                    </Text>
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

          {/* Normal Users */}
          {normalUsers.map((u) => (
            <View
              key={u.id}
              className="flex-row justify-between items-center py-3 border-b border-border"
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  {u.fullName}
                </Text>

                <Text className="text-xs text-muted">
                  {u.email}
                </Text>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() =>
                    Alert.alert("Edit", `Edit user: ${u.fullName}`)
                  }
                  className="bg-primary bg-opacity-30 rounded-lg px-2 py-1 border border-primary border-opacity-50"
                >
                  <Text className="text-xs font-bold text-white">
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteUser(u.id)}
                  disabled={
                    u.defaultAdmin === true ||
                    u.defaultMaintenance === true
                  }
                  className="bg-error bg-opacity-30 rounded-lg px-2 py-1 border border-error border-opacity-50"
                >
                  <Text className="text-xs font-bold text-white">
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={isAddUserModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setIsAddUserModalVisible(false)
        }
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-4/5">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-foreground">
                  Add New User
                </Text>

                <Pressable
                  onPress={() =>
                    setIsAddUserModalVisible(false)
                  }
                >
                  <Text className="text-2xl text-muted">
                    ✕
                  </Text>
                </Pressable>
              </View>

              {/* Full Name */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Full Name
                </Text>

                <TextInput
                  className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground"
                  placeholder="John Doe"
                  placeholderTextColor="#CBD5E1"
                  value={newUserData.fullName}
                  onChangeText={(text) =>
                    setNewUserData({
                      ...newUserData,
                      fullName: text,
                    })
                  }
                />
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Email
                </Text>

                <TextInput
                  className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground"
                  placeholder="user@school.com"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="email-address"
                  value={newUserData.email}
                  onChangeText={(text) =>
                    setNewUserData({
                      ...newUserData,
                      email: text,
                    })
                  }
                />
              </View>

              {/* Password */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Password
                </Text>

                <TextInput
                  className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground"
                  placeholder="••••••••"
                  placeholderTextColor="#CBD5E1"
                  secureTextEntry
                  value={newUserData.password}
                  onChangeText={(text) =>
                    setNewUserData({
                      ...newUserData,
                      password: text,
                    })
                  }
                />
              </View>

              {/* Role */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Role
                </Text>

                <View className="flex-row gap-2">
                  {(["admin", "maintenance"] as const).map(
                    (role) => (
                      <Pressable
                        key={role}
                        onPress={() =>
                          setNewUserData({
                            ...newUserData,
                            role,
                          })
                        }
                        style={{
                          backgroundColor:
                            newUserData.role === role
                              ? "#0A5BA8"
                              : "rgba(10, 91, 168, 0.2)",
                          borderColor:
                            newUserData.role === role
                              ? "#0A5BA8"
                              : "#2D5A8C",
                        }}
                        className="flex-1 py-2 rounded-lg border items-center"
                      >
                        <Text
                          className={`font-semibold ${
                            newUserData.role === role
                              ? "text-white"
                              : "text-foreground"
                          }`}
                        >
                          {role.charAt(0).toUpperCase() +
                            role.slice(1)}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>

              {/* Employee ID */}
              {newUserData.role === "maintenance" && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Employee ID
                  </Text>

                  <TextInput
                    className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground"
                    placeholder="EMP001"
                    placeholderTextColor="#CBD5E1"
                    value={newUserData.employeeId}
                    onChangeText={(text) =>
                      setNewUserData({
                        ...newUserData,
                        employeeId: text,
                      })
                    }
                  />
                </View>
              )}

              {/* Buttons */}
              <Pressable
                onPress={handleAddUser}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                className="bg-primary rounded-xl py-3 items-center mb-3"
              >
                <Text className="text-white font-bold text-lg">
                  Add User
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setIsAddUserModalVisible(false)
                }
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                className="rounded-xl py-3 items-center border border-border"
              >
                <Text className="text-foreground font-semibold">
                  Cancel
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}