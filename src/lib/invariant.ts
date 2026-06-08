export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant violation: ${message}`);
  }
}

export const assertNever = (value: never): never => {
  invariant(false, `unexpected value: ${String(value)}`);
};
