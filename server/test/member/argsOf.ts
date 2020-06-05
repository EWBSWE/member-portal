export function argsOf<T>(spyFunction: any): T[] {
  const calls = spyFunction.getCalls();
  return calls.map((call: any) => call.args[0] as T);
}
