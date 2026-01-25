import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/lib/contexts/theme-context';

// Test component to access theme context
function TestComponent() {
  const { netStatusTheme, setNetStatusTheme, isTransitioning } = useTheme();
  
  return (
    <div>
      <span data-testid="theme">{netStatusTheme}</span>
      <span data-testid="transitioning">{isTransitioning.toString()}</span>
      <button 
        data-testid="set-positive" 
        onClick={() => setNetStatusTheme('positive')}
      >
        Set Positive
      </button>
      <button 
        data-testid="set-negative" 
        onClick={() => setNetStatusTheme('negative')}
      >
        Set Negative
      </button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    // Reset document classes before each test
    document.documentElement.className = '';
  });

  it('provides default positive theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('positive');
    expect(screen.getByTestId('transitioning')).toHaveTextContent('false');
  });

  it('allows setting custom default theme', () => {
    render(
      <ThemeProvider defaultTheme="negative">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('negative');
  });

  it('changes theme and triggers transition', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setNegativeButton = screen.getByTestId('set-negative');
    
    act(() => {
      setNegativeButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('negative');
    expect(screen.getByTestId('transitioning')).toHaveTextContent('true');

    // Wait for transition to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    expect(screen.getByTestId('transitioning')).toHaveTextContent('false');
  });

  it('applies CSS classes to document root', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('theme-positive')).toBe(true);

    const setNegativeButton = screen.getByTestId('set-negative');
    
    act(() => {
      setNegativeButton.click();
    });

    expect(document.documentElement.classList.contains('theme-negative')).toBe(true);
    expect(document.documentElement.classList.contains('theme-positive')).toBe(false);
  });

  it('does not trigger transition for same theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setPositiveButton = screen.getByTestId('set-positive');
    
    act(() => {
      setPositiveButton.click();
    });

    // Should remain false since we're setting the same theme
    expect(screen.getByTestId('transitioning')).toHaveTextContent('false');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});