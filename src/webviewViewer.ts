import { Sandbox } from "./sandbox/src/sandbox";

const hostElement = document.getElementById("host-element");
if (!hostElement) {
  throw new Error("Missing host-element");
}

let didInit = false;

window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.type) {
    case "init":
      const assetUrl = message.body.uri;
      if (!didInit) {
        Sandbox.Show(hostElement, { assetUrl });
        // TODO: Hack
        didInit = true;
      } else {
        Sandbox.Update(assetUrl);
      }
      break;
  }
});

const vscode = acquireVsCodeApi();
vscode.postMessage({ type: "ready" });
