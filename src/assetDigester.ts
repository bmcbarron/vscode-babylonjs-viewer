import * as vscode from "vscode";
import { BabylonFileFormat } from "../static/types/babylon";
import { AssetDisposed, AssetDocument } from "./asset";
import { friendlyTimestamp, friendlySize, wrappableFilename } from "./common";
import { KeysOfType, Merge } from "./types";

async function digestBabylonFile(doc: AssetDocument, data: Uint8Array) {
  const decoder = new TextDecoder();
  const json = JSON.parse(decoder.decode(data)) as BabylonFileFormat;

  type BabylonArrayKeys = KeysOfType<BabylonFileFormat, Array<object>>;
  const arrayNames: BabylonArrayKeys[] = [
    "cameras",
    "lights",
    "materials",
    "meshes",
    "particleSystems",
    "actions",
    "sounds",
  ];
  for (const fieldName of arrayNames) {
    const values = json[fieldName] ?? [];
    type ElementType = Merge<typeof values[0]>;
    const labels = values
      .map((el: ElementType) => el.name ?? el.id ?? el.emitterId)
      .filter((l) => !!l);
    if (labels.length) {
      doc.appendToDigest({
        entries: [[`${fieldName}`, `[${values.length}] ${labels.join(", ")}`]],
      });
    }
  }
}

type FileDigester = (doc: AssetDocument, data: Uint8Array) => void;
const digesters: Record<string, FileDigester | undefined> = {
  ".babylon": digestBabylonFile,
};

// Asynchronously computes summary information for `doc`, and adds it to the doc's `Digest`.
// TODO: Add more file-format-specific data (# of meshes, vertices, textures, etc).
export async function digestAsset(doc: AssetDocument): Promise<void> {
  try {
    doc.appendToDigest({
      entries: [["path", wrappableFilename(doc.uri.fsPath)]],
    });
    const stat = await vscode.workspace.fs.stat(doc.uri);
    doc.appendToDigest({
      entries: [
        ["size", friendlySize(stat.size)],
        ["modified", friendlyTimestamp(new Date(stat.mtime))],
      ],
    });
    const digester = digesters[doc.extension];
    if (digester) {
      const contents = await vscode.workspace.fs.readFile(doc.uri);
      await digester(doc, contents);
    }
    doc.appendToDigest({ finalize: true });
  } catch (err) {
    if (err instanceof AssetDisposed) {
      // This is expected when the user closes the document before scanning completes.
    } else {
      throw err;
    }
  }
}
