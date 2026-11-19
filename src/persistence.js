const KEY = 'mmr_v5_save';
export function loadSave(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}
export function saveReceipt(receipt, storage = globalThis.localStorage) {
  storage.setItem(`${KEY}:lastReceipt`, JSON.stringify(receipt));
  return receipt;
}
