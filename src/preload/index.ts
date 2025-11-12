import { contextBridge, ipcRenderer } from "electron";

const api = {
  toggleOverlay(visible?: boolean) {
    return ipcRenderer.invoke("sky:toggle", { visible });
  },
  expand() {
    return ipcRenderer.invoke("sky:expand");
  },
  collapse() {
    return ipcRenderer.invoke("sky:collapse");
  },
  setPosition(x: number, y: number) {
    return ipcRenderer.invoke("sky:setPosition", { x, y });
  },
  onVisibilityChange(callback: (visible: boolean) => void) {
    const listener = (_: Electron.IpcRendererEvent, visible: boolean) => {
      callback(visible);
    };
    ipcRenderer.on("sky:visibility", listener);
    return () => ipcRenderer.removeListener("sky:visibility", listener);
  },
  onExpandedChange(callback: (expanded: boolean) => void) {
    const listener = (_: Electron.IpcRendererEvent, expanded: boolean) => {
      callback(expanded);
    };
    ipcRenderer.on("sky:expanded", listener);
    return () => ipcRenderer.removeListener("sky:expanded", listener);
  },
  onPositionChange(callback: (position: { x: number; y: number }) => void) {
    const listener = (_: Electron.IpcRendererEvent, position: { x: number; y: number }) => {
      callback(position);
    };
    ipcRenderer.on("sky:position", listener);
    return () => ipcRenderer.removeListener("sky:position", listener);
  },
  onBlur(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on("sky:blur", listener);
    return () => ipcRenderer.removeListener("sky:blur", listener);
  },
};

contextBridge.exposeInMainWorld("sky", api);

export type SkyBridge = typeof api;

