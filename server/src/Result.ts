export type Result<T> =
  | { success: true; hasData: true; data: T }
  | { success: true; hasData: false }
  | { success: false; message: string };

export function ok<T>(value: T): Result<T> {
  return { success: true, hasData: true, data: value };
}

export function empty<T>(): Result<T> {
  return { success: true, hasData: false };
}

export function fail<T>(message: string): Result<T> {
  return { success: false, message };
}
