"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";

export default function PlaceholderPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page Under Development</h1>
        <p className="text-gray-500 dark:text-gray-400">This feature is coming soon</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Construction className="w-16 h-16 mx-auto text-pharmacy-500 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">Feature in Progress</p>
          <p className="text-sm text-gray-500 mt-2">This module is being implemented as part of the complete pharmacy management system.</p>
          <Badge variant="outline" className="mt-4">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
