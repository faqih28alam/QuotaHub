export function maskKey(key: string): string {
  if (!key) return '••••••••••••';
  const trimmed = key.trim();
  if (trimmed.length <= 10) {
    return trimmed.slice(0, 3) + '••••' + trimmed.slice(-2);
  }
  const prefix = trimmed.slice(0, 7);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  const num = Number(amount);
  if (isNaN(num)) return `0.00`;
  if (currency === '$') {
    return `$${num.toFixed(2)}`;
  }
  return `${num.toFixed(1)} ${currency}`;
}

export function getRelativeTime(isoString: string): string {
  try {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}
