import { useState, useMemo } from "react";
import { ScrollView, Text, View, Pressable, TextInput, FlatList, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useFirebaseAuth } from "@/lib/firebase-auth-context";
export default function HistoryScreen() {
  const [searchText, setSearchText] = useState("");


  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground">History</Text>
          <Text className="text-sm text-muted">Logs & Maintenance Records</Text>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <TextInput
            className="bg-primary bg-opacity-20 border border-primary border-opacity-40 rounded-xl px-4 py-3 text-foreground"
            placeholder="Search by dispenser name..."
            placeholderTextColor="#CBD5E1"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}
