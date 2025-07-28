// Download page functionality
import { supabase } from "./path/to/supabase" // Import supabase
import { FILES_TABLE } from "./path/to/constants" // Import FILES_TABLE
import { utils } from "./path/to/utils" // Import utils
import bcrypt from "bcryptjs" // Import bcrypt

class FileDownloader {
  constructor() {
    this.fileData = null
    this.isUnlocked = false
    this.init()
  }

  init() {
    this.fileId = this.getFileIdFromUrl()
    if (!this.fileId) {
      this.showError("Invalid download link")
      return
    }

    this.setupEventListeners()
    this.loadFileData()
  }

  getFileIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("id")
  }

  setupEventListeners() {
    const unlockBtn = document.getElementById("unlockBtn")
    const downloadBtn = document.getElementById("downloadBtn")
    const passwordInput = document.getElementById("downloadPassword")

    if (unlockBtn) {
      unlockBtn.addEventListener("click", () => this.unlockFile())
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => this.downloadFile())
    }

    if (passwordInput) {
      passwordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.unlockFile()
        }
      })
    }
  }

  async loadFileData() {
    try {
      // Fetch file metadata from database
      const { data, error } = await supabase.from(FILES_TABLE).select("*").eq("file_id", this.fileId).single()

      if (error || !data) {
        this.showError("File not found or has been removed")
        return
      }

      this.fileData = data

      // Check if file has expired
      const now = new Date()
      const expiryDate = new Date(data.expires_at)

      if (expiryDate <= now) {
        this.showExpired()
        return
      }

      // Show password prompt
      this.showPasswordPrompt()
    } catch (error) {
      console.error("Error loading file data:", error)
      this.showError("Failed to load file information")
    }
  }

  showPasswordPrompt() {
    const loadingCard = document.getElementById("loadingCard")
    const passwordCard = document.getElementById("passwordCard")
    const fileNameDisplay = document.getElementById("fileNameDisplay")
    const fileSizeDisplay = document.getElementById("fileSizeDisplay")
    const fileExpiryDisplay = document.getElementById("fileExpiryDisplay")

    // Hide loading, show password prompt
    loadingCard.style.display = "none"
    passwordCard.style.display = "block"

    // Populate file information
    fileNameDisplay.textContent = this.fileData.filename
    fileSizeDisplay.textContent = utils.formatFileSize(this.fileData.file_size)
    fileExpiryDisplay.textContent = utils.formatDate(this.fileData.expires_at)

    // Focus password input
    setTimeout(() => {
      const passwordInput = document.getElementById("downloadPassword")
      if (passwordInput) passwordInput.focus()
    }, 100)
  }

  showError(message) {
    const loadingCard = document.getElementById("loadingCard")
    const notFoundCard = document.getElementById("notFoundCard")
    const errorText = notFoundCard.querySelector(".error-text")

    loadingCard.style.display = "none"
    notFoundCard.style.display = "block"
    errorText.textContent = message
  }

  showExpired() {
    const loadingCard = document.getElementById("loadingCard")
    const expiredCard = document.getElementById("expiredCard")

    loadingCard.style.display = "none"
    expiredCard.style.display = "block"
  }

  async unlockFile() {
    const passwordInput = document.getElementById("downloadPassword")
    const password = passwordInput.value.trim()
    const passwordError = document.getElementById("passwordError")
    const unlockBtn = document.getElementById("unlockBtn")

    // Clear previous errors
    passwordError.textContent = ""

    if (!password) {
      passwordError.textContent = "Please enter the password"
      return
    }

    // Show loading state
    const originalText = unlockBtn.innerHTML
    unlockBtn.innerHTML = `
      <div class="spinner" style="width: 1rem; height: 1rem; margin-right: 0.5rem;"></div>
      Verifying...
    `
    unlockBtn.disabled = true

    utils.showLoading("Verifying password...")

    try {
      // Verify password
      const isValidPassword = await bcrypt.compare(password, this.fileData.password_hash)

      if (!isValidPassword) {
        passwordError.textContent = "Incorrect password. Please try again."
        return
      }

      // Password is correct, show download section
      this.showDownloadSection()
      utils.showToast("File unlocked successfully!", "success")
    } catch (error) {
      console.error("Password verification error:", error)
      passwordError.textContent = "An error occurred. Please try again."
    } finally {
      unlockBtn.innerHTML = originalText
      unlockBtn.disabled = false
      utils.hideLoading()
    }
  }

  showDownloadSection() {
    const passwordSection = document.getElementById("passwordSection")
    const downloadSection = document.getElementById("downloadSection")
    const downloadIcon = document.getElementById("downloadIcon")
    const cardTitle = document.getElementById("cardTitle")
    const cardDescription = document.getElementById("cardDescription")

    // Update UI
    passwordSection.style.display = "none"
    downloadSection.style.display = "block"
    downloadIcon.textContent = "📄"
    cardTitle.textContent = "File Ready for Download"
    cardDescription.textContent = "Click the download button below to get your file."

    this.isUnlocked = true
  }

  async downloadFile() {
    if (!this.isUnlocked) return

    const downloadBtn = document.getElementById("downloadBtn")
    const originalText = downloadBtn.innerHTML

    try {
      downloadBtn.innerHTML = `
        <div class="spinner" style="width: 1rem; height: 1rem; margin-right: 0.5rem;"></div>
        Downloading...
      `
      downloadBtn.disabled = true

      // Parse file URLs (could be single URL or JSON array)
      let fileUrls
      try {
        fileUrls = JSON.parse(this.fileData.file_url)
      } catch {
        fileUrls = [this.fileData.file_url]
      }

      // If single file, download directly
      if (fileUrls.length === 1) {
        await this.downloadSingleFile(fileUrls[0], this.fileData.filename)
      } else {
        // Multiple files - create zip or download individually
        await this.downloadMultipleFiles(fileUrls)
      }

      // Update download count
      await supabase
        .from(FILES_TABLE)
        .update({
          download_count: (this.fileData.download_count || 0) + 1,
        })
        .eq("file_id", this.fileId)

      utils.showToast("Download started successfully!", "success")
    } catch (error) {
      console.error("Download error:", error)
      utils.showToast("Failed to download file", "error")
    } finally {
      downloadBtn.innerHTML = originalText
      downloadBtn.disabled = false
    }
  }

  async downloadSingleFile(url, filename) {
    // Create a temporary link and trigger download
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async downloadMultipleFiles(urls) {
    // For multiple files, download each one individually
    // In a production app, you might want to create a zip file
    for (let i = 0; i < urls.length; i++) {
      const link = document.createElement("a")
      link.href = urls[i]
      link.download = `file_${i + 1}`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Small delay between downloads
      if (i < urls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }
}

// Initialize downloader when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new FileDownloader()
})
