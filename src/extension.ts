import * as vscode from "vscode";
import { register as registerViewer } from "./viewer";
import { register as registerEditor } from "./digest";
import { SharedContext } from "./common";

export function activate(context: vscode.ExtensionContext) {
  const sharedContext: SharedContext = {};
  context.subscriptions.push(
    ...registerViewer(context, sharedContext),
    ...registerEditor(context, sharedContext)
  );
}
