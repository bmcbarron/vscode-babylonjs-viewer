import * as vscode from "vscode";

// TODO: Consider supporting ktx textures. https://www.khronos.org/ktx/
export const textExtensions = [".babylon", ".gltf", ".obj"];
export const binaryExtensions = [".glb"];
export const supportedExtensions = [...textExtensions, ...binaryExtensions];

export function getExtension(filename: string | vscode.Uri) {
  if (filename instanceof vscode.Uri) {
    filename = filename.fsPath;
  }
  const extIndex = filename.lastIndexOf(".");
  return extIndex >= 0 ? filename.slice(extIndex) : "";
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatNumber(v: number, maxDecimalPlaces = 2) {
  // https://stackoverflow.com/a/19623253/8107589
  return Number(v.toFixed(maxDecimalPlaces)).toString();
}

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

export function friendlySize(bytes: number) {
  if (bytes >= GB) {
    return formatNumber(bytes / GB, 1) + " GB";
  } else if (bytes >= MB) {
    return formatNumber(bytes / MB, 1) + " MB";
  } else if (bytes >= KB) {
    return formatNumber(bytes / KB, 1) + " KB";
  } else {
    return `${bytes} B`;
  }
}

export function friendlyTimestamp(date: Date) {
  return date.toLocaleString();
}

// Zero-width-space, which can be used to provide "soft" breakpoints in a long string.
export const ZWS = "\u200b";

export function wrappableFilename(filename: string) {
  return filename.replace(/[/\\]/g, (match) => `${match}${ZWS}`);
}

export interface SharedContext {
  activeResource?: vscode.Uri;
}