import { test } from "node:test";
import assert from "node:assert/strict";
import { validateInterval, csvCell } from "../src/lib/domain";
test("rejeita término anterior ao início e datas futuras", () => {
  assert.throws(() =>
    validateInterval(new Date("2026-01-02"), new Date("2026-01-01")),
  );
  assert.throws(() => validateInterval(new Date(Date.now() + 86400000)));
  assert.doesNotThrow(() =>
    validateInterval(new Date("2026-01-01"), new Date("2026-01-02")),
  );
});
test("exportação neutraliza fórmulas e escapa aspas", () => {
  assert.equal(csvCell("=SUM(A1)"), '"\'=SUM(A1)"');
  assert.equal(csvCell('a"b'), '"a""b"');
});
