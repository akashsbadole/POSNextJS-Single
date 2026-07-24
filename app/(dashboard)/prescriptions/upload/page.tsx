"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Camera,
  X,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  ScanLine,
} from "lucide-react";

export default function PrescriptionUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

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

  const processOCR = async () => {
    if (files.length === 0) {
      toast.error("Please upload a prescription first");
      return;
    }

    setIsProcessing(true);
    // Simulate OCR processing
    setTimeout(() => {
      setOcrResult(`PRESCRIPTION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━

Doctor: Dr. Rajesh Sharma (RMP: 12345)
Clinic: City Health Care, Mumbai
Date: 2026-07-18

PATIENT: Rahul Sharma, Age: 34

MEDICINES PRESCRIBED:
1. Paracetamol 500mg - 1 tab TDS × 5 days
2. Amoxicillin 250mg - 1 cap BD × 7 days  
3. Vitamin D3 60K - 1 cap weekly × 4 weeks

NOTES: Take after meals. Drink plenty of water.

✅ All medicines available in stock
⚠️ Amoxicillin requires prescription verification`);
      setIsProcessing(false);
      toast.success("Prescription processed successfully!");
    }, 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescription Upload</h1>
          <p className="text-gray-500 dark:text-gray-400">Upload and process digital prescriptions</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <ScanLine className="w-3 h-3" />
          OCR Enabled
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Prescription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-pharmacy-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-input")?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFiles = Array.from(e.dataTransfer.files);
                  onDrop(droppedFiles);
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && onDrop(Array.from(e.target.files))}
                />
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm font-medium">Drop files here or click to upload</p>
                <p className="text-xs text-gray-500 mt-1">Supports PDF, JPEG, PNG (max 10MB)</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Uploaded Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      {previews[index] ? (
                        <img src={previews[index]} alt="" className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <FileText className="w-8 h-8 text-gray-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFile(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Processing & Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="w-5 h-5" />
                OCR Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={processOCR}
                disabled={isProcessing || files.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing with Tesseract.js...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4 mr-2" />
                    Extract Text (OCR)
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-pharmacy-500 animate-pulse rounded-full" style={{ width: "60%" }}></div>
                  </div>
                  <p className="text-xs text-center text-gray-500">Analyzing prescription image...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {ocrResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Extracted Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {ocrResult}
                </pre>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full
                  </Button>
                  <Button size="sm" className="flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify & Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ABDM Integration */}
          <Card className="border-pharmacy-200 dark:border-pharmacy-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-pharmacy-500" />
                ABDM Integration (Phase 2)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Connect with Ayushman Bharat Digital Mission for e-prescription validation and digital health records.
              </p>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                Link ABDM Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
