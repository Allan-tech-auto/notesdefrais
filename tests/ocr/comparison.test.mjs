import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matches } from '../../scripts/ocr-comparison.mjs';
test('amount tolerance is one cent and strings are rejected', () => {
  assert(matches('totalAmount',12.51,12.5));
  assert(!matches('totalAmount',12.52,12.5));
  assert(!matches('totalAmount','12.5',12.5));
});
test('supplier inclusion ignores case accents and spaces but not absence', () => {
  assert(matches('supplierName','CAFÉ DU PORT PARIS','cafe du port'));
  assert(!matches('supplierName','', 'cafe'));
});
test('date, time and category require exact equality', () => {
  assert(!matches('date','2026-01-02','2026-02-01'));
  assert(matches('time',null,null));
  assert(!matches('category','dejeuner','repas'));
});
