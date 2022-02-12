import { FilesInput } from "@babylonjs/core/Misc/filesInput";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { IGLTFLoaderExtension } from "@babylonjs/loaders/glTF/glTFFileLoader";

export class GlobalState {
  public currentScene!: Scene;
  public onSceneLoaded = new Observable<{ scene: Scene; filename: string }>();
  public onError = new Observable<{ scene?: Scene; message?: string }>();
  public onEnvironmentChanged = new Observable<string>();
  public onRequestClickInterceptor = new Observable<void>();
  public onClickInterceptorClicked = new Observable<void>();
  public glTFLoaderExtensions: { [key: string]: IGLTFLoaderExtension } = {};

  public filesInput!: FilesInput;
  public isDebugLayerEnabled = false;

  public commerceMode = false;

  public reflector?: {
    hostname: string;
    port: number;
  };

  public skybox = true;

  public showDebugLayer() {
    this.isDebugLayerEnabled = true;
    if (this.currentScene) {
      this.currentScene.debugLayer.show();
    }
  }

  public hideDebugLayer() {
    this.isDebugLayerEnabled = false;
    if (this.currentScene) {
      this.currentScene.debugLayer.hide();
    }
  }
}
