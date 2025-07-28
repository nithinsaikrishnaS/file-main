"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, Copy, Check, Calendar, Lock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { FontLoader } from "@/components/font-loader"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [expiryTime, setExpiryTime] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    fileId: string
    shareableLink: string
    expiryDateTime: string
  } | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isFormValid = () => {
    return file && password.trim() && expiryDate && expiryTime
  }

  const handleUpload = async () => {
    if (!isFormValid()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create expiry datetime
      const expiryDateTime = new Date(`${expiryDate}T${expiryTime}`)

      // Check if expiry is in the future
      if (expiryDateTime <= new Date()) {
        toast({
          title: "Invalid Expiry",
          description: "Expiry date and time must be in the future.",
          variant: "destructive",
        })
        setIsUploading(false)
        return
      }

      // Generate unique file ID
      const fileId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const shareableLink = `${window.location.origin}/download/${fileId}`

      setUploadResult({
        fileId,
        shareableLink,
        expiryDateTime: expiryDateTime.toLocaleString(),
      })

      toast({
        title: "Upload Successful!",
        description: "Your file has been uploaded and secured.",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = async () => {
    if (uploadResult) {
      await navigator.clipboard.writeText(uploadResult.shareableLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Link Copied!",
        description: "The shareable link has been copied to your clipboard.",
      })
    }
  }

  const resetForm = () => {
    setFile(null)
    setPassword("")
    setExpiryDate("")
    setExpiryTime("")
    setUploadResult(null)
    setCopied(false)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAF9EE] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A2AF9B]"></div>
      </div>
    )
  }

  if (uploadResult) {
    return (
      <FontLoader>
        <div className="min-h-screen bg-[#FAF9EE] no-hydration-mismatch">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#A2AF9B] font-sans">DropShare</h1>
                <nav>
                  <Button variant="ghost" onClick={resetForm} className="font-sans">
                    Upload Another
                  </Button>
                </nav>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[#A2AF9B]">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-sans">Upload Successful!</CardTitle>
                  <CardDescription className="font-sans">
                    Your file has been securely uploaded and is ready to share.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-[#EEEEEE]">
                    <Label className="text-sm font-medium text-gray-600 font-sans">Shareable Link</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input value={uploadResult.shareableLink} readOnly className="font-mono text-sm" />
                      <Button
                        onClick={copyToClipboard}
                        size="sm"
                        className={`shrink-0 ${copied ? "bg-[#A2AF9B]" : "bg-[#DCCFC0]"} font-sans`}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-[#EEEEEE]">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-[#A2AF9B]" />
                        <Label className="text-sm font-medium font-sans">Password Protected</Label>
                      </div>
                      <p className="text-sm text-gray-600 font-sans">This file is protected with a password.</p>
                    </div>

                    <div className="p-4 rounded-lg bg-[#EEEEEE]">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-[#A2AF9B]" />
                        <Label className="text-sm font-medium font-sans">Expires</Label>
                      </div>
                      <p className="text-sm text-gray-600 font-sans">{uploadResult.expiryDateTime}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={copyToClipboard} className="flex-1 bg-[#A2AF9B] font-sans">
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button onClick={resetForm} variant="outline" className="flex-1 bg-transparent font-sans">
                      Upload Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </FontLoader>
    )
  }

  return (
    <FontLoader>
      <div className="min-h-screen bg-[#FAF9EE] no-hydration-mismatch">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#A2AF9B] font-sans">DropShare</h1>
              <nav>
                <Button variant="ghost" className="font-sans">
                  Home
                </Button>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-[#A2AF9B] font-sans">Share Files Securely</h2>
              <p className="text-gray-600 font-sans">
                Upload files with password protection and expiry dates. No account required.
              </p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="font-sans">Upload Your File</CardTitle>
                <CardDescription className="font-sans">
                  Drag and drop your file or browse to select. Set a password and expiry date for security.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload Section */}
                <div>
                  <Label className="text-sm font-medium mb-2 block font-sans">Select File</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? "border-[#A2AF9B] bg-[#A2AF9B]/5" : "border-gray-300 hover:border-[#A2AF9B]"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {file ? (
                      <div className="space-y-2">
                        <FileText className="w-12 h-12 mx-auto text-[#A2AF9B]" />
                        <p className="font-medium font-sans">{file.name}</p>
                        <p className="text-sm text-gray-500 font-sans">{formatFileSize(file.size)}</p>
                        <Button variant="outline" size="sm" onClick={() => setFile(null)} className="font-sans">
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 mx-auto text-[#A2AF9B]" />
                        <div>
                          <p className="text-lg font-medium mb-2 font-sans">Drop your file here</p>
                          <p className="text-gray-500 mb-4 font-sans">or</p>
                          <input type="file" onChange={handleFileSelect} className="hidden" id="file-input" />
                          <Button asChild className="bg-[#DCCFC0] text-gray-700 font-sans">
                            <label htmlFor="file-input" className="cursor-pointer">
                              Browse Files
                            </label>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Section */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium mb-2 block font-sans">
                      Set Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry-date" className="text-sm font-medium mb-2 block font-sans">
                        Expiry Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="expiry-date"
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="font-sans"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiry-time" className="text-sm font-medium mb-2 block font-sans">
                        Expiry Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="expiry-time"
                        type="time"
                        value={expiryTime}
                        onChange={(e) => setExpiryTime(e.target.value)}
                        className="font-sans"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!isFormValid() || isUploading}
                  className="w-full bg-[#A2AF9B] font-sans"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Generate Secure Link
                    </>
                  )}
                </Button>

                {!isFormValid() && (
                  <p className="text-sm text-gray-500 text-center font-sans">
                    Please fill in all required fields to enable upload.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </FontLoader>
  )
}
