export const hasWhiteSpace = (text: string): boolean => /\s/.test(text);

export function isUnique<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index;
}
