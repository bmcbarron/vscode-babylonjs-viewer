import * as vscode from "vscode";

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
