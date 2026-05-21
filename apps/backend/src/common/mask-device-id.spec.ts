import { maskDeviceId } from './mask-device-id';

describe('maskDeviceId', () => {
  it('should return the full device_id for admin', () => {
    expect(maskDeviceId('DEV-A1B2-XC54', 'admin')).toBe('DEV-A1B2-XC54');
  });

  it('should mask the middle segment for user role', () => {
    expect(maskDeviceId('DEV-A1B2-XC54', 'user')).toBe('DEV-****-XC54');
  });

  it('should mask the middle segment for any non-admin role', () => {
    expect(maskDeviceId('DEV-ABCD-EFGH', 'viewer')).toBe('DEV-****-EFGH');
  });

  it('should return full device_id when role is exactly admin', () => {
    expect(maskDeviceId('DEV-0000-9999', 'admin')).toBe('DEV-0000-9999');
  });

  it('should mask when role is empty string', () => {
    expect(maskDeviceId('DEV-XXXX-YYYY', '')).toBe('DEV-****-YYYY');
  });

  it('should handle device_id with numbers in middle segment', () => {
    expect(maskDeviceId('DEV-1234-5678', 'user')).toBe('DEV-****-5678');
  });

  it('should handle device_id with mixed case in middle segment', () => {
    expect(maskDeviceId('DEV-aZ12-bC34', 'user')).toBe('DEV-****-bC34');
  });
});
