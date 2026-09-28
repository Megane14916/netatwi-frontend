export const freezeTime = (iso = "2026-01-01T10:30:00.000Z") => {
  jest.useFakeTimers({ now: new Date(iso) });
  return () => jest.useRealTimers();
};
