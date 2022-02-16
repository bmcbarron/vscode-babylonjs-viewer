import * as vscode from "vscode";
import { getExtension, textExtensions } from "./common";
import { WebviewHost } from "./webviewHost";
import { commandOpen, commandFocus, shortTitle as viewerTitle } from "./viewer";

const editorId = "babylonjs.assetEditor";
const title = "Babylon.js Asset Editor";
const description =
  "Summarizes the contents of glTF, glb, obj, and babylon assets";

type InfoTable = Array<[string, string]>;

class AssetDocument implements vscode.CustomDocument {
  static async create(uri: vscode.Uri): Promise<AssetDocument> {
    return new AssetDocument(uri);
  }

  get extension() {
    return getExtension(this.uri);
  }

  private constructor(readonly uri: vscode.Uri) {}

  buildInfoTable(): Promise<InfoTable> {
    const results: InfoTable = [];
    for (let i = 0; i < 10; ++i) {
      results.push(["filename", this.uri.fsPath]);
    }
    return Promise.resolve(results);
  }

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
    const isText = textExtensions.includes(document.extension);

    const host = new WebviewHost({
      webview: webviewPanel.webview,
      title,
      description,
      contentSecurityPolicies: {
        "default-src": webviewPanel.webview.cspSource,
      },
      uriRoot: this.context.extensionUri,
      styleFilenames: ["reset.css", "vscode.css", "editor.css"],
      scriptFilenames: ["webviewEditor.js"],
      content: /* html */ `
      <div class="section">
        <div class="text">Files with extension <span class="filename">${
          document.extension
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
      <div class="section" id="info-table"></div>
      `,
    });

    host.on("ready", () => {
      document.buildInfoTable().then((info) => {
        host.post("info", { info });
      });
    });

    host.on("open-in-viewer", () => {
      vscode.commands.executeCommand(commandFocus).then(() => {
        vscode.commands.executeCommand(commandOpen, document.uri);
      });
    });

    host.on("open-as-text", () => {
      vscode.commands.executeCommand(
        "vscode.openWith",
        document.uri,
        "default"
      );
      // TODO: There is a command to "reopen" an editor with a different format. Figure out
      // how to use that instead, to eliminate flicker.
      webviewPanel.dispose();
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
