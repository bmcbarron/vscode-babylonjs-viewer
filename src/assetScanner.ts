import * as vscode from "vscode";
import { AssetDisposed, AssetDocument } from "./asset";
import { friendlySize } from "./common";

// Asynchronously computes summary information for `doc`, and adds it to the doc's `InfoTable`.
export async function scanAssetInfo(doc: AssetDocument): Promise<void> {
  try {
    doc.addInfo({ entries: [["path", doc.uri.fsPath]] });
    const stat = await vscode.workspace.fs.stat(doc.uri);
    doc.addInfo({
      entries: [["size", friendlySize(stat.size)]],
      finalize: true,
    });
  } catch (err) {
    if (err instanceof AssetDisposed) {
      // This is expected when the user closes the document before scanning completes.
    } else {
      throw err;
    }
  }
}
