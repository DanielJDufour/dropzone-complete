/* global customElements */
/* global HTMLElement */

(function() {
    class DropzoneComplete extends HTMLElement {
      constructor() {
        // establish prototype chain
        super();
        this.dzid = 'dz-' + Math.ceil((Math.random() * 10e10).toString());
        this.promises = {};
      }

      // fires after the element has been attached to the DOM
      connectedCallback() {
        this.render();
      }
  
      loadScript(url) {
        if (!this.promises[url]) {
          this.promises[url] = new Promise(resolve => {
            const script = document.createElement("script");
            script.src = url;
            script.onload = resolve;
            document.body.appendChild(script);
          })
        }
        return Promise.resolve(this.promises[url]);
      }

      loadLibrary(name) {
        return this.loadScript(`https://unpkg.com/${name}`);
      }

      get canvas() { return document.getElementById(this.dzid + "-canvas"); }

      get img() { return document.getElementById(this.dzid + "-img"); }

      get input() { return document.getElementById(this.dzid + "-input"); }

      get label() { return document.getElementById(this.dzid + "-label"); }

      get wrapper() { return document.getElementById(this.dzid + "-wrapper"); }


      loadFile(file) {
        var reader = new FileReader();
        if (file.type === "image/tiff") {
          reader.onloadend = () => {
            this.loadLibrary('georaster').then(() => {
              parseGeoraster(reader.result).then(georaster => {
                const georasterCanvas = georaster.toCanvas();
                this.canvas.height = georasterCanvas.height;
                this.canvas.width = georasterCanvas.width;
                this.canvas.getContext('2d').drawImage(georaster.toCanvas(), 0, 0);
                this.wrapper.setAttribute("loaded", true);
              });
            });
          }            
          reader.readAsArrayBuffer(file);
        } else {
          reader.onloadend = () =>  this.img.setAttribute("src", reader.result);
          this.wrapper.setAttribute("loaded", true);            
          reader.readAsDataURL(file);
        }
      }
      
      get style() {
        const { dzid } = this;
        return `
        <style>
          #${dzid}-wrapper {
            position: relative;
            width: 300px;
          }


          #${dzid}-input {
            height: 0;
            left: 0;
            position: absolute;
            top: 0;
            visibility: hidden;
            width: 0;
          }        
          #${dzid}-label {
            cursor: pointer;
            height: 400px;
            left: 0;
            position: absolute;
            width: 100%;
            z-index: 99;
          }
          #${dzid}-wrapper[loaded=true] #${dzid}-label {
            display: none;
          }

          #${dzid} {
            background: ghostwhite;
            cursor: pointer;
            display: inline-block;
            height: 400px;
            position: relative;
            width: 100%;
          }
          #${dzid}-inner {
            border: 1px dashed #673ab7;
            bottom: 15px;
            left: 15px;
            position: absolute;
            right: 15px;
            top: 15px;
          }
          #${dzid}-mssg {
            left: 50%;
            position: absolute;
            text-align: center;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 75%;
          }
          #${dzid}-wrapper[loaded=true] #${dzid}-inner {
            display: none;
          }
                
          #${dzid}-img, #${dzid}-canvas {
            left: 50%;
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
          }
          #${dzid}-img:not([src]) {
            display: none;
          }
        </style>`;
      }
  
      render() {
        const { dzid } = this;
        this.innerHTML = `
          ${this.style}
          <div id="${dzid}-wrapper" loaded="false">
            <input id="${dzid}-input" type="file" multiple="false"/>
            <label for="${dzid}-input" id="${dzid}-label"></label>
            <div id="${dzid}">
              <div id="${dzid}-inner">
                <div id="${dzid}-mssg">
                  Click to Choose a File<br/> or Drag One Here
                </div>
              </div>

              <img id="${dzid}-img">
              <canvas id="${dzid}-canvas">
            </div>
          </div>
        `;


        this.label.ondragover = ev => {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = "move";
        };

        this.label.ondrop = ev => {
          ev.preventDefault();
          if (ev.dataTransfer.files.length > 0) {
            this.loadFile(ev.dataTransfer.files[0]);
          };
        };

        this.input.onchange = ev => {
          this.loadFile(ev.target.files[0]);
        };
      }
    }
    customElements.define('dropzone-complete', DropzoneComplete);
  })();