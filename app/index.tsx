import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useFirebaseAuth } from "@/lib/firebase-auth-context";
import { View, ActivityIndicator } from "react-native";

export default function RootIndex() {
  const router = useRouter();
  const { isSignedIn, isLoading } = useFirebaseAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isSignedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    }
  }, [isSignedIn, isLoading]);

  // Show a spinner while Firebase resolves auth state
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}