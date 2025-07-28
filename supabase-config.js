// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table name
const FILES_TABLE = "files"
const STORAGE_BUCKET = "file-shares"

// Utility functions
const utils = {
  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  },

  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleString()
  },

  // Generate unique ID
  generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  },

  // Show toast notification
  showToast(message, type = "success", title = "") {
    const container = document.getElementById("toastContainer")
    const toast = document.createElement("div")
    toast.className = `toast ${type}`

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    }

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <div class="toast-message">${message}</div>
      </div>
    `

    container.appendChild(toast)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 5000)

    // Remove on click
    toast.addEventListener("click", () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    })
  },

  // Show loading overlay
  showLoading(text = "Loading...") {
    const overlay = document.getElementById("loadingOverlay")
    const loadingText = document.getElementById("loadingText")
    if (loadingText) {
      loadingText.textContent = text
    }
    overlay.style.display = "flex"
  },

  // Hide loading overlay
  hideLoading() {
    const overlay = document.getElementById("loadingOverlay")
    overlay.style.display = "none"
  },

  // Get file ID from URL
  getFileIdFromUrl() {
    const path = window.location.pathname
    const segments = path.split("/")
    return segments[segments.length - 1] || segments[segments.length - 2]
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      return true
    }
  },
}

// Theme management
const themeManager = {
  init() {
    const savedTheme = localStorage.getItem("theme") || "light"
    this.setTheme(savedTheme)

    const toggleBtn = document.getElementById("themeToggle")
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleTheme())
    }
  },

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)

    const themeIcon = document.querySelector(".theme-icon")
    if (themeIcon) {
      themeIcon.textContent = theme === "dark" ? "☀️" : "🌙"
    }
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"
    this.setTheme(newTheme)
  },
}

// Initialize theme on page load
document.addEventListener("DOMContentLoaded", () => {
  themeManager.init()
})

// Database schema for reference:
/*
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  download_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read" ON files FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON files FOR INSERT WITH CHECK (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('file-shares', 'file-shares', false);

-- Storage policies
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'file-shares');

CREATE POLICY "Allow public downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'file-shares');
*/
