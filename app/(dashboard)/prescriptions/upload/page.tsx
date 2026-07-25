"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Camera,
  X,
  Loader2,
} from "lucide-react";

export default function PrescriptionUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);
    const newPreviews = acceptedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, [files]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please upload a prescription first");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("image", files[0]);

      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: URL.createObjectURL(files[0]),
          status: "PENDING",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      toast.success("Prescription uploaded successfully");
      router.push("/prescriptions/process");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescription Upload</h1>
          <p className="text-gray-500 dark:text-gray-400">Upload and manage digital prescriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Prescription</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-pharmacy-400 transition-colors cursor-pointer"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*,.pdf";
                  input.multiple = true;
                  input.onchange = () => {
                    if (input.files?.length) onDrop(Array.from(input.files));
                  };
                  input.click();
                }}
              >
                <Upload className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-sm text-gray-500">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports JPEG, PNG, PDF (max 10MB)
                </p>
              </div>

              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previews.map((preview, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={preview}
                        alt={`Upload ${i + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(i)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleUpload} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload & Process
                  </Button>
                  <Button variant="outline" onClick={() => { setFiles([]); setPreviews([]); }}>
                    <X className="w-4 h-4 mr-2" />Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.capture = "environment";
                input.onchange = () => {
                  if (input.files?.length) onDrop(Array.from(input.files));
                };
                input.click();
              }}>
                <Camera className="w-4 h-4 mr-2" />Take Photo
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/prescriptions/process")}>
                <FileText className="w-4 h-4 mr-2" />View All Prescriptions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-center">ABDM Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-500">Coming in a future update</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" disabled>
                Link ABDM Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
