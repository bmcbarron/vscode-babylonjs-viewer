// import { Observable } from 'babylonjs/Misc/observable';
// import { Scene } from 'babylonjs/scene';
// import { FilesInput } from 'babylonjs/Misc/filesInput';
import { FilesInput, Observable, Scene } from "@babylonjs/core";
import { IGLTFLoaderExtension } from "@babylonjs/loaders";

export class GlobalState {
  public currentScene!: Scene; // TODO: !
  public onSceneLoaded = new Observable<{ scene: Scene; filename: string }>();
  public onError = new Observable<{ scene?: Scene; message?: string }>();
  public onEnvironmentChanged = new Observable<string>();
  public onRequestClickInterceptor = new Observable<void>();
  public onClickInterceptorClicked = new Observable<void>();
  public glTFLoaderExtensions: { [key: string]: IGLTFLoaderExtension } = {};

  public filesInput!: FilesInput; // TODO: !
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
