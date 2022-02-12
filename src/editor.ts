// Based on https://github.com/microsoft/vscode-extension-samples/blob/main/custom-editor-sample
import * as vscode from "vscode";

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function disposeAll(disposables: vscode.Disposable[]): void {
  while (disposables.length) {
    const item = disposables.pop();
    if (item) {
      item.dispose();
    }
  }
}

abstract class Disposable {
  private _isDisposed = false;

  protected _disposables: vscode.Disposable[] = [];

  public dispose(): any {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    disposeAll(this._disposables);
  }

  protected _register<T extends vscode.Disposable>(value: T): T {
    if (this._isDisposed) {
      value.dispose();
    } else {
      this._disposables.push(value);
    }
    return value;
  }

  protected get isDisposed(): boolean {
    return this._isDisposed;
  }
}

class SandboxDocument extends Disposable implements vscode.CustomDocument {
  static async create(uri: vscode.Uri): Promise<SandboxDocument> {
    // If we have a backup, read that. Otherwise read the resource from the workspace
    // const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
    // const fileData = await PawDrawDocument.readFile(dataFile);
    return new SandboxDocument(uri); // , fileData, delegate);
  }

  private readonly _onDidDispose = this._register(
    new vscode.EventEmitter<void>()
  );
  public readonly onDidDispose = this._onDidDispose.event;

  private constructor(readonly uri: vscode.Uri) {
    super();
  }

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
    const document: SandboxDocument = await SandboxDocument.create(uri);
    // , openContext.backupId, {
    // 	getFileData: async () => {
    // 		const webviewsForDocument = Array.from(this.webviews.get(document.uri));
    // 		if (!webviewsForDocument.length) {
    // 			throw new Error('Could not find webview to save for');
    // 		}
    // 		const panel = webviewsForDocument[0];
    // 		const response = await this.postMessageWithResponse<number[]>(panel, 'getFileData', {});
    // 		return new Uint8Array(response);
    // 	}
    // });

    const listeners: vscode.Disposable[] = [];

    // listeners.push(document.onDidChange(e => {
    // 	// Tell VS Code that the document has been edited by the use.
    // 	this._onDidChangeCustomDocument.fire({
    // 		document,
    // 		...e,
    // 	});
    // }));

    // listeners.push(document.onDidChangeContent(e => {
    // 	// Update all webviews when the document changes
    // 	for (const webviewPanel of this.webviews.get(document.uri)) {
    // 		this.postMessage(webviewPanel, 'update', {
    // 			edits: e.edits,
    // 			content: e.content,
    // 		});
    // 	}
    // }));

    document.onDidDispose(() => disposeAll(listeners));

    return document;
  }

  async resolveCustomEditor(
    document: SandboxDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Add the webview to our internal set of active webviews
    // TODO: this.webviews.add(document.uri, webviewPanel);

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    webviewPanel.webview.onDidReceiveMessage((e) =>
      this.onMessage(document, e)
    );

    // Wait for the webview to be properly ready before we init
    webviewPanel.webview.onDidReceiveMessage((e) => {
      if (e.type === "ready") {
        if (document.uri.scheme === "untitled") {
          this.postMessage(webviewPanel, "init", {
            untitled: true,
            editable: true,
          });
        } else {
          const editable = vscode.workspace.fs.isWritableFileSystem(
            document.uri.scheme
          );
          const uri = webviewPanel.webview
            .asWebviewUri(document.uri)
            .toString();
          console.log(`init editable:${editable} uri:${uri}`);
          this.postMessage(webviewPanel, "init", { uri, editable });
        }
      }
    });
  }

  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentEditEvent<SandboxDocument>
  >();
  public readonly onDidChangeCustomDocument =
    this._onDidChangeCustomDocument.event;

  // public saveCustomDocument(document: SandboxDocument, cancellation: vscode.CancellationToken): Thenable<void> {
  // 	return document.save(cancellation);
  // }

  // public saveCustomDocumentAs(document: SandboxDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
  // 	return document.saveAs(destination, cancellation);
  // }

  // public revertCustomDocument(document: SandboxDocument, cancellation: vscode.CancellationToken): Thenable<void> {
  // 	return document.revert(cancellation);
  // }

  // public backupCustomDocument(document: SandboxDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
  // 	return document.backup(context.destination, cancellation);
  // }

  //#endregion

  /**
   * Get the static HTML used for in our editor's webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.css")
    );

    // Use a nonce to identify the inline elements which are allowed.
    const nonce = getNonce();
    console.log(`extensionUri: ${this.context.extensionUri}`);
    console.log(`scriptUri: ${scriptUri}`);

    const cspTypekit = "https://*.typekit.net";

    // This html template is a hybrid of sandbox/public/index.html and
    // https://github.com/microsoft/vscode-extension-samples/blob/main/custom-editor-sample/src/pawDrawEditor.ts
    // TODO: We are currently more lax than we'd like on C-S-P, with img-src data: and style-src 'unsafe-inline'.
    // style-src nonce works but Babylon uses dynamic styles in a few places.
    return /* html */ `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head lang="en">
        <title>Babylon.js Sandbox - View glTF, glb, obj and babylon files</title>
        <meta http-equiv="Content-Security-Policy" content="default-src ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource} blob: data:; style-src ${webview.cspSource} ${cspTypekit} 'nonce-${nonce}'; font-src ${cspTypekit};">
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
          @-webkit-keyframes spin1 {
            0% { -webkit-transform: rotate(0deg); }
            100% { -webkit-transform: rotate(360deg); }
          }
          @keyframes spin1 {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

        </style>
      </head>
      <body>
        <div id="host-element"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private _requestId = 1;
  private readonly _callbacks = new Map<number, (response: any) => void>();

  private postMessageWithResponse<R = unknown>(
    panel: vscode.WebviewPanel,
    type: string,
    body: any
  ): Promise<R> {
    const requestId = this._requestId++;
    const p = new Promise<R>((resolve) =>
      this._callbacks.set(requestId, resolve)
    );
    panel.webview.postMessage({ type, requestId, body });
    return p;
  }

  private postMessage(
    panel: vscode.WebviewPanel,
    type: string,
    body: any
  ): void {
    panel.webview.postMessage({ type, body });
  }

  private onMessage(document: SandboxDocument, message: any) {
    switch (message.type) {
      case "response": {
        const callback = this._callbacks.get(message.requestId);
        callback?.(message.body);
        return;
      }
    }
  }
}
