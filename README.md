# Temporal-Path

Visual Analytics Tool to analyze news articles

##Requirements
* node ([Install](https://nodejs.org/en/))
* npm ([Install](https://nodejs.org/en/))
* gulp

Install

```
$ npm install gulp -g
```

## Installation

Install all dependencies. 

```
$ npm install
```


## Development

Builds the application and starts a webserver with livereload. By default the webserver starts at port 3000.

```
$ npm start
```

Javascript entry file: `app/scripts/main.js` <br />
CSS entry file: `app/stylus/main.styl`<br />

Include third-party CSS via `@import 'path/to/your/third-party-styles.css'` at the top of the main.styl file.



## Build

Builds a minified version of the application in the dist folder.

```
$ npm run-script build
```