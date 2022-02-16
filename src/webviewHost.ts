import * as vscode from "vscode";

type MessageArgs = Record<string, unknown>;
type MessageCallback = (params: MessageArgs) => void;

export class WebviewHost {
  private readonly handlers = new Map<string, MessageCallback>();

  constructor(
    private readonly _args: {
      readonly webview: vscode.Webview;
      readonly title: string;
      readonly description: string;
      readonly contentSecurityPolicies: Record<string, string>;
      readonly uriRoot: vscode.Uri;
      readonly styleFilenames: Array<string | vscode.Uri>;
      readonly scriptFilenames: Array<string | vscode.Uri>;
      readonly content: string;
    }
  ) {
    this._args.webview.options = {
      enableScripts: true,
    };
    this._args.webview.html = this._getHtml();
    this._args.webview.onDidReceiveMessage((e) => {
      this.handlers.get(e.type)?.(e.body);
    });
  }

  post(messageType: string, params?: MessageArgs) {
    this._args.webview.postMessage({
      type: messageType,
      body: params ?? {},
    });
  }

  on(messageType: string, callback: MessageCallback) {
    this.handlers.set(messageType, callback);
  }

  asUri(filename: string | vscode.Uri): string {
    let result: vscode.Uri;
    if (filename instanceof vscode.Uri) {
      result = filename;
    } else if (filename.startsWith("https://")) {
      return filename;
    } else {
      result = vscode.Uri.joinPath(this._args.uriRoot, "dist", filename);
    }
    if (result.scheme === "file") {
      result = this._args.webview.asWebviewUri(result);
    }
    return `${result}`;
  }

  private _getHtml() {
    const styles = this._args.styleFilenames.map((f) => this.asUri(f));
    const scripts = this._args.scriptFilenames.map((f) => this.asUri(f));
    const policy = Object.entries(this._args.contentSecurityPolicies)
      .map(([key, value]) => `${key} ${value}`)
      .join(`; `);

    return /* html */ `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head lang="en">
        <title>${this._args.title}</title>
        <meta http-equiv="Content-Security-Policy" content="${policy}">
        <meta name="description" content="${this._args.description}" />
        <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1">

        ${styles
          .map((uri) => /* html */ `<link href="${uri}" rel="stylesheet" />`)
          .join("\n")}

        ${scripts
          .map(
            (uri) => /* html */ `<script src="${uri}" defer="true"></script>`
          )
          .join("\n")}
      </head>
      <body>${this._args.content}</body>
      </html>`;
  }
}
