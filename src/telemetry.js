export function track(event, payload = {}) {
  if (import.meta.env?.DEV) console.debug('[telemetry]', event, payload);
}
