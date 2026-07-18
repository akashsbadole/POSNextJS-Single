"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Package } from "lucide-react";

const plans = [
  {
    name: "Starter", price: "₹999/mo", users: 3, storage: "10,000 medicines",
    features: ["Inventory management", "POS billing", "Basic reports", "Email support"],
    popular: false,
  },
  {
    name: "Professional", price: "₹2,499/mo", users: 10, storage: "50,000 medicines",
    features: ["Everything in Starter", "Online store", "Advanced reports", "Priority support", "API access"],
    popular: true,
  },
  {
    name: "Enterprise", price: "Custom", users: "Unlimited", storage: "Unlimited",
    features: ["Everything in Professional", "Telemedicine", "AI insights", "Dedicated manager", "Custom integrations"],
    popular: false,
  },
];

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-gray-500">Choose the plan that fits your pharmacy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.popular ? "border-pharmacy-500 relative" : ""}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default" className="bg-pharmacy-500">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-3xl font-bold mt-2">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />{plan.users} users</div>
                <div className="flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" />{plan.storage}</div>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className={`w-full ${plan.popular ? "" : "variant-outline"}`}>
                {plan.price === "Custom" ? "Contact Sales" : "Subscribe"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Professional Plan</p>
            <p className="text-sm text-gray-500">Renews on Jan 15, 2026</p>
          </div>
          <Badge variant="success">Active</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
