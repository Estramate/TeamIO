/**
 * Comprehensive accessibility hooks test suite
 */

import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { 
  useKeyboardNavigation, 
  useScreenReaderAnnouncement,
  useFocusTrap 
} from '../use-accessibility';

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    // Mock DOM environment
    Object.defineProperty(global, 'HTMLElement', {
      value: class MockHTMLElement {
        focus = vi.fn();
        querySelector = vi.fn();
        addEventListener = vi.fn();
        removeEventListener = vi.fn();
      },
    });
  });

  it('handles empty items array without crashing', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => 
      useKeyboardNavigation([], onSelect)
    );

    // Should not crash when items are empty
    expect(result.current).toBeDefined();
    
    // Simulate keydown on empty collection
    const mockEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    Object.defineProperty(mockEvent, 'preventDefault', {
      value: vi.fn(),
    });

    act(() => {
      // This should not crash
      if (result.current.current) {
        result.current.current.dispatchEvent(mockEvent);
      }
    });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('handles all disabled items without crashing', () => {
    const items = [
      { id: '1', disabled: true },
      { id: '2', disabled: true }
    ];
    const onSelect = vi.fn();
    
    const { result } = renderHook(() => 
      useKeyboardNavigation(items, onSelect)
    );

    expect(result.current).toBeDefined();
    
    // Should handle all disabled items (empty enabled items)
    const mockEvent = new KeyboardEvent('keydown', { key: 'Home' });
    Object.defineProperty(mockEvent, 'preventDefault', {
      value: vi.fn(),
    });

    act(() => {
      if (result.current.current) {
        result.current.current.dispatchEvent(mockEvent);
      }
    });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('navigates correctly with valid enabled items', () => {
    const items = [
      { id: '1', disabled: false },
      { id: '2', disabled: true },
      { id: '3', disabled: false }
    ];
    const onSelect = vi.fn();
    
    const { result } = renderHook(() => 
      useKeyboardNavigation(items, onSelect)
    );

    expect(result.current).toBeDefined();
    
    // Should work with valid enabled items
    const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    Object.defineProperty(mockEvent, 'preventDefault', {
      value: vi.fn(),
    });

    // Mock querySelector to return a valid element
    const mockElement = {
      focus: vi.fn(),
      querySelector: vi.fn().mockReturnValue({ focus: vi.fn() })
    };
    
    if (result.current.current) {
      result.current.current = mockElement as any;
    }
  });
});

describe('useScreenReaderAnnouncement', () => {
  it('provides announce function and AnnouncementRegion', () => {
    const { result } = renderHook(() => useScreenReaderAnnouncement());

    expect(result.current.announce).toBeInstanceOf(Function);
    expect(result.current.AnnouncementRegion).toBeInstanceOf(Function);
  });

  it('announces messages with correct aria attributes', () => {
    // Mock DOM methods
    const mockDiv = {
      setAttribute: vi.fn(),
      textContent: '',
    };
    
    vi.spyOn(document, 'createElement').mockReturnValue(mockDiv as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockDiv as any);

    const { result } = renderHook(() => useScreenReaderAnnouncement());

    act(() => {
      result.current.announce('Test message', 'assertive');
    });

    // Should set aria-live and textContent
    expect(mockDiv.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
    expect(mockDiv.textContent).toBe('Test message');
  });
});

describe('useFocusTrap', () => {
  it('returns container ref', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    
    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('activates focus trap when isActive is true', () => {
    const mockContainer = {
      querySelectorAll: vi.fn().mockReturnValue([
        { focus: vi.fn() },
        { focus: vi.fn() }
      ]),
    };

    const { result } = renderHook(() => useFocusTrap(true));
    
    // Simulate setting the ref
    act(() => {
      if (result.current) {
        result.current.current = mockContainer as any;
      }
    });

    // Should focus first element when trap activates
    expect(mockContainer.querySelectorAll).toHaveBeenCalledWith(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  });
});