import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LIVE_EVENTS } from '@camp-dilly/shared';
import { liveSocket } from '../lib/socket';

/** Maps each WebSocket event the API broadcasts to the TanStack Query key
 * it invalidates — the actual "another staff member's booking appears on
 * my screen within a second" mechanism. Mount once near the app root. */
const EVENT_TO_QUERY_KEY: Record<string, string> = {
  [LIVE_EVENTS.DAY_CHANGED]: 'income-day',
  [LIVE_EVENTS.OVERNIGHT_CHANGED]: 'income-overnight',
  [LIVE_EVENTS.STORE_CHANGED]: 'income-store',
  [LIVE_EVENTS.EXPENSE_CHANGED]: 'expenses',
  [LIVE_EVENTS.SETTINGS_CHANGED]: 'settings',
};

export function useLiveInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handlers = Object.entries(EVENT_TO_QUERY_KEY).map(([event, queryKey]) => {
      const handler = () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        // Reports aggregate every source, so any change invalidates it too.
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      };
      liveSocket.on(event, handler);
      return { event, handler };
    });

    return () => {
      handlers.forEach(({ event, handler }) => liveSocket.off(event, handler));
    };
  }, [queryClient]);
}
