import * as vscode from "vscode";
import { register as registerViewer } from "./viewer";
import { register as registerEditor } from "./editor";

// "activationEvents": [
//   "onCustomEditor:babylonjs.asset.preview",
// ],
// "contributes": {
//   "customEditors": [
//     {
//       "viewType": "babylonjs.asset.preview",
//       "displayName": "Babylon Sandbox Preview",
//       "priority": "default",
//       "selector": [
//         {
//           "filenamePattern": "*.babylon"
//         },
//         {
//           "filenamePattern": "*.gltf"
//         },
//         {
//           "filenamePattern": "*.glb"
//         },
//         {
//           "filenamePattern": "*.obj"
//         }
//       ]
//     }
//   ],
// },

export function activate(context: vscode.ExtensionContext) {
  console.log("babylonjs.assetViewer extension is active.");
  context.subscriptions.push(
    ...registerViewer(context),
    ...registerEditor(context)
  );
}

export function deactivate() {
  console.log("babylonjs.assetViewer extension is inactive.");
}
