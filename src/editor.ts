import * as vscode from "vscode";
import { AssetDocument } from "./asset";
import { scanAssetInfo } from "./assetScanner";
import { textExtensions } from "./common";
import { commandFocus, commandOpen, shortTitle as viewerTitle } from "./viewer";
import { WebviewHost } from "./webviewHost";
// "configurationDefaults": {
//   "workbench.editorAssociations": {
//     "*.babylon": "babylonjs.assetSummarizer",
//     "*.glb": "babylonjs.assetSummarizer",
//     "*.gltf": "babylonjs.assetSummarizer",
//     "*.obj": "babylonjs.assetSummarizer"
//   }
// },
const editorId = "babylonjs.assetSummarizer";
const title = "Babylon.js Asset Summary";
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

    const config = vscode.workspace.getConfiguration(
      "workbench.editorAssociations"
    );
    console.log(`${JSON.stringify(config)}`);
    const defaultEditor = config["*.babylon"];
    const defaultOpenAsText = defaultEditor === "default";
    console.log(`${defaultEditor} ${defaultOpenAsText}`);

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
      <div id="viewport">
        <div class="section">
          <div class="text">Files with extension <span class="filename">${
            doc.extension
          }</span>
          can be visualized in the <a href="https://babylonjs.com">Babylon.js</a>
          ${viewerTitle.toLocaleLowerCase()}.</div>
          <button id="open-in-viewer">Open in the ${viewerTitle}</button>
        </div>
        <div class="section${isText ? "" : " hidden"}">
          <div class="text">
            They can also be <a id="open-as-text" href="#">opened in the text editor</a>.
          </div>
          <input id="default-open-as-text" type="checkbox" ${
            defaultOpenAsText ? "checked" : ""
          }>
          <label for="default-open-as-text">
            <span class="checkbox"><i class="codicon codicon-check"></i></span><span
                  class="label">Open as text by default</span>
          </label>
        </div>
        <div class="section">
          <!-- TODO: Deal with wrapping -->
          <table id="info-table"></table>
        </div>
      </div>
      `,
    });

    panel.onDidChangeViewState(() => {
      host.post("state", { active: panel.active });
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
      // TODO: Synchronize InfoTable state across multiple tabs.
      // supportsMultipleEditorsPerDocument: true
    })
  );
  return result;
}
