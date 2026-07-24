import { prisma } from "@/lib/db";

export type FeatureKey =
  | "online_store"
  | "subscriptions"
  | "analytics"
  | "telemedicine"
  | "scheme_management"
  | "promise_orders"
  | "whatsapp_notifications"
  | "custom_fields";

const FEATURE_KEYS: FeatureKey[] = [
  "online_store",
  "subscriptions",
  "analytics",
  "telemedicine",
  "scheme_management",
  "promise_orders",
  "whatsapp_notifications",
  "custom_fields",
];

export async function getEnabledFeatures() {
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: FEATURE_KEYS.map((k) => `feature_${k}`) },
    },
  });

  const map = new Map<string, string>();
  for (const s of settings) {
    map.set(s.key, s.value);
  }

  const enabled: Record<FeatureKey, boolean> = {
    online_store: map.get("feature_online_store") === "enabled",
    subscriptions: map.get("feature_subscriptions") === "enabled",
    analytics: map.get("feature_analytics") === "enabled",
    telemedicine: map.get("feature_telemedicine") === "enabled",
    scheme_management: map.get("feature_scheme_management") === "enabled",
    promise_orders: map.get("feature_promise_orders") === "enabled",
    whatsapp_notifications: map.get("feature_whatsapp_notifications") === "enabled",
    custom_fields: map.get("feature_custom_fields") === "enabled",
  };

  return enabled;
}

export async function isFeatureEnabled(key: FeatureKey) {
  const features = await getEnabledFeatures();
  return features[key];
}
