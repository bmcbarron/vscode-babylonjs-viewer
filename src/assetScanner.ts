import * as vscode from "vscode";
import { AssetDisposed, AssetDocument } from "./asset";
import { friendlySize, wrappableFilename } from "./common";

// Asynchronously computes summary information for `doc`, and adds it to the doc's `Digest`.
// TODO: Add more file-format-specific data (# of meshes, vertices, textures, etc).
export async function summarizeAsset(doc: AssetDocument): Promise<void> {
  try {
    doc.appendToDigest({
      entries: [["path", wrappableFilename(doc.uri.fsPath)]],
    });
    const stat = await vscode.workspace.fs.stat(doc.uri);
    doc.appendToDigest({
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
