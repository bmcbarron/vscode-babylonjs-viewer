# babylonjs-viewer README

A viewer for several asset files used in game development with the
[Babylon.js](https://babylonjs.com) engine. Typically these files are optimized for parsing by
software rather than humans. By default, asset files are visualized with a digest summary of
their contents. With a single click, the asset can be rendered in a dedicated panel by the
Babylon.js engine. The viewer panel supports the same functionality as the
[Babylon.js Sandbox](https://sandbox.babylonjs.com), including full Inspector support.

## Features

* Support for multiple asset file types: `.babylon`, `.gltf`, `.glb`, and `.obj`.
* Filetype-specific digest summaries of asset file contents.
* Rendering support via the Babylon.js engine.
* Full JSON schema for `.babylon` files (used for syntax highlighting and intellisense in text-edit
  mode).

**TODO**: If there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

None.

## Extension Settings

No custom settings. However, this extension causes asset files to be opened in a digest summary view instead of the text editor. This default can be reverted on a per-file-extension basis by modifying
`workbench.editorAssociations` or right-clicking on an asset file and selecting `Open With...`.

## Known Issues

* The contents of the summary digests are a work in progress.
* The file analysis to produce summary digests is re-executed every time a file is opened.

## Release Notes

### 1.0.0

Initial release of Asset Viewer and Asset Digest.
