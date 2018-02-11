# CTX CLI

    "cheerio": "0.22.0",
## Installation
```shell
npm install ctx-cli -g
```

## Transform
```shell
ctx transform ./my-project.zip ./export_path
```

### ctx-export
Export the current element and its children to a file.
The path is relative to the export path.
```
ctx-export="./nodes/export/view.html"
```

Additionally you can use *ctx-map="mapping_id"* to ensure that only the elements containing the mapping id will be replaced.

### ctx-edit
Edit allows you to call any cheerio functions on the current element.
See the cheerio documentation at https://github.com/cheeriojs/cheerio.
The "this" variable in the edit function is the cheerio object of the current element.
```
ctx-edit="this.remove()"
```

### ctx-toggle
Toggle will wrap the element in an if block using the logic provided in the attributes value.
```
ctx-toggle="true && variable == 'true'"
```
