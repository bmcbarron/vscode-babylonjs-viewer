import * as vscode from "vscode";
import { getExtension } from "./common";

export type Digest = Array<[string, string]>;

export class AssetDisposed extends Error {}

export class AssetDocument implements vscode.CustomDocument {
  static async create(uri: vscode.Uri): Promise<AssetDocument> {
    return new AssetDocument(uri);
  }

  get extension() {
    return getExtension(this.uri);
  }

  // TODO: Create LRU cache of digests per document.
  get digest() {
    // TODO: Wrap in readonly proxy
    return this.digest_;
  }
  private digest_: Digest = [];

  get onDidDigestChange() {
    return this.onDidDigestChange_.event;
  }
  private onDidDigestChange_ = new vscode.EventEmitter<void>();

  get isDigestFinal() {
    return this.finalized_;
  }
  private finalized_ = false;
  private disposed_ = false;

  constructor(readonly uri: vscode.Uri) {}

  appendToDigest(args: { entries?: Digest; finalize?: boolean }) {
    if (this.disposed_) {
      throw new AssetDisposed();
    }
    if (this.finalized_) {
      throw new Error("AssetDocument.appendToDigest() after finalize");
    }
    this.digest_.push(...(args.entries ?? []));
    this.finalized_ = args.finalize ?? false;
    this.onDidDigestChange_.fire();
  }

  dispose(): void {
    this.disposed_ = true;
  }
}
