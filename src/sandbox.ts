import { Color3, Color4, Deferred, Scene, Vector3 } from "@babylonjs/core";
import { IRenderingZoneProps, RenderingZone } from "./components/renderingZone";
import { GlobalState } from "./globalState";
import { EnvironmentTools } from "./tools/environmentTools";

// eslint-disable-next-line @typescript-eslint/naming-convention
interface vscode {
  postMessage(message: any): void;
}
declare function acquireVsCodeApi(): vscode;

const vscode: vscode = acquireVsCodeApi();

require("./scss/main.scss");
var fullScreenLogo =
  "https://cdn.statically.io/gh/BabylonJS/Babylon.js/5.0.0-beta.6/sandbox/src/img/logo-fullscreen.svg";
// TODO: require("./img/logo-fullscreen.svg");

interface ISandboxProps {}

interface IState {
  isFooterVisible: boolean;
  errorMessage: string;
}

export class Sandbox {
  private get _globalState() {
    return this.props.globalState;
  }
  private get _assetUrl() {
    return this.props.assetUrl;
  }
  private get _assetDoc() {
    return this.props.assetDoc;
  }
  private get _autoRotate() {
    return this.props.autoRotate;
  }
  private get _cameraPosition() {
    return this.props.cameraPosition;
  }
  // private _logoRef: React.RefObject<HTMLImageElement>;
  // private _dropTextRef: React.RefObject<HTMLDivElement>;
  // private _clickInterceptorRef: React.RefObject<HTMLDivElement>;
  private _clearColor?: string;
  private _camera?: number;
  private state: IState = { isFooterVisible: true, errorMessage: "" };
  private props: IRenderingZoneProps;
  private _zone?: RenderingZone;

  private setState(state: Partial<IState>) {
    console.log(`error: ${state.errorMessage}`);
    // TODO: reload
  }

  public constructor(props: ISandboxProps) {
    // super(props);
    this.props = {
      globalState: new GlobalState(),
      expanded: true, // TOOD
    };
    // this._logoRef = React.createRef();
    // this._dropTextRef = React.createRef();
    // this._clickInterceptorRef = React.createRef();

    // TODO
    // this.state = { isFooterVisible: true, errorMessage: "" };

    this.checkUrl();

    EnvironmentTools.HookWithEnvironmentChange(this._globalState);

    // Events
    this._globalState.onSceneLoaded.add((info) => {
      // TODO
      // document.title = "Babylon.js - " + info.filename;
      this.setState({ errorMessage: "" });

      this._globalState.currentScene = info.scene;
      if (
        this._globalState.currentScene.meshes.length === 0 &&
        this._globalState.currentScene.clearColor.r === 1 &&
        this._globalState.currentScene.clearColor.g === 0 &&
        this._globalState.currentScene.clearColor.b === 0
      ) {
        // this._logoRef.current!.className = "";
      } else {
        //     this._logoRef.current!.className = "hidden";
        //     this._dropTextRef.current!.className = "hidden";
      }

      if (this._clearColor) {
        info.scene.clearColor = Color4.FromColor3(
          Color3.FromHexString(`#${this._clearColor}`),
          1
        );
      }

      if (this._camera !== undefined) {
        info.scene.activeCamera = info.scene.cameras[this._camera];
      }

      Sandbox._sceneLoadedDeferred.resolve(info.scene);
    });

    this._globalState.onError.add((error) => {
      if (error.scene) {
        this._globalState.showDebugLayer();
      }

      if (error.message) {
        this.setState({ errorMessage: error.message });
      }

      Sandbox._sceneLoadedDeferred.reject(new Error(error.message));
    });

    this._globalState.onRequestClickInterceptor.add(() => {
      // TODO
      // let div = this._clickInterceptorRef.current!;
      // if (div.classList.contains("hidden")) {
      //   div.classList.remove("hidden");
      // } else {
      //   div.classList.add("hidden");
      // }
    });

    // Keyboard
    window.addEventListener("keydown", (event: KeyboardEvent) => {
      // Press space to toggle footer
      if (
        event.keyCode === 32 &&
        event.target &&
        (event.target as HTMLElement).nodeName !== "INPUT"
      ) {
        this.setState({ isFooterVisible: !this.state.isFooterVisible });
      }
    });

    console.log("registering listener");
    window.addEventListener("message", (event) => {
      const message = event.data;
      console.log(`got message ${JSON.stringify(message)}`);
      switch (message.type) {
        case "init":
          this.props.assetUrl = message.body.uri;
          // this.props.assetFileName = fileName;
          this._zone?.loadAsset();
          break;
        case "update":
          this._zone?.loadAsset();
          // const text = message.text;
          // this.gotDoc(message.fileName, text);
          break;
      }
    });
    vscode.postMessage({ type: "ready" });
  }

  checkUrl() {
    const set3DCommerceMode = () => {
      // TODO
      // document.title = "Babylon.js Sandbox for 3D Commerce";
      this._globalState.commerceMode = true;
    };

    const setReflectorMode = () => {
      // TODO
      // document.title = "Babylon.js Reflector";
      this._globalState.reflector = { hostname: "localhost", port: 1234 };
    };

    // TODO
    // const host = location.host.toLowerCase();
    // if (host.indexOf("3dcommerce") === 0) {
    //     set3DCommerceMode();
    // } else if (host.toLowerCase().indexOf("reflector") === 0) {
    //     setReflectorMode();
    // }

    // const indexOf = location.href.indexOf("?");
    // if (indexOf !== -1) {
    //     const params = location.href.substr(indexOf + 1).split("&");
    //     for (const param of params) {
    //         const split = param.split("=", 2);
    //         const name = split[0];
    //         const value = split[1];
    //         switch (name) {
    //             case "assetUrl": {
    //                 this._assetUrl = value;
    //                 break;
    //             }
    //             case "autoRotate": {
    //                 this._autoRotate = value === "true" ? true : false;
    //                 break;
    //             }
    //             case "cameraPosition": {
    //                 this._cameraPosition = Vector3.FromArray(
    //                     value.split(",").map(function (component) {
    //                         return +component;
    //                     })
    //                 );
    //                 break;
    //             }
    //             case "kiosk": {
    //                 this.state = { isFooterVisible: value === "true" ? false : true, errorMessage: "" };
    //                 break;
    //             }
    //             case "reflector": {
    //                 setReflectorMode();
    //                 break;
    //             }
    //             case "3dcommerce": {
    //                 set3DCommerceMode();
    //                 break;
    //             }
    //             case "hostname": {
    //                 if (this._globalState.reflector) {
    //                     this._globalState.reflector.hostname = value;
    //                 }
    //                 break;
    //             }
    //             case "port": {
    //                 if (this._globalState.reflector) {
    //                     this._globalState.reflector.port = +value;
    //                 }
    //                 break;
    //             }
    //             case "environment": {
    //                 EnvironmentTools.SkyboxPath = value;
    //                 break;
    //             }
    //             case "skybox": {
    //                 this._globalState.skybox = value === "true" ? true : false;
    //                 break;
    //             }
    //             case "clearColor": {
    //                 this._clearColor = value;
    //                 break;
    //             }
    //             case "camera": {
    //                 this._camera = +value;
    //                 break;
    //             }
    //         }
    //     }
  }

  gotDoc(fileName: string, text: string) {
    console.log(`gotDoc: ${text.substring(0, 100)}`);
    this.props.assetDoc = text;
    this.props.assetFileName = fileName;
    this._zone?.loadAsset();
  }

  public render() {
    this._zone = new RenderingZone(this.props);
    return /* html */ `<div id="root">
            <span>
                <p id="droptext" ref={this._dropTextRef}>
                    ${
                      this._globalState.reflector
                        ? ""
                        : "Drag and drop gltf, glb, obj or babylon files to view them"
                    }
                </p>
                ${this._zone.render()}
                <!-- {this._globalState.reflector ? (
                     <ReflectorZone globalState={this._globalState} expanded={!this.state.isFooterVisible} />
                 ) : (
                    <RenderingZone
                        globalState={this._globalState}
                        assetUrl={this._assetUrl}
                        autoRotate={this._autoRotate}
                        cameraPosition={this._cameraPosition}
                        expanded={!this.state.isFooterVisible}
                    />
                )} -->
            </span>
            <!--
            <div
                ref={this._clickInterceptorRef}
                onClick={() => {
                    this._globalState.onClickInterceptorClicked.notifyObservers();
                    this._clickInterceptorRef.current!.classList.add("hidden");
                }}
                className="clickInterceptor hidden"
            ></div>
            -->
            ${
              this.state.isFooterVisible &&
              `<Footer globalState={this._globalState} />`
            }
            <!--
            <div id="logoContainer">
                <img id="logo" src="${fullScreenLogo}" /> <!-- ref={this._logoRef} /> ->
            </div>
            -->
            ${
              this.state.errorMessage &&
              `<div id="errorZone">
                    <div className="message">{this.state.errorMessage}</div>
                    <button type="button" className="close" onClick={() => this.setState({ errorMessage: "" })} data-dismiss="alert">
                        &times;
                    </button>
                </div>`
            }
        </div>`;
  }

  componentDidMount() {
    this._zone?.componentDidMount();
  }

  // Use the promise of this deferred to do something after the scene is loaded.
  private static _sceneLoadedDeferred = new Deferred<Scene>();
}
