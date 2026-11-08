export const createClientFromRequest = () => globalThis.testClient;

export const base44 = new Proxy({}, { get: (_, key) => globalThis.testClient[key] });
