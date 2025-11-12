type SkyBridge = import("../preload").SkyBridge;

declare global {
  interface Window {
    sky: SkyBridge;
  }
}

export {};

