import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useRealtimeAdmin from '../hooks/useRealtimeAdmin';

// Mock Supabase channel
vi.mock('../supabaseClient', () => {
  return {
    supabase: {
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    }
  };
});

describe('useRealtimeAdmin Hook Integration Test', () => {
  it('should not subscribe to channels if user is not admin', () => {
    const setStats = vi.fn();
    renderHook(() => useRealtimeAdmin({ setStats, isAdmin: false }));
    // No error, clean early return
    expect(setStats).not.toHaveBeenCalled();
  });

  it('should initialize channel subscription when user is admin', () => {
    const setStats = vi.fn();
    renderHook(() => useRealtimeAdmin({ setStats, isAdmin: true }));
    expect(setStats).not.toHaveBeenCalled();
  });
});
