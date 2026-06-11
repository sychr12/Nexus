export const nowIso = () => new Date().toISOString();

export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
