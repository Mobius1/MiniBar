![MiniBar](/docs/img/minibar_logo_medium.png?raw=true "MiniBar")

[![Maintenance](https://img.shields.io/maintenance/yes/2020.svg?style=for-the-badge)](https://github.com/Mobius1/MiniBar/graphs/commit-activity)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/Mobius1/MiniBar.svg?style=for-the-badge)](https://codeclimate.com/github/Mobius1/MiniBar/maintainability)
![](http://img.badgesize.io/Mobius1/MiniBar/master/dist/minibar.min.js?style=for-the-badge)
![](http://img.badgesize.io/Mobius1/MiniBar/master/dist/minibar.min.js?compression=gzip&label=gzipped&style=for-the-badge)
[![npm](https://img.shields.io/npm/dt/minibarjs.svg?style=for-the-badge)](https://www.npmjs.com/package/minibarjs)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?style=for-the-badge)](https://github.com/Mobius1/MiniBar/blob/master/LICENSE)
[![GitHub release](https://img.shields.io/github/release/Mobius1/MiniBar.svg?style=for-the-badge)](https://github.com/Mobius1/MiniBar/releases)
[![npm](https://img.shields.io/npm/v/minibarjs.svg?style=for-the-badge)](https://www.npmjs.com/package/minibarjs)
[![GitHub issues](https://img.shields.io/github/issues-raw/Mobius1/MiniBar.svg?style=for-the-badge)](https://github.com/Mobius1/MiniBar)
[![GitHub issues](https://img.shields.io/github/issues-closed-raw/Mobius1/MiniBar.svg?style=for-the-badge)](https://github.com/Mobius1/MiniBar)


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

MiniBar utilizes the [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) API to automatically detect changes in content so the dimensions can be updated. It will only use the API if your browser supports it. If it doesn't then you must call the `update()` method when adding / removing / updating the containers content otherwise the scroll bar position and size will be incorrect.

---

## Install

These methods install original MiniBar from Moebius1

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
    barType: "default",
    minBarSize: 10,
    hideBars: false,  /* v0.4.0 and above */
    alwaysShowBars: false,
    horizontalMouseScroll: false,

    scrollX: true,
    scrollY: true,

    navButtons: false,
    scrollAmount: 10,

    mutationObserver: {
        attributes: false,
        childList: true,
        subtree: true
    },

     /* v0.4.0 and above */
    onInit: function() {
    /* do something on init */
    },

     /* v0.4.0 and above */
    onUpdate: function() {
    /* do something on update */
    },

     /* v0.4.0 and above */
    onScroll: function() {
    /* do something on init */
    },

    classes: {
        container: "mb-container",
        content: "mb-content",
        track: "mb-track",
        bar: "mb-bar",
        visible: "mb-visible",
        progress: "mb-progress",
        hover: "mb-hover",
        scrolling: "mb-scrolling",
        textarea: "mb-textarea",
        wrapper: "mb-wrapper",
        nav: "mb-nav",
        btn: "mb-button",
        btns: "mb-buttons",
        increase: "mb-increase",
        decrease: "mb-decrease",
        item: "mb-item", /* v0.4.0 and above */
        itemVisible: "mb-item-visible", /* v0.4.0 and above */
        itemPartial: "mb-item-partial", /* v0.4.0 and above */
        itemHidden: "mb-item-hidden" /* v0.4.0 and above */
    }
});
```

You can also define global options with the `MiniBarOptions` object:

```javascript
MiniBarOptions = {
    barType: "default",
    minBarSize: 10,
    hideBars: false,
    ...
};
```

---

## Options

### `hideBars` (v0.4.0 and above)
#### Type: `Boolean`
#### Default: `false`

When set to `true` the scrollbars will be hidden.

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

### `observableItems` (v0.4.0 and above)
#### Type: `Mixed`
#### Default: `false`

Allows `MiniBar` to observe descendents and determine whether they're fully or partially visible within the scrolling container or completely out of view.

To use you must pass a CSS3 selector string of the scrolling containers descendents that you want to monitor. When monitored, each descendant will have a `className` added depending on it's visibility:

* `.mb-item-visible` - item boundaries are completely within the scrolling container.
* `.mb-item-partial` - item is visible, but it's boundaries are not completely within the scrolling container.
* `.mb-item-hidden` - item is not visible.

NOTE: Your browser must support the [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) API for this to work. The only code run in it's callback is the `className` changes, so latency is kept to a minimum.

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

### `wheelScrollAmount`
#### Type: `Integer`
#### Default: `100`

Increase or decrease the amount scrolled when rolling mouse wheel.

---

## Public Methods

### `destroy()`

Destroy the current instance. Removes all nodes and event listeners attached to the DOM by MiniBar.


### `init()`

Initialise the instance after destroying.


### `update()`

Recalculate scollbar sizes / positions. This method is called automatically when the content and window are resized or if content is added / removed. You can call this method manually if you add or remove content.

### `scrollTo(position, axis)` (v0.4.0 and above)

```javascript
/**
 * @param  {Number|String} 	position   | Position to scroll to
 * @param  {String} 	    axis       | Scroll axis
 */
```

Scroll the content to the defined position. This can either be an `integer` to represent the position in `pixels` to scroll to or `"start"` / `"end"` to scroll to the start / end position.

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

### `scrollToTop()` (v0.5.0 and above)

Scroll the container to the top

### `scrollToBottom()` (v0.5.0 and above)

Scroll the container to the bottom

---

## To Do

* Add touch / mobile support
* ~~Implement Mutation Observers to detect DOM changes?~~ Added in [v0.3.0](https://github.com/Mobius1/MiniBar/releases/tag/0.3.0)

Copyright © 2017 Karl Saunders | MIT license
