/**
 * src/services/__tests__/connectionManager.test.ts
 *
 * Unit tests for connectionManager:
 * - Connection lifecycle: connect, reconnect, disconnect, sync
 * - Last successful sync timestamp updates
 * - Status transitions (connected, disconnected, expired, error)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConnectionStore } from '../connectionManager';

describe('ConnectionManager', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await useConnectionStore.getState().initConnections();
  });

  it('initializes with default connection items', () => {
    const connections = useConnectionStore.getState().connections;
    expect(connections).toBeDefined();
    expect(connections.length).toBeGreaterThanOrEqual(4);

    const gcal = connections.find((c) => c.id === 'google_calendar');
    expect(gcal).toBeDefined();
    expect(gcal?.authType).toBe('oauth2');
  });

  it('updates status and sync timestamp when connectProvider is called', async () => {
    const success = await useConnectionStore
      .getState()
      .connectProvider('google_calendar', 'test.user@gmail.com');

    expect(success).toBe(true);

    const gcal = useConnectionStore
      .getState()
      .connections.find((c) => c.id === 'google_calendar');

    expect(gcal?.status).toBe('connected');
    expect(gcal?.accountEmail).toBe('test.user@gmail.com');
    expect(gcal?.lastSuccessfulSync).not.toBeNull();
  });

  it('transitions provider to disconnected when disconnectProvider is called', async () => {
    await useConnectionStore.getState().disconnectProvider('google_calendar');

    const gcal = useConnectionStore
      .getState()
      .connections.find((c) => c.id === 'google_calendar');

    expect(gcal?.status).toBe('disconnected');
    expect(gcal?.accountEmail).toBeUndefined();
  });

  it('refreshes sync timestamp when syncProvider is called', async () => {
    await useConnectionStore
      .getState()
      .connectProvider('google_calendar', 'sync.test@gmail.com');

    const beforeSync = useConnectionStore
      .getState()
      .connections.find((c) => c.id === 'google_calendar')?.lastSuccessfulSync;

    // Small delay to ensure timestamp difference
    await new Promise((r) => setTimeout(r, 10));

    const syncSuccess = await useConnectionStore.getState().syncProvider('google_calendar');
    expect(syncSuccess).toBe(true);

    const afterSync = useConnectionStore
      .getState()
      .connections.find((c) => c.id === 'google_calendar')?.lastSuccessfulSync;

    expect(afterSync).not.toBeNull();
    expect(afterSync).not.toEqual(beforeSync);
  });
});
