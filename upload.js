// Upload page functionality
import { utils } from "./utils" // Import utils
import bcrypt from "bcryptjs" // Import bcrypt
import { supabase } from "./supabaseClient" // Import supabase
const STORAGE_BUCKET = "your-storage-bucket" // Declare STORAGE_BUCKET
const FILES_TABLE = "your-files-table" // Declare FILES_TABLE

class FileUploader {
  constructor() {
    this.selectedFiles = []
    this.isUploading = false
    this.currentLink = null // Declare currentLink
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.updateUI()
  }

  setupEventListeners() {
    // File input and browse button
    const fileInput = document.getElementById("fileInput")
    const browseBtn = document.getElementById("browseBtn")
    const uploadArea = document.getElementById("uploadArea")

    browseBtn.addEventListener("click", () => fileInput.click())
    fileInput.addEventListener("change", (e) => this.handleFileSelect(e))

    // Drag and drop
    uploadArea.addEventListener("dragenter", (e) => this.handleDrag(e))
    uploadArea.addEventListener("dragover", (e) => this.handleDrag(e))
    uploadArea.addEventListener("dragleave", (e) => this.handleDragLeave(e))
    uploadArea.addEventListener("drop", (e) => this.handleDrop(e))

    // Remove file button
    const removeBtn = document.getElementById("removeFile")
    removeBtn.addEventListener("click", () => this.removeFiles())

    // Form inputs
    const passwordInput = document.getElementById("password")
    const expiryInput = document.getElementById("expiryDateTime")

    passwordInput.addEventListener("input", () => this.validateForm())
    expiryInput.addEventListener("input", () => this.validateForm())

    // Set minimum date to current date/time
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    expiryInput.min = now.toISOString().slice(0, 16)

    // Upload button
    const generateBtn = document.getElementById("generateLinkBtn")
    generateBtn.addEventListener("click", () => this.uploadFiles())

    // Success page buttons
    const copyBtn1 = document.getElementById("copyLinkBtn")
    const copyBtn2 = document.getElementById("copyLinkBtn2")
    const uploadAnotherBtn = document.getElementById("uploadAnotherBtn")

    if (copyBtn1) copyBtn1.addEventListener("click", () => this.copyLink())
    if (copyBtn2) copyBtn2.addEventListener("click", () => this.copyLink())
    if (uploadAnotherBtn) uploadAnotherBtn.addEventListener("click", () => this.resetForm())
  }

  handleDrag(e) {
    e.preventDefault()
    e.stopPropagation()

    const uploadArea = document.getElementById("uploadArea")
    uploadArea.classList.add("drag-over")
  }

  handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()

    const uploadArea = document.getElementById("uploadArea")
    uploadArea.classList.remove("drag-over")
  }

  handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()

    const uploadArea = document.getElementById("uploadArea")
    uploadArea.classList.remove("drag-over")

    const files = Array.from(e.dataTransfer.files)
    this.setFiles(files)
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files)
    this.setFiles(files)
  }

  setFiles(files) {
    if (files.length === 0) return

    this.selectedFiles = files
    this.updateUI()
    this.validateForm()
  }

  removeFiles() {
    this.selectedFiles = []
    document.getElementById("fileInput").value = ""
    this.updateUI()
    this.validateForm()
  }

  updateUI() {
    const uploadContent = document.getElementById("uploadContent")
    const filePreview = document.getElementById("filePreview")
    const fileName = document.getElementById("fileName")
    const fileSize = document.getElementById("fileSize")
    const fileCount = document.getElementById("fileCount")

    if (this.selectedFiles.length === 0) {
      uploadContent.style.display = "flex"
      filePreview.style.display = "none"
    } else {
      uploadContent.style.display = "none"
      filePreview.style.display = "flex"

      if (this.selectedFiles.length === 1) {
        const file = this.selectedFiles[0]
        fileName.textContent = file.name
        fileSize.textContent = utils.formatFileSize(file.size)
        fileCount.textContent = ""
      } else {
        fileName.textContent = `${this.selectedFiles.length} files selected`
        const totalSize = this.selectedFiles.reduce((sum, file) => sum + file.size, 0)
        fileSize.textContent = utils.formatFileSize(totalSize)
        fileCount.textContent = `${this.selectedFiles.length} files`
      }
    }
  }

  validateForm() {
    const password = document.getElementById("password").value.trim()
    const expiry = document.getElementById("expiryDateTime").value
    const generateBtn = document.getElementById("generateLinkBtn")
    const formHint = document.getElementById("formHint")

    // Clear previous errors
    document.getElementById("passwordError").textContent = ""
    document.getElementById("expiryError").textContent = ""

    let isValid = true
    const errors = []

    // Check if files are selected
    if (this.selectedFiles.length === 0) {
      isValid = false
      errors.push("Please select at least one file")
    }

    // Validate password
    if (!password) {
      isValid = false
      errors.push("Password is required")
    } else if (password.length < 4) {
      document.getElementById("passwordError").textContent = "Password must be at least 4 characters"
      isValid = false
    }

    // Validate expiry date
    if (!expiry) {
      isValid = false
      errors.push("Expiry date and time is required")
    } else {
      const expiryDate = new Date(expiry)
      const now = new Date()

      if (expiryDate <= now) {
        document.getElementById("expiryError").textContent = "Expiry date must be in the future"
        isValid = false
      }
    }

    // Update UI
    generateBtn.disabled = !isValid || this.isUploading

    if (errors.length > 0 && this.selectedFiles.length > 0) {
      formHint.textContent = errors.join(", ")
      formHint.style.color = "var(--color-error)"
    } else if (!isValid) {
      formHint.textContent = "Please fill in all required fields to enable upload."
      formHint.style.color = "var(--color-text-light)"
    } else {
      formHint.textContent = "Ready to upload!"
      formHint.style.color = "var(--color-success)"
    }

    return isValid
  }

  async uploadFiles() {
    if (!this.validateForm() || this.isUploading) return

    this.isUploading = true
    const generateBtn = document.getElementById("generateLinkBtn")
    const originalText = generateBtn.innerHTML

    try {
      // Update button state
      generateBtn.innerHTML = `
        <div class="spinner" style="width: 1rem; height: 1rem; margin-right: 0.5rem;"></div>
        Uploading...
      `
      generateBtn.disabled = true

      utils.showLoading("Uploading your files...")

      const password = document.getElementById("password").value.trim()
      const expiry = document.getElementById("expiryDateTime").value

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Generate unique file ID
      const fileId = utils.generateId()

      // Upload files to Supabase Storage
      const uploadPromises = this.selectedFiles.map(async (file, index) => {
        const fileName = `${fileId}/${index}_${file.name}`

        const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file)

        if (error) throw error

        return {
          path: data.path,
          name: file.name,
          size: file.size,
        }
      })

      const uploadResults = await Promise.all(uploadPromises)

      // Get public URLs for the files
      const fileUrls = uploadResults.map((result) => {
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(result.path)
        return data.publicUrl
      })

      // Save metadata to database
      const totalSize = this.selectedFiles.reduce((sum, file) => sum + file.size, 0)
      const mainFileName =
        this.selectedFiles.length === 1 ? this.selectedFiles[0].name : `${this.selectedFiles.length} files`

      const { error: dbError } = await supabase.from(FILES_TABLE).insert({
        file_id: fileId,
        filename: mainFileName,
        file_size: totalSize,
        file_url: JSON.stringify(fileUrls), // Store as JSON for multiple files
        password_hash: passwordHash,
        expires_at: expiry,
      })

      if (dbError) throw dbError

      // Show success page
      this.showSuccessPage(fileId, expiry)

      utils.showToast("Files uploaded successfully!", "success", "Upload Complete")
    } catch (error) {
      console.error("Upload error:", error)
      utils.showToast(error.message || "Failed to upload files. Please try again.", "error", "Upload Failed")
    } finally {
      this.isUploading = false
      generateBtn.innerHTML = originalText
      generateBtn.disabled = false
      utils.hideLoading()
    }
  }

  showSuccessPage(fileId, expiry) {
    const uploadContainer = document.getElementById("uploadContainer")
    const successContainer = document.getElementById("successContainer")
    const shareableLink = document.getElementById("shareableLink")
    const expiryInfo = document.getElementById("expiryInfo")

    // Generate shareable link
    const link = `${window.location.origin}/download.html?id=${fileId}`
    shareableLink.value = link
    expiryInfo.textContent = utils.formatDate(expiry)

    // Store link for copying
    this.currentLink = link

    // Switch views
    uploadContainer.style.display = "none"
    successContainer.style.display = "block"

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async copyLink() {
    if (!this.currentLink) return

    try {
      await utils.copyToClipboard(this.currentLink)

      // Update copy button icons
      const copyIcon1 = document.getElementById("copyIcon")
      const copyIcon2 = document.getElementById("copyIcon2")

      if (copyIcon1) copyIcon1.textContent = "✅"
      if (copyIcon2) copyIcon2.textContent = "✅"

      setTimeout(() => {
        if (copyIcon1) copyIcon1.textContent = "📋"
        if (copyIcon2) copyIcon2.textContent = "📋"
      }, 2000)

      utils.showToast("Link copied to clipboard!", "success")
    } catch (error) {
      utils.showToast("Failed to copy link", "error")
    }
  }

  resetForm() {
    // Reset form state
    this.selectedFiles = []
    this.currentLink = null

    // Clear form inputs
    document.getElementById("fileInput").value = ""
    document.getElementById("password").value = ""
    document.getElementById("expiryDateTime").value = ""

    // Reset UI
    this.updateUI()
    this.validateForm()

    // Switch views
    document.getElementById("uploadContainer").style.display = "block"
    document.getElementById("successContainer").style.display = "none"

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
}

// Initialize uploader when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new FileUploader()
})
