import * as vscode from "vscode";
import { getExtension, supportedExtensions } from "./common";
import { WebviewHost } from "./webviewHost";

export const viewId = "babylonjs.assetViewer";
export const shortTitle = "Asset Viewer";
export const title = `Babylon.js ${shortTitle}`;
export const description = "Renders glTF, glb, obj, and babylon assets";
export const commandShow = `${viewId}.show`;
export const commandOpen = `${viewId}.open`;
export const commandFocus = `${viewId}.focus`;

class AssetViewerProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _host?: WebviewHost;
  private _isReady = false;
  private _assetUri?: vscode.Uri;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.description = description;

    const cspOrigin = webviewView.webview.cspSource;
    const cspTypekit = "https://*.typekit.net";
    const cspBabylon = "https://*.babylonjs.com";

    this._host = new WebviewHost({
      webview: webviewView.webview,
      title,
      description,
      contentSecurityPolicies: {
        "default-src": `${cspOrigin} ${cspBabylon}`,
        // The Babylon.js Sandbox relies on data svgs, so we allow "data:" for now.
        "img-src": `${cspOrigin} ${cspBabylon} blob: data:`,
        // The Babylon.js Sandbox relies on dynamically created inline styles, so we allow
        // "'unsafe-inline'"" for now.
        "style-src": `${cspOrigin} ${cspTypekit} 'unsafe-inline'`,
        "font-src": `${cspTypekit}`,
      },
      uriRoot: this.context.extensionUri,
      styleFilenames: [
        "https://use.typekit.net/cta4xsb.css",
        "viewer.css",
        "webviewViewer.css",
      ],
      scriptFilenames: [
        "https://preview.babylonjs.com/ammo.js",
        "https://preview.babylonjs.com/cannon.js",
        "https://preview.babylonjs.com/Oimo.js",
        "webviewViewer.js",
      ],
      content: /* html */ `<div id="host-element" />`,
    });

    this._host.on("ready", () => {
      this._isReady = true;
      this._postAssetUri();
    });
  }

  public show() {
    console.log(`AssetViewProvider.show()`);
    if (this._view) {
      this._view.show(true);
    } else {
      console.warn(`${title} is not available`);
    }
  }

  public open(uri: vscode.Uri) {
    console.log(`AssetViewProvider.open(${uri})`);
    this._setAssetUri(uri);
    if (this._view) {
      this._view.show(true);
    } else {
      console.warn(`${title} is not available`);
    }
  }

  private _setAssetUri(uri: vscode.Uri) {
    if (`${uri}` !== `${this._assetUri}`) {
      this._assetUri = uri;
      if (this._isReady) {
        this._postAssetUri();
      }
    } else {
      console.log(`ignoring matching ${uri}`);
    }
  }

  private _postAssetUri() {
    console.log(`_updateAssetUri: ${this._assetUri}`);
    if (!this._assetUri || this._assetUri.scheme === "untitled") {
      console.log("untitled");
      this._host?.post("init");
    } else {
      const editable = vscode.workspace.fs.isWritableFileSystem(
        this._assetUri.scheme
      );
      const uri = this._host?.asUri(this._assetUri);
      console.log(`uri: ${uri}`);
      this._host?.post("init", { uri, editable });
    }
  }
}

export function register(
  context: vscode.ExtensionContext
): vscode.Disposable[] {
  const provider = new AssetViewerProvider(context);

  const result: vscode.Disposable[] = [];
  result.push(
    vscode.window.registerWebviewViewProvider(viewId, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  result.push(
    vscode.commands.registerCommand(commandShow, () => {
      provider.show();
    })
  );

  result.push(
    vscode.commands.registerCommand(commandOpen, (uri) => {
      console.log(`opening in viewer ${uri}`);
      if (
        uri instanceof vscode.Uri &&
        supportedExtensions.includes(getExtension(uri))
      ) {
        provider.open(uri);
      }
    })
  );

  // // TODO: Change this to use the Tab model API, which is proposed and nearing release.
  // // https://github.com/microsoft/vscode/issues/133532
  // result.push(vscode.window.onDidChangeActiveTextEditor(
  //   (editor) => {
  //     console.log(`onDidChangeActiveTextEditor(${editor?.document.uri})`);
  //     checkUri(editor?.document.uri);
  //   }
  // ));

  return result;
}
