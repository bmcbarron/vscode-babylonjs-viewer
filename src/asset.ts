import * as vscode from "vscode";
import { getExtension } from "./common";

export type InfoTable = Array<[string, string]>;

export class AssetDisposed extends Error {}

export class AssetDocument implements vscode.CustomDocument {
  static async create(uri: vscode.Uri): Promise<AssetDocument> {
    return new AssetDocument(uri);
  }

  get extension() {
    return getExtension(this.uri);
  }

  // TODO: Create LRU cache of infos per document.
  get info() {
    // TODO: Wrap in readonly proxy
    return this.info_;
  }
  private info_: InfoTable = [];

  get onDidInfoChange() {
    return this.onDidInfoChange_.event;
  }
  private onDidInfoChange_ = new vscode.EventEmitter<void>();

  get isInfoFinal() {
    return this.finalized_;
  }
  private finalized_ = false;
  private disposed_ = false;

  constructor(readonly uri: vscode.Uri) {}

  addInfo(args: { entries?: InfoTable; finalize?: boolean }) {
    if (this.disposed_) {
      throw new AssetDisposed();
    }
    if (this.finalized_) {
      throw new Error("AssetDocument.addInfo() after finalize");
    }
    this.info_.push(...(args.entries ?? []));
    this.finalized_ = args.finalize ?? false;
    this.onDidInfoChange_.fire();
  }

  dispose(): void {
    this.disposed_ = true;
  }
}
