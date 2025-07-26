import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleButton } from '../AccessibleButton';

describe('AccessibleButton', () => {
  it('renders with correct text and accessibility attributes', () => {
    render(<AccessibleButton>Test Button</AccessibleButton>);
    
    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<AccessibleButton onClick={handleClick}>Click me</AccessibleButton>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state with spinner', () => {
    render(<AccessibleButton loading>Loading Button</AccessibleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('shows confirmation dialog when requiresConfirmation is true', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(
      <AccessibleButton 
        onClick={handleClick} 
        requiresConfirmation
        confirmationMessage="Are you sure?"
      >
        Delete
      </AccessibleButton>
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Should show confirmation dialog
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    
    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /bestätigen/i });
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<AccessibleButton onClick={handleClick}>Keyboard Test</AccessibleButton>);
    
    const button = screen.getByRole('button');
    await user.tab();
    expect(button).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(<AccessibleButton variant="destructive">Delete</AccessibleButton>);
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
    
    rerender(<AccessibleButton variant="outline">Outline</AccessibleButton>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border-input');
  });

  it('is disabled when disabled prop is true', () => {
    render(<AccessibleButton disabled>Disabled Button</AccessibleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});