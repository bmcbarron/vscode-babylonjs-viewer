const vscode = acquireVsCodeApi();

const openInViewer = document.getElementById(
  "open-in-viewer"
) as HTMLButtonElement;
openInViewer.onclick = () => {
  vscode.postMessage({ type: "open-in-viewer" });
};

const openAsText = document.getElementById("open-as-text") as HTMLAnchorElement;
openAsText.onclick = () => {
  vscode.postMessage({ type: "open-as-text" });
  return false;
};

const defaultOpenAsText = document.getElementById(
  "default-open-as-text"
) as HTMLInputElement;
defaultOpenAsText.onclick = (e) => {
  console.log(`defaultOpenAsText: ${defaultOpenAsText.checked}`);
};

const viewport = document.getElementById("viewport");

const topShadow = document.createElement("div");
topShadow.className = "top effect";
viewport?.prepend(topShadow);

const bottomShadow = document.createElement("div");
bottomShadow.className = "bottom effect";
viewport?.append(bottomShadow);

function updateShadows() {
  if (!viewport) {
    return;
  }
  const scrollBottom = Math.max(
    0,
    viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop
  );
  // scrollTop/scrollBottom: [0, 10] => opacity: [0, 1]
  const topOpacity = Math.min(1, viewport.scrollTop * 0.1);
  topShadow.style.opacity = topOpacity.toFixed(1);
  const bottomOpacity = Math.min(1, scrollBottom * 0.1);
  bottomShadow.style.opacity = bottomOpacity.toFixed(1);
  // Avoid obscuring the scrollbar.
  const scrollbarWidth = viewport.offsetWidth - viewport.clientWidth;
  topShadow.style.right = scrollbarWidth.toFixed(0);
  bottomShadow.style.right = scrollbarWidth.toFixed(0);
}
viewport?.addEventListener("scroll", updateShadows);
updateShadows();

const activeBorderClass = "border effect";
const activeBorder = document.createElement("div");
activeBorder.className = activeBorderClass;
viewport?.prepend(activeBorder);

function handleState(active: boolean) {
  activeBorder.className = `${activeBorderClass}${active ? "" : " hidden"}`;
}

function handleInfo(info: Array<[string, string]>, final: boolean) {
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
}

window.addEventListener("message", (event) => {
  const { type, body } = event.data;
  if (type === "state") {
    const active = body["active"] as boolean;
    handleState(active);
  } else if (type === "info") {
    const info = body["info"] as Array<[string, string]>;
    const final = body["final"] as boolean;
    handleInfo(info, final);
  }
});
vscode.postMessage({ type: "ready" });
