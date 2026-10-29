import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-navigation/native', () => ({ createNavigationContainerRef: () => ({}) }));

import { openRequestsTab } from './navigationRef';

describe('openRequestsTab', () => {
  it('opens the Requests tab straight away when the app is ready', async () => {
    const navigate = vi.fn();
    expect(await openRequestsTab({ isReady: () => true, navigate } as never, async () => {})).toBe(true);
    expect(navigate).toHaveBeenCalledWith('App', { screen: 'Requests' });
  });

  it('waits for a cold start to finish', async () => {
    const navigate = vi.fn();
    let ready = false;
    const wait = vi.fn(async () => {
      if (wait.mock.calls.length === 3) ready = true;
    });
    expect(await openRequestsTab({ isReady: () => ready, navigate } as never, wait)).toBe(true);
    expect(wait).toHaveBeenCalledTimes(3);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('gives up if the app never becomes ready (signed out)', async () => {
    const navigate = vi.fn();
    expect(await openRequestsTab({ isReady: () => false, navigate } as never, async () => {})).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not throw if navigating fails', async () => {
    const navigate = vi.fn(() => {
      throw new Error('no such route');
    });
    expect(await openRequestsTab({ isReady: () => true, navigate } as never, async () => {})).toBe(false);
  });
});
