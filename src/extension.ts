import * as vscode from "vscode";
import { register as registerViewer } from "./viewer";
import { register as registerEditor } from "./editor";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    ...registerViewer(context),
    ...registerEditor(context)
  );
}
