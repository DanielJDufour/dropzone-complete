# dropzone-complete
Dropzone Web Component Complete with Display of GeoTIFF, JPG, and PNG Files!

# demo
https://dropzone-complete.netlify.app

# screenshots
<img src="https://github.com/DanielJDufour/dropzone-complete/blob/master/dropzone-complete.png?raw=true" width="200" style="display: inline-block">
<img src="https://github.com/DanielJDufour/dropzone-complete/blob/master/dropzone-complete-loaded.png?raw=true" width="200" style="display: inline-block">

# install
```bash
npm install dropzone-complete
```

# usage
```html
<script src="https://unpkg.com/dropzone-complete"></script>

<dropzone-complete></dropzone-complete>

<script>
    document.querySelector("dropzone-complete").addEventListener("change", function(event) {
        console.log("DropZone Complete loaded file:", event.detail.file);
    });
</script>
```

## setting dimensions
```html
<dropzone-complete height=400 width="100%"></dropzone-complete>
```

## over-riding file type
If you want to treat your file like a certain file type regardless of extension,
use the file_type attribute:
```html
<dropzone-complete file_type="text/plain"></dropzone-complete>
```

# contact
Post an issue at https://github.com/danieljdufour/issues or email the package author at daniel.j.dufour@gmail.com
