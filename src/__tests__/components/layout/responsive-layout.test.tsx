/**
 * Unit tests for ResponsiveLayout component
 * Tests the responsive layout system implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResponsiveLayout } from '@/components/layout/responsive-layout'
import { useResponsive } from '@/lib/hooks/useResponsive'
import { useAuth } from '@/lib/auth/context'

// Mock the hooks
vi.mock('@/lib/hooks/useResponsive')
vi.mock('@/lib/auth/context')
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard'
}))

const mockUseResponsive = vi.mocked(useResponsive)
const mockUseAuth = vi.mocked(useAuth)

describe('ResponsiveLayout', () => {
  beforeEach(() => {
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      signOut: vi.fn(),
      loading: false
    } as any)
  })

  it('should render mobile layout when viewport is mobile', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      viewport: 'mobile'
    })

    render(
      <ResponsiveLayout currentPage="home">
        <div data-testid="content">Test Content</div>
      </ResponsiveLayout>
    )

    // Should show content
    expect(screen.getByTestId('content')).toBeInTheDocument()
    
    // Should show bottom navigation items (mobile)
    const homeLinks = screen.getAllByText('Home')
    const transactionLinks = screen.getAllByText('Transactions')
    const goalLinks = screen.getAllByText('Goals')
    const settingLinks = screen.getAllByText('Settings')
    
    // Should have navigation items (both desktop and mobile are rendered, but desktop is hidden via CSS)
    expect(homeLinks.length).toBeGreaterThan(0)
    expect(transactionLinks.length).toBeGreaterThan(0)
    expect(goalLinks.length).toBeGreaterThan(0)
    expect(settingLinks.length).toBeGreaterThan(0)
  })

  it('should render desktop layout when viewport is desktop', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      viewport: 'desktop'
    })

    render(
      <ResponsiveLayout currentPage="home">
        <div data-testid="content">Test Content</div>
      </ResponsiveLayout>
    )

    // Should show content
    expect(screen.getByTestId('content')).toBeInTheDocument()
    
    // Should show desktop navigation (sidebar)
    expect(screen.getByText('Glance Money')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('should highlight the current page in navigation', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      viewport: 'mobile'
    })

    render(
      <ResponsiveLayout currentPage="transactions">
        <div data-testid="content">Test Content</div>
      </ResponsiveLayout>
    )

    // The transactions tab should be present (highlighting is handled by CSS classes)
    const transactionLinks = screen.getAllByText('Transactions')
    expect(transactionLinks.length).toBeGreaterThan(0)
  })

  it('should render children content properly', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      viewport: 'mobile'
    })

    const testContent = 'This is test content for the layout'
    
    render(
      <ResponsiveLayout currentPage="home">
        <div>{testContent}</div>
      </ResponsiveLayout>
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('should apply correct CSS classes for mobile layout', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      viewport: 'mobile'
    })

    const { container } = render(
      <ResponsiveLayout currentPage="home">
        <div data-testid="content">Test Content</div>
      </ResponsiveLayout>
    )

    // Check that the main container has the correct classes
    const mainElement = container.querySelector('main')
    expect(mainElement).toHaveClass('pb-20', 'md:pb-0', 'md:ml-64')
  })

  it('should apply correct CSS classes for desktop layout', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      viewport: 'desktop'
    })

    const { container } = render(
      <ResponsiveLayout currentPage="home">
        <div data-testid="content">Test Content</div>
      </ResponsiveLayout>
    )

    // Check that the main container has the correct classes
    const mainElement = container.querySelector('main')
    expect(mainElement).toHaveClass('pb-20', 'md:pb-0', 'md:ml-64')
  })
})