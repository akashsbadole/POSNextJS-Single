"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HeartPulse, Video, Calendar, Clock, User, Stethoscope,
  Phone, MessageCircle,
} from "lucide-react";

// ponytail: demo-only UI — no schema, no API, no real data. Remove when telemedicine is spec'd.
export default function TelemedicinePage() {
  const appointments = [
    { id: 1, patient: "Rahul Sharma", doctor: "Dr. Priya Patel", time: "2:30 PM Today", type: "Video", status: "confirmed" },
    { id: 2, patient: "Sneha Gupta", doctor: "Dr. Amit Kumar", time: "11:00 AM Tomorrow", type: "Audio", status: "pending" },
    { id: 3, patient: "Vikram Singh", doctor: "Dr. Priya Patel", time: "Completed", type: "Video", status: "completed" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Telemedicine</h1>
          <p className="text-gray-500">Virtual consultations and remote patient care</p>
        </div>
        <Badge variant="secondary" className="text-xs">Demo</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Appointments", value: "8", icon: Calendar, color: "text-pharmacy-500" },
          { label: "Total Doctors", value: "12", icon: Stethoscope, color: "text-blue-500" },
          { label: "Patients Served", value: "1,247", icon: User, color: "text-green-500" },
          { label: "Avg Rating", value: "4.8 ★", icon: HeartPulse, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{s.label}</p>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Badge variant="outline">Today</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pharmacy-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-pharmacy-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.patient}</p>
                    <p className="text-xs text-gray-500">{a.doctor}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{a.time}</span>
                      <Badge variant="outline" className="text-xs">{a.type}</Badge>
                    </div>
                  </div>
                </div>
                <Badge variant={a.status === "confirmed" ? "success" : a.status === "completed" ? "secondary" : "warning"}>
                  {a.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Start Video Call", icon: Video, color: "bg-green-50 text-green-600" },
                { label: "Audio Consultation", icon: Phone, color: "bg-blue-50 text-blue-600" },
                { label: "Chat with Patient", icon: MessageCircle, color: "bg-pharmacy-50 text-pharmacy-600" },
                { label: "Schedule Appointment", icon: Calendar, color: "bg-amber-50 text-amber-600" },
              ].map((action) => (
                <Button key={action.label} variant="outline" className="h-24 flex-col gap-2">
                  <div className={`w-10 h-10 rounded-lg ${action.color.split(" ")[0]} flex items-center justify-center`}>
                    <action.icon className={`w-5 h-5 ${action.color.split(" ")[1]}`} />
                  </div>
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
