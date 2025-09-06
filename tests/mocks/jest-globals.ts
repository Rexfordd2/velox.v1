export const jest = {
  fn: (impl?: any) => {
    const mock = (...args: any[]) => (impl ? impl(...args) : undefined);
    (mock as any).mockImplementation = (newImpl: any) => (impl = newImpl);
    (mock as any).mockResolvedValue = (val: any) => (impl = async () => val);
    (mock as any).mockRejectedValue = (err: any) => (impl = async () => { throw err; });
    return mock as any;
  },
  setTimeout: (ms: number) => ms,
};
