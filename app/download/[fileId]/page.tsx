"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Lock, Download, AlertCircle, FileText, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface FileData {
  fileId: string
  originalName: string
  fileSize: number
  expiryDate: string
  isExpired: boolean
}

export default function DownloadPage() {
  const params = useParams()
  const fileId = params.fileId as string
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [error, setError] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch file metadata when component mounts
    fetchFileData()
  }, [fileId])

  const fetchFileData = async () => {
    try {
      // TODO: Replace with actual Supabase query
      /*
      const { data, error } = await supabase
        .from('file_shares')
        .select('*')
        .eq('file_id', fileId)
        .single()
      
      if (error) throw error
      
      const isExpired = new Date(data.expiry_date) <= new Date()
      
      setFileData({
        fileId: data.file_id,
        originalName: data.original_name,
        fileSize: data.file_size,
        expiryDate: data.expiry_date,
        isExpired
      })
      */

      // Simulate API call for demo
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock data - replace with actual Supabase data
      const mockExpiryDate = new Date()
      mockExpiryDate.setHours(mockExpiryDate.getHours() + 24) // 24 hours from now

      setFileData({
        fileId,
        originalName: "example-document.pdf",
        fileSize: 2048576, // 2MB
        expiryDate: mockExpiryDate.toISOString(),
        isExpired: false,
      })
    } catch (error) {
      console.error("Error fetching file data:", error)
      setError("File not found or has been removed.")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError("Please enter the password.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // TODO: Replace with actual password verification
      /*
      const { data, error } = await supabase
        .from('file_shares')
        .select('password_hash')
        .eq('file_id', fileId)
        .single()
      
      if (error) throw error
      
      const isValidPassword = await bcrypt.compare(password, data.password_hash)
      */

      // Simulate password check for demo
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // For demo, accept any password that's at least 3 characters
      const isValidPassword = password.length >= 3

      if (isValidPassword) {
        setIsUnlocked(true)
        toast({
          title: "Access Granted!",
          description: "You can now download the file.",
        })
      } else {
        setError("Incorrect password. Please try again.")
      }
    } catch (error) {
      console.error("Error verifying password:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      // TODO: Replace with actual Supabase Storage download
      /*
      const { data, error } = await supabase.storage
        .from('files')
        .download(`${fileId}/${fileData?.originalName}`)
      
      if (error) throw error
      
      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileData?.originalName || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      */

      // Simulate download for demo
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Download Started",
        description: "Your file download has begun.",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Failed",
        description: "There was an error downloading the file.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (!fileData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF9EE" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#A2AF9B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading file information...</p>
        </div>
      </div>
    )
  }

  if (error && !fileData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAF9EE" }}>
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold" style={{ color: "#A2AF9B" }}>
              DropShare
            </h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <h2 className="text-xl font-semibold mb-2">File Not Found</h2>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={() => (window.location.href = "/")} style={{ backgroundColor: "#A2AF9B" }}>
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (fileData.isExpired) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAF9EE" }}>
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold" style={{ color: "#A2AF9B" }}>
              DropShare
            </h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                  <h2 className="text-xl font-semibold mb-2">Link Expired</h2>
                  <p className="text-gray-600 mb-4">
                    This file link has expired and is no longer available for download.
                  </p>
                  <Button onClick={() => (window.location.href = "/")} style={{ backgroundColor: "#A2AF9B" }}>
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF9EE" }}>
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold" style={{ color: "#A2AF9B" }}>
            DropShare
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isUnlocked ? "#A2AF9B" : "#DCCFC0" }}
              >
                {isUnlocked ? <FileText className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
              </div>
              <CardTitle className="text-xl">
                {isUnlocked ? "File Ready for Download" : "Password Protected File"}
              </CardTitle>
              <CardDescription>
                {isUnlocked
                  ? "Click the download button below to get your file."
                  : "Enter the password to access this file."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* File Information */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#EEEEEE" }}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">File Name:</span>
                    <span className="text-sm font-mono">{fileData.originalName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Size:</span>
                    <span className="text-sm">{formatFileSize(fileData.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Expires:</span>
                    <span className="text-sm">{new Date(fileData.expiryDate).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!isUnlocked ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium mb-2 block">
                      Enter Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter the file password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleUnlock()}
                      className="w-full"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleUnlock}
                    disabled={isLoading || !password.trim()}
                    className="w-full"
                    style={{ backgroundColor: "#A2AF9B" }}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Unlock File
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>File unlocked successfully! You can now download it.</AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full"
                    style={{ backgroundColor: "#A2AF9B" }}
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="text-center">
                <Button variant="ghost" onClick={() => (window.location.href = "/")} className="text-sm">
                  Upload your own file
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
