# CLI Docs
## Installation
Installing the CLI will allow you to run CTX functions from your command terminal.
```
$ npm install ctxjs -g
```

## Commands
#### ctx create *path*
Create a service at the specified path.
#### ctx scrape *url*
Scrape a url for ctx attributes.
#### ctx migrate
Auto migrate your service descriptors to the latest standard.

## Documentation
### ctx scrape
By specifying special attributes on html elements in a website, you can use the CLI to scrape data into services. This is especially useful if you are using a third party service to create interfaces that you want to import into your services.

**Valid Attributes**
###### ctx-export="./export/location.html"
Export the html element to the specified file.
###### ctx-edit="..."
Edit the current element using [**cheerio**](https://www.npmjs.com/package/cheerio), where **this** is the current element. Eg: `this.html('');`
###### ctx-map="ctx"
Mapping is used to anchor an element in an html document so that when using ctx-export information outside the html element being exported won't be overwritten. The cli will always create a map with the default id **ctx**, but if needed this can be overwritten by manually specifying a map. If a mapping id isn't found in a document the element will be appended to the exported file.
