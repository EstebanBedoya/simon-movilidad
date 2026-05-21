export function maskDeviceId(deviceId: string, role: string): string {
  if (role === 'admin') return deviceId;
  // Format DEV-XXXX-XXXX → DEV-****-XXXX
  return deviceId.replace(/^(DEV-)([^-]+)(-.+)$/, '$1****$3');
}
