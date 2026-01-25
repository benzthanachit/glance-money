import { render, screen, fireEvent } from '@testing-library/react';
import { ResponsiveLayout } from '@/components/layout/responsive-layout';

// Mock the useResponsive hook
vi.mock('@/lib/hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: true }),
}));

describe('ResponsiveLayout with FAB', () => {
  it('renders FAB by default', () => {
    render(
      <ResponsiveLayout currentPage="home">
        <div>Test content</div>
      </ResponsiveLayout>
    );
    
    const fab = screen.getByRole('button', { name: /add new transaction/i });
    expect(fab).toBeInTheDocument();
  });

  it('calls onAddTransaction when FAB is clicked', () => {
    const mockOnAddTransaction = vi.fn();
    render(
      <ResponsiveLayout currentPage="home" onAddTransaction={mockOnAddTransaction}>
        <div>Test content</div>
      </ResponsiveLayout>
    );
    
    const fab = screen.getByRole('button', { name: /add new transaction/i });
    fireEvent.click(fab);
    
    expect(mockOnAddTransaction).toHaveBeenCalledTimes(1);
  });

  it('hides FAB when showFAB is false', () => {
    render(
      <ResponsiveLayout currentPage="home" showFAB={false}>
        <div>Test content</div>
      </ResponsiveLayout>
    );
    
    const fab = screen.queryByRole('button', { name: /add new transaction/i });
    expect(fab).not.toBeInTheDocument();
  });

  it('logs message when FAB is clicked without handler', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <ResponsiveLayout currentPage="home">
        <div>Test content</div>
      </ResponsiveLayout>
    );
    
    const fab = screen.getByRole('button', { name: /add new transaction/i });
    fireEvent.click(fab);
    
    expect(consoleSpy).toHaveBeenCalledWith('Add transaction clicked - no handler provided');
    
    consoleSpy.mockRestore();
  });

  it('renders main content alongside FAB', () => {
    render(
      <ResponsiveLayout currentPage="home">
        <div data-testid="main-content">Test content</div>
      </ResponsiveLayout>
    );
    
    const content = screen.getByTestId('main-content');
    const fab = screen.getByRole('button', { name: /add new transaction/i });
    
    expect(content).toBeInTheDocument();
    expect(fab).toBeInTheDocument();
  });
});