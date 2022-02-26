# Notes to myself

## Screen capture tips

* https://dev.to/sinedied/3-tips-for-perfect-vs-code-video-gifs-recordings-dbn
* [VsCode Extension: Chronicler](https://marketplace.visualstudio.com/items?itemName=arcsine.chronicler), with ffmpeg. (has issues with rotated monitors)
* GeForce Experience capture (doesn't save locally, less flexible)
* https://www.screentogif.com/ (best I could find at this point)

### Steps
1. Set monitor magnification to 100% and non-rotated.
1. Developer: Toggle Screencast Mode
1. Developer: Toggle Developer Tools
1. In console: window.resizeTo(1001, 801) // Seems to undersize by 1 pixel
1. Select window with ScreenToGif, then downsize edit box to 1000,800 and drag +1,+1
1. SaveAs Settings that worked well:
   * Encoder: ScreenToGif Built-in encoder / Most used colors
   * Colors: 256
   * Use a global color table
   * Detect unchanged pixels / Replace these pixels with a chroma key
