import { Sandbox } from "./sandbox/src/sandbox";

// eslint-disable-next-line @typescript-eslint/naming-convention
interface vscode {
  postMessage(message: any): void;
}
declare function acquireVsCodeApi(): vscode;

const hostElement = document.getElementById("host-element");
if (!hostElement) {
  throw new Error("Missing host-element");
}

window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.type) {
    case "init":
      const assetUrl = message.body.uri;
      Sandbox.Show(hostElement, { assetUrl });
      break;
  }
});

const vscode: vscode = acquireVsCodeApi();
vscode.postMessage({ type: "ready" });
