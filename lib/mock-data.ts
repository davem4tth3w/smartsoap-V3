export interface Dispenser {
  id: string;
  name: string;
  location: string;
  floor: number;
  soapLevel: number;
  batteryLevel: number;
  status: "ok" | "low" | "critical" | "offline";
  lastRefill: string;
  usageCount: number;
  assignedTo: string[];
}

export interface Event {
  id: string;
  type: "refill" | "critical_alert" | "low_soap" | "low_battery" | "offline" | "unusual_activity" | "refill_confirmed";
  dispenserId: string;
  dispenserName: string;
  timestamp: string;
  details: string;
}

export const MOCK_DISPENSERS: Dispenser[] = [
  {
    id: "disp-1",
    name: "Main Hallway",
    location: "Floor 1, Hallway A",
    floor: 1,
    soapLevel: 85,
    batteryLevel: 92,
    status: "ok",
    lastRefill: "2026-03-24T08:30:00Z",
    usageCount: 142,
    assignedTo: ["maint-1"],
  }
];

export const MOCK_EVENTS: Event[] = [
  {
    id: "evt-1",
    type: "refill",
    dispenserId: "disp-1",
    dispenserName: "Main Hallway",
    timestamp: "2026-03-24T08:30:00Z",
    details: "Soap level refilled from 15% to 95%",
  },
  {
    id: "evt-2",
    type: "critical_alert",
    dispenserId: "disp-3",
    dispenserName: "Cafeteria",
    timestamp: "2026-03-24T10:15:00Z",
    details: "Soap level critical: 8%",
  },
  {
    id: "evt-3",
    type: "low_battery",
    dispenserId: "disp-2",
    dispenserName: "Restroom 101",
    timestamp: "2026-03-24T09:45:00Z",
    details: "Battery level low: 45%",
  },
  {
    id: "evt-4",
    type: "offline",
    dispenserId: "disp-5",
    dispenserName: "Restroom 201",
    timestamp: "2026-03-24T08:00:00Z",
    details: "Device offline for 6+ hours",
  },
  {
    id: "evt-5",
    type: "refill_confirmed",
    dispenserId: "disp-1",
    dispenserName: "Main Hallway",
    timestamp: "2026-03-24T08:35:00Z",
    details: "Refill confirmed by maintenance",
  },
  {
    id: "evt-6",
    type: "low_soap",
    dispenserId: "disp-2",
    dispenserName: "Restroom 101",
    timestamp: "2026-03-24T07:20:00Z",
    details: "Soap level low: 25%",
  },
  {
    id: "evt-7",
    type: "unusual_activity",
    dispenserId: "disp-3",
    dispenserName: "Cafeteria",
    timestamp: "2026-03-24T06:50:00Z",
    details: "Unusual button press frequency detected",
  },
  {
    id: "evt-8",
    type: "refill",
    dispenserId: "disp-4",
    dispenserName: "Second Floor Hallway",
    timestamp: "2026-03-23T09:00:00Z",
    details: "Soap level refilled from 20% to 98%",
  },
];

export function getStatusColor(status: Dispenser["status"]): string {
  switch (status) {
    case "ok":
      return "#10B981"; // Green
    case "low":
      return "#F59E0B"; // Yellow
    case "critical":
      return "#DC2626"; // Red
    case "offline":
      return "#9CA3AF"; // Gray
    default:
      return "#6B7280";
  }
}

export function getStatusLabel(status: Dispenser["status"]): string {
  switch (status) {
    case "ok":
      return "OK";
    case "low":
      return "Low";
    case "critical":
      return "Critical";
    case "offline":
      return "Offline";
    default:
      return "Unknown";
  }
}

export function getEventTypeIcon(type: Event["type"]): string {
  switch (type) {
    case "refill":
      return "🔄";
    case "critical_alert":
      return "🚨";
    case "low_soap":
      return "⚠️";
    case "low_battery":
      return "🔋";
    case "offline":
      return "❌";
    case "unusual_activity":
      return "⚡";
    case "refill_confirmed":
      return "✅";
    default:
      return "📝";
  }
}

export function getEventTypeLabel(type: Event["type"]): string {
  switch (type) {
    case "refill":
      return "Refill";
    case "critical_alert":
      return "Critical Alert";
    case "low_soap":
      return "Low Soap";
    case "low_battery":
      return "Low Battery";
    case "offline":
      return "Offline";
    case "unusual_activity":
      return "Unusual Activity";
    case "refill_confirmed":
      return "Refill Confirmed";
    default:
      return "Event";
  }
}
