import { Sandbox } from "./sandbox";

const hostEl = document.getElementById("host-element");
if (hostEl) {
  const sandbox = new Sandbox({});
  hostEl.innerHTML = sandbox.render();
  sandbox.componentDidMount();
} else {
  console.error("Missing host-element");
}
