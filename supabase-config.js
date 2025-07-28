// Updated utility and Supabase setup code using modern practices and @supabase/supabase-js v2+

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const FILES_TABLE = "files"
const STORAGE_BUCKET = "file-shares"

const utils = {
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  },

  formatDate(dateString) {
    return new Date(dateString).toLocaleString()
  },

  generateId() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  },

  showToast(message, type = "success", title = "") {
    const container = document.getElementById("toastContainer")
    if (!container) return

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

    setTimeout(() => toast.remove(), 5000)

    toast.addEventListener("click", () => toast.remove())
  },

  showLoading(text = "Loading...") {
    const overlay = document.getElementById("loadingOverlay")
    const loadingText = document.getElementById("loadingText")
    if (overlay) overlay.style.display = "flex"
    if (loadingText) loadingText.textContent = text
  },

  hideLoading() {
    const overlay = document.getElementById("loadingOverlay")
    if (overlay) overlay.style.display = "none"
  },

  getFileIdFromUrl() {
    const segments = window.location.pathname.split("/").filter(Boolean)
    return segments[segments.length - 1]
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
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

document.addEventListener("DOMContentLoaded", () => {
  themeManager.init()
})

export { supabase, utils, themeManager, FILES_TABLE, STORAGE_BUCKET }
