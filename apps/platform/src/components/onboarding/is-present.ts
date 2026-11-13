export function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined;
}
