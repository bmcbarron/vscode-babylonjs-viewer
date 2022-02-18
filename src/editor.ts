import * as vscode from "vscode";
import { AssetDocument } from "./asset";
import { summarizeAsset } from "./assetScanner";
import { textExtensions } from "./common";
import {
  commandFocus,
  commandRender,
  shortTitle as viewerTitle,
} from "./viewer";
import { WebviewHost } from "./webviewHost";

const editorId = "babylonjs.assetDigest";
const defaultEditorId = "default";
const title = "Babylon.js Asset Digest";
const description =
  "Summarizes the contents of glTF, glb, obj, and babylon assets";

const editorAssociationsConfigKey = "workbench.editorAssociations";

function getCurrentEditor(extension: string) {
  const pattern = `*${extension}`;
  const associations = vscode.workspace
    .getConfiguration()
    .get<Record<string, string>>(editorAssociationsConfigKey, {});
  return associations[pattern] ?? editorId;
}

function updateCurrentEditor(extension: string, id: string) {
  const config = vscode.workspace.getConfiguration();
  const pattern = `*${extension}`;
  const associations = config.get<Record<string, string>>(
    editorAssociationsConfigKey,
    {}
  );
  associations[pattern] = id;
  return config.update(
    editorAssociationsConfigKey,
    associations,
    vscode.ConfigurationTarget.Workspace
  );
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
    const doc = await AssetDocument.create(uri);
    summarizeAsset(doc);
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

    const currentEditor = getCurrentEditor(doc.extension);
    const currentOpenAsText = currentEditor === defaultEditorId;
    console.log(`${currentEditor} ${currentOpenAsText}`);

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
        "dataTable.css",
        "checkbox.css",
        "editor.css",
      ],
      scriptFilenames: ["webviewEditor.js"],
      content: /* html */ `
      <div id="viewport">
        <div class="section">
          <div class="text">Files with extension <span class="filename">${
            doc.extension
          }</span>
          can be rendered by the <a href="https://babylonjs.com">Babylon.js</a>
          ${viewerTitle.toLocaleLowerCase()}.</div>
          <button id="render-in-viewer">Render in the ${viewerTitle}</button>
        </div>
        <div class="section">
          <!-- TODO: Deal with wrapping -->
          <table id="digest" class="data-table"></table>
        </div>
        <div class="section${isText ? "" : " hidden"}">
          <div class="text">
            This file can also be <a id="open-as-text" href="#">opened in the text editor</a>.
          </div>
          <input id="default-open-as-text" type="checkbox" ${
            currentOpenAsText ? "checked" : ""
          }>
          <label for="default-open-as-text">
            <span class="checkbox"><i class="codicon codicon-check"></i></span><span
                  class="label">Open <span class="filename">${
                    doc.extension
                  }</span> files as text by default</span>
          </label>
        </div>
      </div>
      `,
    });

    panel.onDidChangeViewState(() => {
      host.post("state", { active: panel.active });
    });

    host.on("ready", () => {
      const postDigest = () =>
        host.post("digest", { digest: doc.digest, final: doc.isDigestFinal });
      doc.onDidDigestChange(postDigest);
      postDigest();
    });

    host.on("render-in-viewer", () => {
      vscode.commands.executeCommand(commandFocus).then(() => {
        vscode.commands.executeCommand(commandRender, doc.uri);
      });
    });

    host.on("open-as-text", () => {
      vscode.commands.executeCommand("vscode.openWith", doc.uri, "default");
      // TODO: There is a command to "reopen" an editor with a different format. Figure out
      // how to use that instead, to eliminate flicker.
      panel.dispose();
    });

    host.on("update-default-open-as-text", (args) => {
      const enabled = args.enabled as boolean;
      updateCurrentEditor(doc.extension, enabled ? defaultEditorId : editorId);
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
      // TODO: Synchronize Digest state across multiple tabs.
      // supportsMultipleEditorsPerDocument: true
    })
  );
  return result;
}
