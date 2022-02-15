import * as vscode from "vscode";
import { WebviewHost } from "./webviewHost";

const editorId = "babylonjs.assetEditor";
const title = "Babylon.js Asset Editor";
const description =
  "Summarizes the contents of glTF, glb, obj, and babylon assets";

class AssetDocument implements vscode.CustomDocument {
  static async create(uri: vscode.Uri): Promise<AssetDocument> {
    return new AssetDocument(uri);
  }

  private constructor(readonly uri: vscode.Uri) {}

  dispose(): void {
    console.log(`AssetDocument disposed: ${this.uri}`);
  }
}

class AssetPreviewProvider
  implements vscode.CustomReadonlyEditorProvider<AssetDocument>
{
  constructor(private readonly context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<AssetDocument> {
    return await AssetDocument.create(uri);
  }

  async resolveCustomEditor(
    document: AssetDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const _host = new WebviewHost({
      webview: webviewPanel.webview,
      title,
      description,
      contentSecurityPolicies: {
        "default-src": webviewPanel.webview.cspSource,
      },
      uriRoot: this.context.extensionUri,
      styleFilenames: ["reset.css", "vscode.css", "editor.css"],
      scriptFilenames: ["webviewerEditor.js"],
      content: /* html */ `
        <div class="notes">
        <div class="text">This file bla blahafasd alsfalsdfadsf</div>
        <div class="add-button">
           <button>Scratch!</button>
        </div>
      `,
    });
  }
}

export function register(
  context: vscode.ExtensionContext
): vscode.Disposable[] {
  const provider = new AssetPreviewProvider(context);

  const result: vscode.Disposable[] = [];
  result.push(
    vscode.window.registerCustomEditorProvider(editorId, provider, {
      webviewOptions: { enableFindWidget: true },
    })
  );
  return result;
}
