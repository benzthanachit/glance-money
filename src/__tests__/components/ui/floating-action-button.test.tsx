import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { TOUCH_TARGET_MIN_HEIGHT } from '@/lib/constants';

describe('FloatingActionButton', () => {
  it('renders with default props', () => {
    const mockOnClick = vi.fn();
    render(<FloatingActionButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /add transaction/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('fixed', 'z-40', 'rounded-full');
  });

  it('calls onClick handler when clicked', () => {
    const mockOnClick = vi.fn();
    render(<FloatingActionButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('meets minimum touch target height requirement', () => {
    const mockOnClick = vi.fn();
    render(<FloatingActionButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /add transaction/i });
    const styles = window.getComputedStyle(button);
    
    // Check that minHeight is set correctly
    expect(button).toHaveStyle(`min-height: ${TOUCH_TARGET_MIN_HEIGHT}px`);
  });

  it('applies correct positioning classes for center-bottom', () => {
    const mockOnClick = vi.fn();
    render(<FloatingActionButton onClick={mockOnClick} position="center-bottom" />);
    
    const button = screen.getByRole('button', { name: /add transaction/i });
    expect(button).toHaveClass('bottom-24', 'left-1/2', '-translate-x-1/2');
  });

  it('applies correct positioning classes for bottom-right', () => {
    const mockOnClick = vi.fn();
    render(<FloatingActionButton onClick={mockOnClick} position="bottom-right" />);
    
    const button = screen.getByRole('button', { name: /add transaction/i });
    expect(button).toHaveClass('bottom-8', 'right-8');
  });

  it('applies primary variant styles by default', () => {
    const mockOnClick = vi.fn();
    render(<FloatingActionButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /add transaction/i });
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('applies secondary variant styles when specified', () => {
    const mockOnClick = vi.fn();
    render(<FloatingActionButton onClick={mockOnClick} variant="secondary" />);
    
    const button = screen.getByRole('button', { name: /add transaction/i });
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnClick = vi.fn();
    render(<FloatingActionButton onClick={mockOnClick} disabled />);
    
    const button = screen.getByRole('button', { name: /add transaction/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('uses custom aria-label when provided', () => {
    const mockOnClick = vi.fn();
    const customLabel = 'Custom add button';
    render(<FloatingActionButton onClick={mockOnClick} aria-label={customLabel} />);
    
    const button = screen.getByRole('button', { name: customLabel });
    expect(button).toBeInTheDocument();
  });

  it('includes Plus icon', () => {
    const mockOnClick = vi.fn();
    render(<FloatingActionButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /add transaction/i });
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});