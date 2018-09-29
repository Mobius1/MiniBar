![MiniBar](/docs/img/minibar_logo_medium.png?raw=true "MiniBar")

[![npm](https://img.shields.io/npm/dt/minibarjs.svg)](https://www.npmjs.com/package/minibarjs)
[![npm version](https://badge.fury.io/js/minibarjs.svg)](https://badge.fury.io/js/minibarjs)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/Mobius1/MiniBar/blob/master/LICENSE)
[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/Mobius1/MiniBar.svg)](http://isitmaintained.com/project/Mobius1/MiniBar "Average time to resolve an issue")
[![Percentage of issues still open](http://isitmaintained.com/badge/open/Mobius1/MiniBar.svg)](http://isitmaintained.com/project/Mobius1/MiniBar "Percentage of issues still open")
![](http://img.badgesize.io/Mobius1/MiniBar/master/dist/minibar.min.js) ![](http://img.badgesize.io/Mobius1/MiniBar/master/dist/minibar.min.js?compression=gzip&label=gzipped)


A lightweight, dependency-free scrollbar library written in vanilla javascript.

* Fully customisable via CSS
* Native scrolling behaviour preserved
* Vertical and horizontal scroll support
* Textarea support
* Horizontal scrolling with mousewheel

[Demo](https://mobius1.github.io/MiniBar/) | [Changelog](https://github.com/Mobius1/MiniBar/releases)

### Note

MiniBar is currently in a pre-release state so is not yet suitable for production so use with care. The API will be in constant flux until v1.0.0 is released so check back for any changes.

Horizontal scrolling with mousewheel and textarea support are experimental and may not work in certain browsers.

MiniBar utilizes the [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) API to automatically detect changes in content so the dimensions can be updated.

If your browser doesn't support the API, MiniBar will not use it and therefore you must call the `update()` method when adding / removing / updating the containers content.

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

Grab the files from the CDN and include them in your project:

```html
<link href="https://unpkg.com/minibarjs@latest/dist/minibar.min.css" rel="stylesheet" type="text/css">
<script src="https://unpkg.com/minibarjs@latest/dist/minibar.min.js" type="text/javascript"></script>
```

You can replace `latest` with the required release number if needed.

---

## Initialisation

You can instantiate MiniBar by passing a reference to your content as the first parameter of the constructor as either a DOM node or a CSS3 selector string:

```javascript
new MiniBar(document.getElementById('myContent'));

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
#### Type: `Integer`
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


### `navButtons`
#### Type: `Object`
#### Default: `false`

Enable scrollbars with navigation buttons.


### `scrollAmount`
#### Type: `Integer`
#### Default: `10`

Increase or decrease the amount scrolled when clicking a nav button.

---

## Public Methods

### `destroy()`

Destroy the current instance. Removes all nodes and event listeners attached to the DOM by MiniBar.


### `init()`

Initialise the instance after destroying.


### `update()`

Recalculate scollbar sizes / positions. This method is called automatically when the content and window are resized or if content is added / removed. You can call this method manually if you add or remove content.



### `scrollBy(amount, axis, duration, easing)`

```javascript
/**
 * @param  {Number} 	amount   Number of pixels to scroll
 * @param  {String} 	axis     Scroll axis
 * @param  {Number} 	duration Duration of scroll animation in ms
 * @param  {Function} 	easing   Easing function
 */
```

Scroll the content by a certain amount. You can define which axis to scroll with the `axis` parameter (defaults to "y").

By default this method animates the scrolling. To control the duration of the animation simply set the number of `ms` with the `duration` parameter. Setting to `0` will disable animation.

The default easing used is `easeOutQuad`, but you can pass your own easing function with the `easing` parameter.

---

## To Do

* Add touch / mobile support
* ~~Implement Mutation Observers to detect DOM changes?~~ Added in [v0.3.0](https://github.com/Mobius1/MiniBar/releases/tag/0.3.0)

Copyright © 2017 Karl Saunders | MIT license
