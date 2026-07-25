"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartPulse, Video, Calendar } from "lucide-react";

export default function TelemedicinePage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Telemedicine</h1>
          <p className="text-gray-500">Virtual consultations and remote patient care</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <HeartPulse className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-500">Consultations Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Video className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-500">Active Providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-500">Upcoming Appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <HeartPulse className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-2xl font-bold">--</p>
            <p className="text-sm text-gray-500">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
        <CardContent className="text-center py-12">
          <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-500">Telemedicine module is being set up</p>
          <p className="text-sm text-gray-400 mt-2">
            Virtual consultations, appointment scheduling, and remote patient management
            will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
