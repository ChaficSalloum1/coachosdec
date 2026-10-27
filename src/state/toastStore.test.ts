import { describe, expect, it } from 'vitest';

import { showToast, useToastStore } from './toastStore';

describe('toast store', () => {
  it('shows a toast with the given type, defaulting to info', () => {
    showToast('Saved', 'success');
    expect(useToastStore.getState().toast).toMatchObject({ message: 'Saved', type: 'success' });

    showToast('Hello');
    expect(useToastStore.getState().toast).toMatchObject({ message: 'Hello', type: 'info' });
  });

  it('replaces the current toast with a new one that has a new id', () => {
    showToast('first');
    const first = useToastStore.getState().toast!;
    showToast('second', 'error');
    const second = useToastStore.getState().toast!;

    expect(second.message).toBe('second');
    expect(second.id).not.toBe(first.id);
  });

  it('ignores a dismiss from an older toast so it cannot hide a newer one', () => {
    showToast('first');
    const first = useToastStore.getState().toast!;
    showToast('second');

    useToastStore.getState().dismiss(first.id);
    expect(useToastStore.getState().toast?.message).toBe('second');

    useToastStore.getState().dismiss(useToastStore.getState().toast!.id);
    expect(useToastStore.getState().toast).toBeNull();
  });
});
