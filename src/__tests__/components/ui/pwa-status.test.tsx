import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import PWAStatus from '@/components/ui/pwa-status'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    getRegistration: vi.fn(),
    addEventListener: vi.fn(),
  }
})

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock window.alert
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
})

describe('PWAStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
    
    // Reset matchMedia to not installed
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render PWA status information', async () => {
    // Mock service worker as active
    const mockRegistration = {
      active: { state: 'activated' }
    }
    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(mockRegistration as any)

    render(<PWAStatus />)
    
    expect(screen.getByText('PWA Status')).toBeInTheDocument()
    expect(screen.getByText('Installation')).toBeInTheDocument()
    expect(screen.getByText('Connection')).toBeInTheDocument()
    expect(screen.getByText('Offline Support')).toBeInTheDocument()
  })

  it('should show not installed status when app is not installed', async () => {
    const mockRegistration = {
      active: { state: 'activated' }
    }
    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(mockRegistration as any)

    render(<PWAStatus />)
    
    await waitFor(() => {
      expect(screen.getByText('Not Installed')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Install')).toBeInTheDocument()
  })

  it('should show installed status when app is installed', async () => {
    // Mock standalone mode (installed PWA)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const mockRegistration = {
      active: { state: 'activated' }
    }
    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(mockRegistration as any)

    render(<PWAStatus />)
    
    await waitFor(() => {
      expect(screen.getByText('Installed')).toBeInTheDocument()
    })
    
    expect(screen.getByText('✨ Great! You\'re using Glance Money as an installed app with full offline support.')).toBeInTheDocument()
  })

  it('should show offline status when not connected', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    const mockRegistration = {
      active: { state: 'activated' }
    }
    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(mockRegistration as any)

    render(<PWAStatus />)
    
    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument()
    })
    
    expect(screen.getByText('You\'re offline. Changes are being saved locally and will sync when you reconnect.')).toBeInTheDocument()
  })

  it('should show service worker error when not available', async () => {
    // Mock service worker as not available
    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(null)

    render(<PWAStatus />)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  it('should handle manual install button click', async () => {
    const mockRegistration = {
      active: { state: 'activated' }
    }
    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(mockRegistration as any)

    render(<PWAStatus />)
    
    await waitFor(() => {
      expect(screen.getByText('Install')).toBeInTheDocument()
    })
    
    const installButton = screen.getByText('Install')
    fireEvent.click(installButton)
    
    expect(window.alert).toHaveBeenCalled()
  })

  it('should show active service worker status', async () => {
    const mockRegistration = {
      active: { state: 'activated' }
    }
    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(mockRegistration as any)

    render(<PWAStatus />)
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })
})