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

window.addEventListener("message", (event) => {
  const { type, body } = event.data;
  if (type !== "info") {
    return;
  }
  const info = body["info"] as Array<[string, string]>;
  const final = body["final"] as boolean;

  const table = document.getElementById("info-table") as HTMLTableElement;
  if (!table) {
    console.warn("Missing info-table");
    return;
  }
  while (table.lastChild) {
    table.lastChild?.remove();
  }

  const header = document.createElement("tr");
  const khdr = document.createElement("th");
  khdr.innerText = "Attribute";
  const vhdr = document.createElement("th");
  vhdr.innerText = "Value";
  header.append(khdr, vhdr);
  table.append(header);

  for (let [k, v] of info) {
    const row = document.createElement("tr");
    const kcol = document.createElement("td");
    kcol.innerText = k;
    const vcol = document.createElement("td");
    vcol.innerText = v;
    row.append(kcol, vcol);
    table.append(row);
  }

  if (!final) {
    const row = document.createElement("tr");
    const kcol = document.createElement("td");
    kcol.className = "icon";
    kcol.innerHTML = /* html */ `<i class="codicon codicon-loading codicon-modifier-spin"></i>`;
    const vcol = document.createElement("td");
    row.append(kcol, vcol);
    table.append(row);
  }
});

vscode.postMessage({ type: "ready" });