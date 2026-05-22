import { describe, it, expect } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('formats zero', () => {
    expect(formatTime(0)).toEqual({ mmss: '00:00', cs: '00' });
  });
  it('formats 1 minute 5 seconds', () => {
    expect(formatTime(65000)).toEqual({ mmss: '01:05', cs: '00' });
  });
  it('formats centiseconds', () => {
    expect(formatTime(1234)).toEqual({ mmss: '00:01', cs: '23' });
  });
  it('formats large value', () => {
    expect(formatTime(3661500)).toEqual({ mmss: '61:01', cs: '50' });
  });
});
