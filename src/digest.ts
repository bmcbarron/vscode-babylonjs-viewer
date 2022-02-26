import * as vscode from "vscode";
import { AssetDocument } from "./asset";
import { digestAsset } from "./assetDigester";
import { SharedContext, textExtensions } from "./common";
import { commandRender, shortTitle as viewerTitle } from "./viewer";
import { WebviewHost } from "./wvHost";

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
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly sharedContext: SharedContext
  ) {}

  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<AssetDocument> {
    const doc = await AssetDocument.create(uri);
    digestAsset(doc);
    return doc;
  }

  async resolveCustomEditor(
    doc: AssetDocument,
    panel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const isText = textExtensions.includes(doc.extension);
    const currentEditor = getCurrentEditor(doc.extension);
    const currentOpenAsText = currentEditor === defaultEditorId;

    const host = new WebviewHost({
      webview: panel.webview,
      title,
      description,
      contentSecurityPolicies: {
        "default-src": panel.webview.cspSource,
      },
      uriRoot: this.context.extensionUri,
      styleFilenames: [
        "codicons/codicon.css",
        "reset.css",
        "vscode.css",
        "codicon-modifiers.css",
        "dataTable.css",
        "checkbox.css",
        "digest.css",
      ],
      scriptFilenames: ["wvDigest.js"],
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
          <table id="digest" class="data-table"></table>
        </div>
        <div class="section${isText ? "" : " hidden"}">
          <div class="text">
            This file can also be <a id="open-as-text" href="#" title="Re-open in a text editor">
            opened in the text editor</a>.
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

    const updateActiveResource = (active: boolean) => {
      if (active) {
        this.sharedContext.activeResource = doc.uri;
      } else if (this.sharedContext.activeResource === doc.uri) {
        this.sharedContext.activeResource = undefined;
      }
    };
    updateActiveResource(true);
    panel.onDidChangeViewState(() => {
      updateActiveResource(panel.visible && panel.active);
      host.post("state", { active: panel.active });
    });
    panel.onDidDispose(() => {
      updateActiveResource(false);
    });

    host.on("ready", () => {
      const postDigest = () =>
        host.post("digest", { digest: doc.digest, final: doc.isDigestFinal });
      doc.onDidDigestChange(postDigest);
      postDigest();
    });

    host.on("render-in-viewer", () => {
      vscode.commands.executeCommand(commandRender, doc.uri);
    });

    host.on("open-as-text", () => {
      vscode.commands.executeCommand("workbench.action.reopenTextEditor");
    });

    host.on("update-default-open-as-text", (args) => {
      const enabled = args.enabled as boolean;
      updateCurrentEditor(doc.extension, enabled ? defaultEditorId : editorId);
    });
  }
}

export function register(
  context: vscode.ExtensionContext,
  sharedContext: SharedContext
): vscode.Disposable[] {
  const provider = new AssetPreviewProvider(context, sharedContext);

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
