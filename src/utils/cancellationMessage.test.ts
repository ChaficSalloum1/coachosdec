import { describe, expect, it } from 'vitest';

import { buildCancellationMessage, buildContactUrl } from './cancellationMessage';

describe('buildCancellationMessage', () => {
  it('greets by first name and names the day and time', () => {
    const message = buildCancellationMessage({
      studentName: 'Ana Papadopoulou',
      coachName: 'Chris',
      date: '2026-11-02',
      startTime: '18:30',
    });
    expect(message).toContain('Hi Ana,');
    expect(message).toContain('Mon 2 Nov at 18:30');
    expect(message.endsWith('\nChris')).toBe(true);
  });

  it('works without a coach name or a usable student name', () => {
    const message = buildCancellationMessage({ studentName: '  ', date: '2026-11-02', startTime: '09:00' });
    expect(message).toContain('Hi there,');
    expect(message.endsWith('new time.')).toBe(true);
  });
});

describe('buildContactUrl', () => {
  it('opens an sms for phone numbers with the platform body separator', () => {
    expect(buildContactUrl('+30 694 123 4567', 'Hi & bye', { platform: 'ios' })).toBe(
      'sms:+306941234567&body=Hi%20%26%20bye'
    );
    expect(buildContactUrl('(694) 123-4567', 'Hi', { platform: 'android' })).toBe('sms:6941234567?body=Hi');
  });

  it('opens a mailto for emails and returns null with no contact', () => {
    expect(buildContactUrl('ana@example.com', 'Hi', { platform: 'ios' })).toBe(
      'mailto:ana@example.com?subject=Lesson%20cancelled&body=Hi'
    );
    expect(buildContactUrl('   ', 'Hi', { platform: 'ios' })).toBeNull();
    expect(buildContactUrl(undefined, 'Hi', { platform: 'ios' })).toBeNull();
  });
});
