export function transformValOf(
  obj: Record<string, string | null>,
  callback: (value: string) => string,
): Record<string, string | null> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value ? callback(value) : value,
    ]) as Array<[string, string | null]>,
  );
}
