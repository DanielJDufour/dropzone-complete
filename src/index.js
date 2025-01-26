/* global customElements */
/* global HTMLElement */

(function() {

    function toArray(items) {
      var arr = [];
      for (let i = 0; i < items.length; i++) arr.push(items[i]);
      return arr;
    }

    function endsWith(str, ending) {
      return str.substring(str.length - ending.length, str.length) === ending;
    }

    function readAsArrayBuffer(file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function () {
          resolve(reader.result);
        };
        reader.readAsArrayBuffer(file);
      });
    }

    class DropzoneComplete extends HTMLElement {
      constructor() {
        // establish prototype chain
        super();
        this.dzid = 'dz-' + Math.ceil((Math.random() * 10e10).toString());
        this.promises = {};
      }

      static get observedAttributes() {
        return ['file_type', 'height', 'placeholder', 'width'];
      }

      // fires after the element has been attached to the DOM
      connectedCallback() {
        this.render();
      }

      attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'height' || attrName === 'width') {
          this.render();
        }
      }

      dispatchCustomEvent(files) {
        this.dispatchEvent(new CustomEvent("change", {
          bubbles: true,
          detail: {
            files,

            // for legacy support
            file: files[0],
          }
        }));
      }

      dispatchCustomParseEvent(detail) {
        this.dispatchEvent(new CustomEvent("dropzone:parse", {
          bubbles: true,
          detail
        }));
      }

      loadScript(url) {
        if (!this.promises[url]) {
          this.promises[url] = new Promise(resolve => {
            const script = document.createElement("script");
            script.src = url;
            script.onload = resolve;
            document.body.appendChild(script);
          });
        }
        return Promise.resolve(this.promises[url]);
      }

      loadStyle(url) {
        if (!this.promises[url]) {
          this.promises[url] = new Promise(resolve => {
            const style = document.createElement("link");
            style.type = "text/css";
            style.rel = "stylesheet";
            style.href = url;
            style.onload = resolve;
            document.body.appendChild(style);
          });
        }
        return Promise.resolve(this.promises[url]);
      }

      loadLibrary(name) {
        return this.loadScript(`https://unpkg.com/${name}`);
      }

      get canvas() { return this.querySelector("canvas"); }

      get iframe() { return this.querySelector("iframe"); }

      get img() { return this.querySelector("img"); }

      get input() { return this.querySelector("input"); }

      get label() { return this.querySelector("label"); }

      get textarea() { return this.querySelector("textarea"); }

      get wrapper() { return document.getElementById(this.dzid + "-wrapper"); }


      loadFiles(files) {
        // convert files from FileList to an Array
        files = toArray(files);

        var file = files[0];
        var file_count = files.length;

        if (file_count === 0) return;

        var reader = new FileReader();

        // check for file_type over-ride
        let file_type = this.getAttribute("file_type");
        if (files.filter(f => f.name.toLowerCase().endsWith(".shp")).length === 1) {
          file_type = "SHAPEFILE";
        } else if (file_count === 1 && [undefined, null, ""].indexOf(file_type) > -1) {
          file_type = file.type;
        }

        if (file_type === "SHAPEFILE") {
          var subfiles = [
            ["shp", files.filter(f => f.name.toLowerCase().endsWith(".shp"))[0]],
            ["dbf", files.filter(f => f.name.toLowerCase().endsWith(".dbf"))[0]],
            ["prj", files.filter(f => f.name.toLowerCase().endsWith(".prj"))[0]],
            ["cpg", files.filter(f => f.name.toLowerCase().endsWith(".cpg"))[0]]
          ]
          .filter(([ext, file]) => file !== undefined)
          .map(([ext, file]) => ([ext, readAsArrayBuffer(file)]));          

          var keys = subfiles.map(([ext, file]) => ext);
          var promises = subfiles.map(([ext, file]) => file);
          Promise.all(promises).then(arrayBuffers => {
            var data = {};
            for (let i = 0; i < arrayBuffers.length; i++) {
              data[keys[i]] = arrayBuffers[i];
            }
            console.log({data});
            this.loadLibrary('shpjs@6.1.0/dist/shp.min.js').then(() => {
              shp(data).then(geojson => {
                console.log({geojson});
                this.loadStyle("https://unpkg.com/leaflet/dist/leaflet.css").then(() => {
                  this.loadLibrary("leaflet").then(() => {
                    // initialize map
                    const map = L.map(this.dzid + "-map");
    
                    // add basemap
                    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(map);

                    // add dropzone data
                    this.dispatchCustomParseEvent({ geojson });
                    const lyr = L.geoJSON(geojson, {
                      onEachFeature: function (feature, layer) {
                        var popup = [];
                        for (let key in feature.properties) {
                          popup.push(key + " = " + JSON.stringify(feature.properties[key]));
                        }
                        popup = popup.join("<br/>");
                        popup = popup.trim();
                        if (popup === "") popup = "No Properties Found";
                        layer.bindPopup(popup, {
                          maxHeight: 250
                        });
                      }
                    });
                    map.addLayer(lyr);
                    map.fitBounds(lyr.getBounds());
                    this.wrapper.setAttribute("loaded", true);
                  });
                });
              });
            });
          });
        } else if (file_type === "image/tiff") {
          reader.onloadend = () => {
            this.loadLibrary('georaster').then(() => {
              parseGeoraster(reader.result).then(georaster => {
                this.dispatchCustomParseEvent({ georaster });
                const georasterCanvas = georaster.toCanvas();
                this.canvas.height = georasterCanvas.height;
                this.canvas.width = georasterCanvas.width;
                this.canvas.getContext('2d').drawImage(georaster.toCanvas(), 0, 0);
                this.canvas.style.display = null;
                this.wrapper.setAttribute("loaded", true);
              });
            });
          }
          reader.readAsArrayBuffer(file);
        } else if (file.name && endsWith(file.name.toLowerCase(), "geojson")) {
          reader.onloadend = () => {
            this.loadStyle("https://unpkg.com/leaflet/dist/leaflet.css").then(() => {
              this.loadLibrary("leaflet").then(() => {
                // initialize map
                const map = L.map(this.dzid + "-map");

                // add basemap
                L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);

                // add dropzone data
                const data = JSON.parse(reader.result);
                this.dispatchCustomParseEvent({ geojson: data });
                const lyr = L.geoJSON(data, {
                  onEachFeature: function (feature, layer) {
                    var popup = [];
                    for (let key in feature.properties) {
                      popup.push(key + " = " + JSON.stringify(feature.properties[key]));
                    }
                    popup = popup.join("<br/>");
                    popup = popup.trim();
                    if (popup === "") popup = "No Properties Found";
                    layer.bindPopup(popup, {
                      maxHeight: 250
                    });
                  }
                });
                map.addLayer(lyr);
                map.fitBounds(lyr.getBounds());
                this.wrapper.setAttribute("loaded", true);
              });
            });
          }
          reader.readAsText(file);
        } else if (file_type === "application/pdf") {
          reader.onloadend = () =>  this.iframe.src = reader.result;
          this.wrapper.setAttribute("loaded", true);
          reader.readAsDataURL(file);
        } else if (file_type === "text/plain" || (file.name.toLowerCase().endsWith(".py")) || (file.name && endsWith(file.name, "json"))) {
          // in the future should probably map GeoJSON
          // probably add syntax highlighting for code
          reader.onloadend = () => {
            this.textarea.value = reader.result;
            this.textarea.style.display = null;
          }
          this.wrapper.setAttribute("loaded", true);
          reader.readAsText(file);
        } else {
          reader.onloadend = () =>  this.img.setAttribute("src", reader.result);
          this.wrapper.setAttribute("loaded", true);            
          reader.readAsDataURL(file);
        }
      }
      
      get style() {
        const { dzid } = this;

        let height = this.getAttribute("height");
        if (height === null) height = 400;
        if (!isNaN(height)) height += "px";

        let width = this.getAttribute("width");
        if (width === null) width = 300;
        if (!isNaN(width)) width += "px";

        return `
        <style>
          #${dzid}-wrapper {
            position: relative;
            width: ${width};
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
            height: ${height};
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
            display: inline-block;
            height: ${height};
            position: relative;
            width: 100%;
          }
          #${dzid}-wrapper:not([loaded=true]) #${dzid} {
            cursor: pointer;
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

          #${dzid}-img, #${dzid}-canvas, #${dzid}-iframe {
            left: 50%;
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
          }
          #${dzid}-img:not([src]) {
            display: none;
          }

          #${dzid}-iframe {
            height: ${height};
            width: 100%;
          }
          #${dzid}-textarea {
            height: 100%;
            resize: none;
            width: 100%;
          }
          #${dzid}-iframe:not([src]) {
            display: none;
          }
          #${dzid}-map {
            display: none;
            height: 100%;
          }
          #${dzid}-map.leaflet-container {
            display: block;
          }
        </style>`;
      }
  
      render() {
        try {
          const { dzid } = this;

          const placeholder = this.getAttribute("placeholder") || "Click to Choose a File<br/> or Drag One Here";

          this.innerHTML = `
            ${this.style}
            <div id="${dzid}-wrapper" loaded="false">
              <input id="${dzid}-input" type="file" multiple="false"/>
              <label for="${dzid}-input" id="${dzid}-label"></label>
              <div id="${dzid}">
                <div id="${dzid}-inner">
                  <div id="${dzid}-mssg">
                    ${placeholder}
                  </div>
                </div>

                <textarea id="${dzid}-textarea" style="display: none" readOnly></textarea>
                <img id="${dzid}-img"/>
                <canvas id="${dzid}-canvas" style="display: none"></canvas>
                <iframe id="${dzid}-iframe"></iframe>
                <div id="${dzid}-map"></div>
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
              const files = ev.dataTransfer.files;
              this.loadFiles(files);
              this.dispatchCustomEvent(files);
            };
          };

          this.input.onchange = ev => {
            const files = ev.target.files;
            this.loadFiles(files);
            this.dispatchCustomEvent(files);
          };
        } catch (error) {
          console.error("dropzone-complete failed to render with", { dzid, height, height, width });
        }
      }
    }
    customElements.define('dropzone-complete', DropzoneComplete);
  })();
