declare global {
  interface Window {
    AndroidFileSaver?: { saveFile: (f: string, d: string) => string; getForgePath: () => string; listForgeFiles: () => string; getBackendUrl?: () => string }
    AndroidBridge?: { copyToClipboard: (t: string) => boolean; getClipboard: () => string }
  }
}
export async function saveFile(filename: string, blob: Blob) {
  if (window.AndroidFileSaver) {
    const b64 = await blobToBase64(blob)
    const r = window.AndroidFileSaver.saveFile(filename, b64)
    return r.startsWith('ERROR') ? { success: false, error: r } : { success: true, path: r }
  }
  try { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); return { success: true, path: 'browser' } } catch (e) { return { success: false, error: String(e) } }
}
function blobToBase64(blob: Blob): Promise<string> { return new Promise((r, j) => { const r2 = new FileReader(); r2.onloadend = () => r((r2.result as string).split(',')[1] || ''); r2.onerror = j; r2.readAsDataURL(blob) }) }
export function isNativeAndroid() { return !!window.AndroidFileSaver }
export function getForgePath() { return window.AndroidFileSaver?.getForgePath() || 'Downloads/ReactForge' }
export function listForgeFiles() { try { return JSON.parse(window.AndroidFileSaver?.listForgeFiles() || '[]') } catch { return [] } }
