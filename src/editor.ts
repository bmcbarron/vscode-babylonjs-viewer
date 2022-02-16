import * as vscode from "vscode";
import { AssetDocument } from "./asset";
import { scanAssetInfo } from "./assetScanner";
import { textExtensions } from "./common";
import { commandFocus, commandOpen, shortTitle as viewerTitle } from "./viewer";
import { WebviewHost } from "./webviewHost";

const editorId = "babylonjs.assetEditor";
const title = "Babylon.js Asset Editor";
const description =
  "Summarizes the contents of glTF, glb, obj, and babylon assets";

class AssetPreviewProvider
  implements vscode.CustomReadonlyEditorProvider<AssetDocument>
{
  constructor(private readonly context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<AssetDocument> {
    const doc = await AssetDocument.create(uri);
    scanAssetInfo(doc);
    return doc;
  }

  async resolveCustomEditor(
    doc: AssetDocument,
    panel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const isText = textExtensions.includes(doc.extension);
    // TODO: Consider generalizing extension files local to "dist" vs "node_modules".
    const codiconsUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css"
      )
    );

    const host = new WebviewHost({
      webview: panel.webview,
      title,
      description,
      contentSecurityPolicies: {
        "default-src": panel.webview.cspSource,
      },
      uriRoot: this.context.extensionUri,
      styleFilenames: [
        codiconsUri,
        "reset.css",
        "vscode.css",
        "codicon-modifiers.css",
        "editor.css",
      ],
      scriptFilenames: ["webviewEditor.js"],
      content: /* html */ `
      <div class="section">
        <div class="text">Files with extension <span class="filename">${
          doc.extension
        }</span>
        can be visualized by the <a href="https://babylonjs.com">Babylon.js</a>
        ${viewerTitle.toLocaleLowerCase()}.</div>
        <button id="open-in-viewer">Open in the ${viewerTitle}</button>
      </div>
      <div class="section${isText ? "" : " hidden"}">
        <div class="text">They can also be opened in the text editor.</div>
        <button id="open-as-text">Open as a text document</button>
        <!-- TODO: Checkbox: Open as text by default -->
      </div>
      <div class="section">
        <table id="info-table"></table>
      </div>
      `,
    });

    host.on("ready", () => {
      const postInfo = () =>
        host.post("info", { info: doc.info, final: doc.isInfoFinal });
      doc.onDidInfoChange(postInfo);
      postInfo();
    });

    host.on("open-in-viewer", () => {
      vscode.commands.executeCommand(commandFocus).then(() => {
        vscode.commands.executeCommand(commandOpen, doc.uri);
      });
    });

    host.on("open-as-text", () => {
      vscode.commands.executeCommand("vscode.openWith", doc.uri, "default");
      // TODO: There is a command to "reopen" an editor with a different format. Figure out
      // how to use that instead, to eliminate flicker.
      panel.dispose();
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
