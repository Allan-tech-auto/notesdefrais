export const fields = ['supplierName', 'date', 'time', 'totalAmount', 'currency', 'category'];
export function matches(field, actual, expected) {
  if (expected === null) return actual === null;
  if (field === 'totalAmount') return typeof actual === 'number' && Number.isFinite(actual) && Math.abs(actual - expected) <= 0.010000001;
  if (field === 'supplierName') {
    const normalize = s => typeof s === 'string' ? s.normalize('NFD').replace(/\p{M}|\s/gu, '').toLowerCase() : '';
    const a = normalize(actual), e = normalize(expected);
    return !!a && !!e && (a.includes(e) || e.includes(a));
  }
  return actual === expected;
}
