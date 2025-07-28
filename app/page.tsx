"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    shareableLink: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);
    formData.append("expiry", expiry); // ISO format recommended
    formData.append("senderName", senderName);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadResult({ shareableLink: data.shareableLink });
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = async () => {
    if (uploadResult?.shareableLink) {
      try {
        await navigator.clipboard.writeText(uploadResult.shareableLink);
        alert("Link copied to clipboard!");
      } catch (err) {
        alert("Failed to copy link.");
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md space-y-4 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-center text-blue-600">Secure File Upload</h1>

        <input
          type="file"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="text"
          placeholder="Sender Name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input
          type="password"
          placeholder="Set Password (optional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input
          type="datetime-local"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>

        {uploadResult?.shareableLink && (
          <div className="mt-4 p-4 border rounded bg-gray-100">
            <p className="text-sm text-gray-700">Shareable Link:</p>
            <p className="font-mono text-blue-700 break-words">{uploadResult.shareableLink}</p>
            <button
              onClick={handleCopyLink}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Copy Link
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
