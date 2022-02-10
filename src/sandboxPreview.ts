import path = require("path");
import * as vscode from "vscode";
import { getNonce } from "./util";

export function disposeAll(disposables: vscode.Disposable[]): void {
  while (disposables.length) {
    const item = disposables.pop();
    if (item) {
      item.dispose();
    }
  }
}

export abstract class Disposable {
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
    // // Local path to script and css for the webview
    // const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
    // 	this._context.extensionUri, 'media', 'pawDraw.js'));

    // const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
    // 	this._context.extensionUri, 'media', 'reset.css'));

    // const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
    // 	this._context.extensionUri, 'media', 'vscode.css'));

    // const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
    // 	this._context.extensionUri, 'media', 'pawDraw.css'));

    // // Use a nonce to whitelist which scripts can be run
    // const nonce = getNonce();

    // return /* html */`
    // 	<!DOCTYPE html>
    // 	<html lang="en">
    // 	<head>
    // 		<meta charset="UTF-8">
    // 		<!--
    // 		Use a content security policy to only allow loading images from https or from our extension directory,
    // 		and only allow scripts that have a specific nonce.
    // 		-->
    // 		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    // 		<meta name="viewport" content="width=device-width, initial-scale=1.0">
    // 		<link href="${styleResetUri}" rel="stylesheet" />
    // 		<link href="${styleVSCodeUri}" rel="stylesheet" />
    // 		<link href="${styleMainUri}" rel="stylesheet" />
    // 		<title>Paw Draw</title>
    // 	</head>
    // 	<body>
    // 		<div class="drawing-canvas"></div>
    // 		<div class="drawing-controls">
    // 			<button data-color="black" class="black active" title="Black"></button>
    // 			<button data-color="white" class="white" title="White"></button>
    // 			<button data-color="red" class="red" title="Red"></button>
    // 			<button data-color="green" class="green" title="Green"></button>
    // 			<button data-color="blue" class="blue" title="Blue"></button>
    // 		</div>
    // 		<script nonce="${nonce}" src="${scriptUri}"></script>
    // 	</body>
    // 	</html>`;

    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "index.js")
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return /* html */ `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">

      <head>
        <title>Babylon.js Sandbox - View glTF, glb, obj and babylon files</title>
        <meta name="description" content="Viewer for glTF, glb, obj and babylon files powered by Babylon.js" />
        <meta name="keywords" content="Babylon.js, Babylon, BabylonJS, glTF, glb, obj, viewer, online viewer, 3D model viewer, 3D, webgl" />
        <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1">
        <link rel="stylesheet" href="https://use.typekit.net/cta4xsb.css">
        <link rel="shortcut icon" href="https://www.babylonjs.com/favicon.ico">

        <script src="https://preview.babylonjs.com/ammo.js"></script>
        <script src="https://preview.babylonjs.com/cannon.js"></script>
        <script src="https://preview.babylonjs.com/Oimo.js"></script>

        <!-- <script src="dist/babylon.sandbox.js"></script> -->

        <style>
          html,
          body {
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            overflow: hidden;
          }

          #host-element {
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            overflow: hidden;
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
      // case "stroke":
      //   document.makeEdit(message as PawDrawEdit);
      //   return;

      case "response": {
        const callback = this._callbacks.get(message.requestId);
        callback?.(message.body);
        return;
      }
    }
  }

  // /**
  //  * Called when our custom editor is opened.
  //  *
  //  *
  //  */
  // public async resolveCustomTextEditor(
  //   document: vscode.TextDocument,
  //   webviewPanel: vscode.WebviewPanel,
  //   _token: vscode.CancellationToken
  // ): Promise<void> {
  //   // Setup initial content for the webview
  //   webviewPanel.webview.options = {
  //     enableScripts: true,
  //   };
  //   webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

  //   console.log("resolveCustomTextEditor");

  //   function updateWebview() {
  //     const text = document.getText();
  //     console.log(`sending update [len=${text.length}]`);
  //     webviewPanel.webview.postMessage({
  //       type: "update",
  //       text,
  //       fileName: document.fileName,
  //     });
  //   }

  //   // Hook up event handlers so that we can synchronize the webview with the text document.
  //   //
  //   // The text document acts as our model, so we have to sync change in the document to our
  //   // editor and sync changes in the editor back to the document.
  //   //
  //   // Remember that a single text document can also be shared between multiple custom
  //   // editors (this happens for example when you split a custom editor)

  //   const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
  //     (e) => {
  //       if (e.document.uri.toString() === document.uri.toString()) {
  //         updateWebview();
  //       }
  //     }
  //   );

  //   // Make sure we get rid of the listener when our editor is closed.
  //   webviewPanel.onDidDispose(() => {
  //     changeDocumentSubscription.dispose();
  //   });

  //   // Receive message from the webview.
  //   webviewPanel.webview.onDidReceiveMessage((e) => {
  //     switch (e.type) {
  //       case "add":
  //         // this.addNewScratch(document);
  //         return;

  //       case "delete":
  //         // this.deleteScratch(document, e.id);
  //         return;
  //     }
  //   });

  //   setTimeout(() => updateWebview(), 5000);
  //   // updateWebview();
  // }

  // /**
  //  * Get the static html used for the editor webviews.
  //  */
  // private getHtmlForWebview(webview: vscode.Webview): string {
  //   // Local path to script and css for the webview
  //   const scriptUri = webview.asWebviewUri(
  //     vscode.Uri.joinPath(this.context.extensionUri, "dist", "index.js")
  //   );

  //   // const styleResetUri = webview.asWebviewUri(
  //   //   vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css")
  //   // );

  //   // const styleVSCodeUri = webview.asWebviewUri(
  //   //   vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css")
  //   // );

  //   // const styleMainUri = webview.asWebviewUri(
  //   //   vscode.Uri.joinPath(this.context.extensionUri, "media", "catScratch.css")
  //   // );

  //   // Use a nonce to whitelist which scripts can be run
  //   const nonce = getNonce();

  //   // return /* html */ `
  //   // 	<!DOCTYPE html>
  //   // 	<html lang="en">
  //   // 	<head>
  //   // 		<meta charset="UTF-8">
  //   // 		<!--
  //   // 		Use a content security policy to only allow loading images from https or from our extension directory,
  //   // 		and only allow scripts that have a specific nonce.
  //   // 		-->
  //   // 		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  //   // 		<meta name="viewport" content="width=device-width, initial-scale=1.0">
  //   // 		<link href="${styleResetUri}" rel="stylesheet" />
  //   // 		<link href="${styleVSCodeUri}" rel="stylesheet" />
  //   // 		<link href="${styleMainUri}" rel="stylesheet" />
  //   // 		<title>Cat Scratch</title>
  //   // 	</head>
  //   // 	<body>
  //   // 		<div class="notes">
  //   // 			<div class="add-button">
  //   // 				<button>Scratch!</button>
  //   // 			</div>
  //   // 		</div>

  //   // 		<script nonce="${nonce}" src="${scriptUri}"></script>
  //   // 	</body>
  //   // 	</html>`;

  //   // const scriptPathOnDisk = vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'extension.js'));
  //   // const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });

  //   return /* html */ `
  //     <!DOCTYPE html>
  //     <html xmlns="http://www.w3.org/1999/xhtml">

  //     <head>
  //       <title>Babylon.js Sandbox - View glTF, glb, obj and babylon files</title>
  //       <meta name="description" content="Viewer for glTF, glb, obj and babylon files powered by Babylon.js" />
  //       <meta name="keywords" content="Babylon.js, Babylon, BabylonJS, glTF, glb, obj, viewer, online viewer, 3D model viewer, 3D, webgl" />
  //       <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1">
  //       <link rel="stylesheet" href="https://use.typekit.net/cta4xsb.css">
  //       <link rel="shortcut icon" href="https://www.babylonjs.com/favicon.ico">

  //       <script src="https://preview.babylonjs.com/ammo.js"></script>
  //       <script src="https://preview.babylonjs.com/cannon.js"></script>
  //       <script src="https://preview.babylonjs.com/Oimo.js"></script>

  //       <!-- <script src="dist/babylon.sandbox.js"></script> -->

  //       <style>
  //         html,
  //         body {
  //           width: 100%;
  //           height: 100%;
  //           padding: 0;
  //           margin: 0;
  //           overflow: hidden;
  //         }

  //         #host-element {
  //           width: 100%;
  //           height: 100%;
  //           padding: 0;
  //           margin: 0;
  //           overflow: hidden;
  //         }
  //       </style>
  //     </head>

  //     <body>
  //       <div id="host-element"></div>
  //       <script nonce="${nonce}" src="${scriptUri}"></script>
  //     </body>

  //     </html>`;
  // }

  // /**
  //  * Add a new scratch to the current document.
  //  */
  // // private addNewScratch(document: vscode.TextDocument) {
  // // 	const json = this.getDocumentAsJson(document);
  // // 	const character = CatScratchEditorProvider.scratchCharacters[Math.floor(Math.random() * CatScratchEditorProvider.scratchCharacters.length)];
  // // 	json.scratches = [
  // // 		...(Array.isArray(json.scratches) ? json.scratches : []),
  // // 		{
  // // 			id: getNonce(),
  // // 			text: character,
  // // 			created: Date.now(),
  // // 		}
  // // 	];

  // // 	return this.updateTextDocument(document, json);
  // // }

  // /**
  //  * Delete an existing scratch from a document.
  //  */
  // // private deleteScratch(document: vscode.TextDocument, id: string) {
  // // 	const json = this.getDocumentAsJson(document);
  // // 	if (!Array.isArray(json.scratches)) {
  // // 		return;
  // // 	}

  // // 	json.scratches = json.scratches.filter((note: any) => note.id !== id);

  // // 	return this.updateTextDocument(document, json);
  // // }

  // /**
  //  * Try to get a current document as json text.
  //  */
  // private getDocumentAsJson(document: vscode.TextDocument): any {
  //   const text = document.getText();
  //   // if (text.trim().length === 0) {
  //   //   return {};
  //   // }

  //   try {
  //     return JSON.parse(text);
  //   } catch {
  //     throw new Error(
  //       "Could not get document as json. Content is not valid json"
  //     );
  //   }
  // }

  // /**
  //  * Write out the json to a given document.
  //  */
  // private updateTextDocument(document: vscode.TextDocument, json: any) {
  //   const edit = new vscode.WorkspaceEdit();

  //   // Just replace the entire document every time for this example extension.
  //   // A more complete extension should compute minimal edits instead.
  //   edit.replace(
  //     document.uri,
  //     new vscode.Range(0, 0, document.lineCount, 0),
  //     JSON.stringify(json, null, 2)
  //   );

  //   return vscode.workspace.applyEdit(edit);
  // }
}
