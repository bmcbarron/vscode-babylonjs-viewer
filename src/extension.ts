import * as vscode from "vscode";
import { SandboxPreviewProvider } from "./editor";

export function activate(context: vscode.ExtensionContext) {
  console.log("babylonjs.sandbox.preview extension is active.");
  context.subscriptions.push(SandboxPreviewProvider.register(context));
}

export function deactivate() {
  console.log("babylonjs.sandbox.preview extension is inactive.");
}
