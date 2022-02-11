import * as vscode from "vscode";
import { SandboxPreviewProvider } from "./editor";

export function activate(context: vscode.ExtensionContext) {
  console.log("babylonjs.sandbox.preview extension is active.");
  context.subscriptions.push(SandboxPreviewProvider.register(context));
}

// https://github.com/rebornix/vscode-webview-react/tree/master/ext-src
// https://webpack.js.org/concepts/entry-points/
// https://doc.babylonjs.com/divingDeeper/developWithBjs/treeShaking
// https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
// https://code.visualstudio.com/api/extension-guides/webview
// https://code.visualstudio.com/api/working-with-extensions/bundling-extension
// https://doc.babylonjs.com/divingDeeper/developWithBjs/npmSupport
// https://github.com/BabylonJS/Babylon.js/blob/master/sandbox/webpack.config.js
// https://github.com/BabylonJS/Babylon.js/blob/master/sandbox/src/sandbox.tsx
