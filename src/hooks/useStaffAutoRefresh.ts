import { useEffect, useRef } from 'react';

interface UseStaffAutoRefreshOptions {
  refreshInterval: number; // in milliseconds
  onRefresh: () => void | Promise<void>;
  enabled?: boolean;
}

/**
 * Custom hook for auto-refreshing staff pages with real-time data
 * @param options Configuration options for auto-refresh
 */
export const useStaffAutoRefresh = ({
  refreshInterval,
  onRefresh,
  enabled = true
}: UseStaffAutoRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isEnabledRef = useRef(enabled);

  // Update enabled state
  useEffect(() => {
    isEnabledRef.current = enabled;
  }, [enabled]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!enabled) return;

    // Initial refresh
    onRefresh();

    // Set up interval for subsequent refreshes
    intervalRef.current = setInterval(() => {
      if (isEnabledRef.current) {
        onRefresh();
      }
    }, refreshInterval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshInterval, onRefresh, enabled]);

  // Manual refresh function
  const refreshNow = () => {
    onRefresh();
  };

  // Stop auto-refresh
  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Start auto-refresh
  const startAutoRefresh = () => {
    if (!intervalRef.current && isEnabledRef.current) {
      intervalRef.current = setInterval(() => {
        if (isEnabledRef.current) {
          onRefresh();
        }
      }, refreshInterval);
    }
  };

  return {
    refreshNow,
    stopAutoRefresh,
    startAutoRefresh,
    isAutoRefreshing: intervalRef.current !== null
  };
};

/**
 * Pre-configured hooks for different staff page refresh intervals
 */

// Dashboard - 30 seconds
export const useStaffDashboardRefresh = (onRefresh: () => void | Promise<void>, enabled = true) => {
  return useStaffAutoRefresh({
    refreshInterval: 30000, // 30 seconds
    onRefresh,
    enabled
  });
};

// Messages - 15 seconds (faster for real-time messaging)
export const useStaffMessagesRefresh = (onRefresh: () => void | Promise<void>, enabled = true) => {
  return useStaffAutoRefresh({
    refreshInterval: 15000, // 15 seconds
    onRefresh,
    enabled
  });
};

// Bookings - 30 seconds
export const useStaffBookingsRefresh = (onRefresh: () => void | Promise<void>, enabled = true) => {
  return useStaffAutoRefresh({
    refreshInterval: 30000, // 30 seconds
    onRefresh,
    enabled
  });
};

// Calendar - 60 seconds (less frequent for calendar data)
export const useStaffCalendarRefresh = (onRefresh: () => void | Promise<void>, enabled = true) => {
  return useStaffAutoRefresh({
    refreshInterval: 60000, // 60 seconds
    onRefresh,
    enabled
  });
};

// Profile - 5 minutes (infrequent for profile data)
export const useStaffProfileRefresh = (onRefresh: () => void | Promise<void>, enabled = true) => {
  return useStaffAutoRefresh({
    refreshInterval: 300000, // 5 minutes
    onRefresh,
    enabled
  });
};