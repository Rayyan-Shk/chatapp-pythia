import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
}

export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
}

// Message formatting utilities
export function formatMessageContent(content: string): string {
  // Convert markdown-like formatting to HTML
  let formatted = content

  // Bold: **text** -> <strong>text</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Italic: *text* -> <em>text</em>
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')

  // Inline code: `code` -> <code>code</code>
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')

  // Code blocks: ```code``` -> <pre><code>code</code></pre>
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-2 rounded mt-1 overflow-x-auto"><code>$1</code></pre>')

  // Links: auto-link URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g
  formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')

  // Mentions: @username -> styled mention with hover effect
  formatted = formatted.replace(/@(\w+)/g, '<span class="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer" title="Click to view profile">@$1</span>')

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>')

  return formatted
}

export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}

export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content.trim()) {
    return { valid: false, error: "Message cannot be empty" }
  }

  if (content.length > 2000) {
    return { valid: false, error: "Message must be less than 2000 characters" }
  }

  // Check for balanced formatting markers
  const boldCount = (content.match(/\*\*/g) || []).length
  if (boldCount % 2 !== 0) {
    return { valid: false, error: "Unmatched bold formatting (**)" }
  }

  const codeBlockCount = (content.match(/```/g) || []).length
  if (codeBlockCount % 2 !== 0) {
    return { valid: false, error: "Unmatched code block formatting (```)" }
  }

  return { valid: true }
}

// User utilities
export function getUserInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

export function getUserDisplayName(user: { username: string; email?: string }): string {
  return user.username || user.email?.split('@')[0] || 'Unknown User'
}

// Notification utilities
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied')
  }

  return Notification.requestPermission()
}

export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null
  }

  return new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  })
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Local storage utilities with error handling
export function safeLocalStorage() {
  const isAvailable = (() => {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  })()

  return {
    getItem: (key: string): string | null => {
      if (!isAvailable) return null
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key: string, value: string): boolean => {
      if (!isAvailable) return false
      try {
        localStorage.setItem(key, value)
        return true
      } catch {
        return false
      }
    },
    removeItem: (key: string): boolean => {
      if (!isAvailable) return false
      try {
        localStorage.removeItem(key)
        return true
      } catch {
        return false
      }
    },
  }
}
