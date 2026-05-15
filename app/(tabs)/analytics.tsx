import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useFirebaseAuth } from "@/lib/firebase-auth-context";

export default function AnalyticsScreen() {
  const { user } = useFirebaseAuth();

  // Mock analytics data
  const analyticsData = {
    totalRefills: '',
    refillsThisWeek: '',
    refillsThisMonth: ''
  };


  const renderStatCard = (title: string, value: string, subtitle?: string) => (
    <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
      <Text className="text-xs font-semibold text-muted mb-1">{title}</Text>
      <Text className="text-2xl font-bold text-primary mb-1">{value}</Text>
      {subtitle && <Text className="text-xs text-muted">{subtitle}</Text>}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground">Analytics</Text>
        </View>

        {/* Key Metrics */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Key Metrics</Text>
          <View className="flex-row gap-3 mb-3">
            {renderStatCard("This Week", analyticsData.refillsThisWeek.toString(), "refills")}
            {renderStatCard("This Month", analyticsData.refillsThisMonth.toString(), "refills")}
          </View>

          <View className="flex-row gap-3 mb-3">
            {renderStatCard("Total Refills", analyticsData.totalRefills.toString())}
          </View>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}
