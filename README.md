# dropzone-complete
Dropzone Web Component Complete with Display of GeoJSON, GeoTIFF, JPG, PNG, and Shapefiles!

## demo
https://dropzone-complete.netlify.app

## screenshots
<img src="https://github.com/DanielJDufour/dropzone-complete/blob/master/dropzone-complete.png?raw=true" width="200" style="display: inline-block">
<img src="https://github.com/DanielJDufour/dropzone-complete/blob/master/dropzone-complete-loaded.png?raw=true" width="200" style="display: inline-block">

## install
```bash
npm install dropzone-complete
```

## usage
```html
<script src="https://unpkg.com/dropzone-complete"></script>

<dropzone-complete></dropzone-complete>

<script>
    document.querySelector("dropzone-complete").addEventListener("change", function(event) {
        console.log("DropZone Complete loaded file:", event.detail.file);

        // if the file includes multiple subfiles like a Shapefile
        console.log("DropZone Complete loaded files:", event.detail.files);
    });
</script>
```

### setting dimensions
```html
<dropzone-complete height=400 width="100%"></dropzone-complete>
```

### over-riding placeholder
Set a placeholder attribute to over-ride the default HTML placeholder `"Click to Choose a File<br> or Drag One Here"`.
```html
<dropzone-complete placeholder="Drop your Document Here"></dropzone-complete>
```

### over-riding file type
If you want to treat your file like a certain file type regardless of extension,
use the file_type attribute:
```html
<dropzone-complete file_type="text/plain"></dropzone-complete>
```

### using parsed data
If you want to use the parsed JavaScript objects, listen to the parse event
```html
<script>
    document.querySelector("dropzone-complete").addEventListener("dropzone:parse", function(event) {
        console.log("DropZone Parsed a GeoJSON File:", event.detail.geojson);
    });
    document.querySelector("dropzone-complete").addEventListener("dropzone:parse", function(event) {
        console.log("DropZone Parsed a GeoTIFF File:", event.detail.georaster);
    });
</script>
```

## contact
Post an issue at https://github.com/danieljdufour/issues or email the package author at daniel.j.dufour@gmail.com
