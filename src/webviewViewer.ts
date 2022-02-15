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
      const editable = message.body.editable;
      console.log(`init(assetUrl:${assetUrl} editable:${editable})`);
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

console.log("ready");
const vscode = acquireVsCodeApi();
vscode.postMessage({ type: "ready" });
