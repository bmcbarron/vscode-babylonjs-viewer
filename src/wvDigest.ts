const vscode = acquireVsCodeApi();

const renderInViewer = document.getElementById(
  "render-in-viewer"
) as HTMLButtonElement;
renderInViewer.onclick = () => {
  vscode.postMessage({ type: "render-in-viewer" });
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
  vscode.postMessage({
    type: "update-default-open-as-text",
    body: { enabled: defaultOpenAsText.checked },
  });
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

function handleDigest(digest: Array<[string, string]>, final: boolean) {
  const table = document.getElementById("digest") as HTMLTableElement;
  if (!table) {
    console.warn("Missing digest");
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

  for (let [k, v] of digest) {
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
  } else if (type === "digest") {
    const digest = body["digest"] as Array<[string, string]>;
    const final = body["final"] as boolean;
    handleDigest(digest, final);
  }
});
vscode.postMessage({ type: "ready" });
