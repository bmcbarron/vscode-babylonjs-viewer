// Based on https://github.com/microsoft/vscode-extension-samples/blob/main/custom-editor-sample
import * as vscode from "vscode";

class SandboxDocument implements vscode.CustomDocument {
  static async create(uri: vscode.Uri): Promise<SandboxDocument> {
    return new SandboxDocument(uri);
  }

  private constructor(readonly uri: vscode.Uri) {}

  dispose(): void {
    console.log(`SandboxDocument disposed: ${this.uri}`);
  }
}

export class SandboxPreviewProvider
  implements vscode.CustomReadonlyEditorProvider<SandboxDocument>
{
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new SandboxPreviewProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      SandboxPreviewProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );
    return providerRegistration;
  }

  private static readonly viewType = "babylonjs.sandbox.preview";

  constructor(private readonly context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<SandboxDocument> {
    return await SandboxDocument.create(uri);
  }

  async resolveCustomEditor(
    document: SandboxDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Wait for the webview to be properly ready before we init
    webviewPanel.webview.onDidReceiveMessage((e) => {
      if (e.type === "ready") {
        if (document.uri.scheme === "untitled") {
          webviewPanel.webview.postMessage({
            type: "init",
            body: {
              untitled: true,
              editable: true,
            },
          });
        } else {
          const editable = vscode.workspace.fs.isWritableFileSystem(
            document.uri.scheme
          );
          const uri = webviewPanel.webview
            .asWebviewUri(document.uri)
            .toString();
          webviewPanel.webview.postMessage({
            type: "init",
            body: { uri, editable },
          });
        }
      }
    });
  }

  // Get the static HTML used for in our editor's webviews.
  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.css")
    );

    // Content Security Policy configuration.
    const nonce = getNonce();
    const cspTypekit = "https://*.typekit.net";
    const cspBabylon = "https://*.babylonjs.com";

    // This html template is a hybrid of sandbox/public/index.html and
    // https://github.com/microsoft/vscode-extension-samples/blob/main/custom-editor-sample/src/pawDrawEditor.ts
    // TODO: We are currently more lax than we'd like on C-S-P, with img-src data: and style-src 'unsafe-inline'.
    // style-src 'nonce-${nonce}' works but Babylon uses dynamic styles in a variety of places.
    return /* html */ `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head lang="en">
        <title>Babylon.js Sandbox - View glTF, glb, obj and babylon files</title>
        <meta http-equiv="Content-Security-Policy" content="default-src ${webview.cspSource} ${cspBabylon} 'nonce-${nonce}'; img-src ${webview.cspSource} ${cspBabylon} blob: data:; style-src ${webview.cspSource} ${cspTypekit} 'unsafe-inline'; font-src ${cspTypekit};">
        <meta name="description" content="Viewer for glTF, glb, obj and babylon files powered by Babylon.js" />
        <meta name="keywords" content="Babylon.js, Babylon, BabylonJS, glTF, glb, obj, viewer, online viewer, 3D model viewer, 3D, webgl" />
        <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1">

        <script nonce="${nonce}" src="https://preview.babylonjs.com/ammo.js"></script>
        <script nonce="${nonce}" src="https://preview.babylonjs.com/cannon.js"></script>
        <script nonce="${nonce}" src="https://preview.babylonjs.com/Oimo.js"></script>

        <link rel="stylesheet" href="https://use.typekit.net/cta4xsb.css">
        <link rel="stylesheet" href="${styleUri}">
        <style nonce="${nonce}">
          html,
          body, #host-element {
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            overflow: hidden;
          }
          /* Workaround for disallowed dynamic styling of loadingScreen.js */
          /* Not needed when style-src 'unsafe-inline' is active.
          @-webkit-keyframes spin1 {
            0% { -webkit-transform: rotate(0deg); }
            100% { -webkit-transform: rotate(360deg); }
          }
          @keyframes spin1 {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          */
        </style>
      </head>
      <body>
        <div id="host-element"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
