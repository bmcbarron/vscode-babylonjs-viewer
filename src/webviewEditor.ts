console.log("editor ready");

const vscode = acquireVsCodeApi();

const openInViewer = document.getElementById(
  "open-in-viewer"
) as HTMLButtonElement;
openInViewer.onclick = () => {
  vscode.postMessage({ type: "open-in-viewer" });
};

const openAsText = document.getElementById("open-as-text") as HTMLButtonElement;
openAsText.onclick = () => {
  vscode.postMessage({ type: "open-as-text" });
};
