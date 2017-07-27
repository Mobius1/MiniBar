![MiniBar](/docs/img/minibar_logo_medium.png?raw=true "MiniBar")

[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/Mobius1/MiniBar/blob/master/LICENSE)
[![release](https://img.shields.io/badge/release-0.1.11-orange.svg?style=flat)](https://github.com/Mobius1/MiniBar/releases)
[![npm version](https://badge.fury.io/js/minibarjs.svg)](https://badge.fury.io/js/minibarjs)
![](http://img.badgesize.io/Mobius1/MiniBar/master/dist/minibar.min.js)
![](http://img.badgesize.io/Mobius1/MiniBar/master/dist/minibar.min.js?compression=gzip&label=gzipped)

A lightweight, dependency-free scrollbar library written in vanilla javascript.

* Full customisable via CSS
* Native scrolling behaviour preserved
* Vertical and horizontal scroll support
* Textarea support
* Horizontal scrolling with mousewheel

[Demo](https://mobius1.github.io/MiniBar/) | [Changelog](https://github.com/Mobius1/MiniBar/releases)

### Note

MiniBar is currently in a pre-release state so is not yet suitable for production so use with care. The API will be in constant flux until v1.0.0 is released so check back for any changes.

Horizontal scrolling with mousewheel and textarea support are experimental and may not work in certain browsers.

---

## Install

### bower

```
bower install minibarjs
```

### npm

```
npm install minibarjs
```

## Browser

Grab the files from the CDNs and include them in your project:

```html
<link href="https://unpkg.com/minibarjs@latest/dist/minibar.min.css" rel="stylesheet" type="text/css">
<script src="https://unpkg.com/minibarjs@latest/dist/minibar.min.js" type="text/javascript"></script>
```

You can replace `latest` with the required release number if needed.

CDNs courtesy of [unpkg](https://unpkg.com/#/)

---

## Initialisation

You can instantiate MiniBar by passing a reference to your content as the first parameter of the constructor as either a DOM node or a CSS3 selector string:

```javascript
new MiniBar(document.getElementById('#myContent'));

// or

new MiniBar('#myContent');
```

MiniBar also accepts an object as a second parameter of the constructor for user defined options:

```javascript
new MiniBar('#myContent', {
    minBarSize: 75,
    alwaysShowBars: true,
    ...
});
```

You can also define global options with the `MiniBarOptions` object:

```javascript
MiniBarOptions = {
    minBarSize: 75,
    alwaysShowBars: true,
    ...
};
```

---

## Options

### `minBarSize`
#### Type: `Number`
#### Default: `50`

Sets the minimum size of the scrollbars. This can prevent the scollbar becoming to small when you have a ton of content.


### `alwaysShowBars`
#### Type: `Boolean`
#### Default: `false`

By default the scrollbars aren't visible until hovering over the content. Set this to `true` to keep the scrollbars visible at all times.


### `barType`
#### Type: `String`
#### Default: `default`

Set to `progress` to display the scrollbars as progress bars.


### `horizontalMouseScroll`
#### Type: `Boolean`
#### Default: `false`

Allow horizontal scrolling with the mousewheel.

---

## Public Methods

### `destroy`

Destroy the current instance. Removes all nodes and event listeners attached to the DOM by MiniBar.


### `init`

Initialise the instance after destroying.


### `update`

Recalculate scollbar sizes / positions. This method is called automatically when the content and window are resized. You can call this method manually if you add or remove content.

---

## To Do

* Add touch / mobile support
* Implement Mutation Observers to detect DOM changes?

Copyright © 2017 Karl Saunders | MIT license
