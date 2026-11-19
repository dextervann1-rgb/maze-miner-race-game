export const audio = {
  enabled: true,
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },
  beep() {
    return this.enabled;
  },
};
