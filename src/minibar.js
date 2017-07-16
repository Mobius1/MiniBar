/*!
 * MiniBar 0.0.4
 * http://mobius.ovh/
 *
 * Released under the MIT license
 */
(function(root) {

	"use strict";

	/**
	 * Default configuration properties
	 * @type {Object}
	 */
	var defaultConfig = {
		minBarSize: 50,
		alwaysShowBars: false,

		containerClass: "mb-container",
		contentClass: "mb-content",
		trackClass: "mb-track",
		barClass: "mb-bar",
		visibleClass: "mb-visible"
	};

	/**
	 * Object.assign polyfill (https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill)
	 * @param  {Onject} target
	 * @param  {Onject} varArgs
	 * @return {Onject}
	 */
	var extend = function(target, varArgs) {
		if (target == null) {
			// TypeError if undefined or null
			throw new TypeError('Cannot convert undefined or null to object');
		}

		var to = Object(target);

		for (var index = 1; index < arguments.length; index++) {
			var nextSource = arguments[index];

			if (nextSource != null) {
				// Skip over if undefined or null
				for (var nextKey in nextSource) {
					// Avoid bugs when hasOwnProperty is shadowed
					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
		}
		return to;
	};

	/**
	 * Iterator helper
	 * @param  {(Array|Object)}   collection Any object, array or array-like collection.
	 * @param  {Function} callback   The callback function
	 * @param  {Object}   scope      Change the value of this
	 * @return {Void}
	 */
	var each = function each(collection, callback, scope) {
		if ("[object Object]" === Object.prototype.toString.call(collection)) {
			for (var d in collection) {
				if (Object.prototype.hasOwnProperty.call(collection, d)) {
					callback.call(scope, d, collection[d]);
				}
			}
		} else {
			for (var e = 0, f = collection.length; e < f; e++) {
				callback.call(scope, e, collection[e]);
			}
		}
	};

	/**
	 * Add event listener to target
	 * @param  {Object} target
	 * @param  {String} event
	 * @param  {Function} callback
	 */
	var on = function on(target, event, callback) {
		target.addEventListener(event, callback, false);
	};

	/**
	 * Remove event listener to target
	 * @param  {Object} target
	 * @param  {String} event
	 * @param  {Function} callback
	 */
	var off = function off(target, event, callback) {
		target.removeEventListener(event, callback);
	};

	/**
	 * Mass assign style properties
	 * @param  {Object} el
	 * @param  {(String|Object)} prop
	 * @param  {String} val
	 */
	var style = function style(el, prop, val) {
		var css = el && el.style;
		var isObj = "[object Object]" === Object.prototype.toString.call(prop);

		if (css) {
			if (val === void 0 && !isObj) {
				val = window.getComputedStyle(el);
				return prop === void 0 ? val : val[prop];
			} else {
				if (isObj) {
					each(prop, function (p, v) {
						if (!(p in css)) {
							p = "-webkit-" + p;
						}
						css[p] = v + (typeof v === "string" ? "" : p === "opacity" ? "" : "px");
					});
				} else {
					if (!(prop in css)) {
						prop = "-webkit-" + prop;
					}
					css[prop] = val + (typeof val === "string" ? "" : prop === "opacity" ? "" : "px");
				}
			}
		}
	};

	/**
	 * Get an element's DOMRect relative to the document instead of the viewport.
	 * @param  {Object} t 	HTMLElement
	 * @param  {Boolean} e 	Include margins
	 * @return {Object}   	Formatted DOMRect copy
	 */
	var rect = function rect(el) {
		var win = window;
		var doc = document;
		var body = doc.body;
		var r = el.getBoundingClientRect();
		var x = win.pageXOffset !== undefined ? win.pageXOffset : (doc.documentElement || body.parentNode || body).scrollLeft;
		var y = win.pageYOffset !== undefined ? win.pageYOffset : (doc.documentElement || body.parentNode || body).scrollTop;

		return {
			x: r.left + x,
			y: r.top + y,
			height: Math.round(r.height),
			width: Math.round(r.width)
		};
	};

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not be triggered.
	 * @param  {Function} func
	 * @param  {Number} wait
	 * @param  {Boolean} immediate
	 * @return {Function}
	 */
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	/**
	 * requestAnimationFrame Polyfill
	 */
	var raf = window.requestAnimationFrame || function () {
		var timeLast = 0;

		return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
			var timeCurrent = new Date().getTime();
			var timeDelta = undefined;

			/* Dynamically set the delay on a per-tick basis to more closely match 60fps. */
			/* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671. */
			timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
			timeLast = timeCurrent + timeDelta;

			return setTimeout(function () {
				callback(timeCurrent + timeDelta);
			}, timeDelta);
		};
	}();

	/**
	 * Get native scrollbar width
	 * @return {Number} Scrollbar width
	 */
	var getScrollBarWidth = function() {
		var width = 0;
		var div = document.createElement("div");

		div.style.cssText = "width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;";

		document.body.appendChild(div);
		width = div.offsetWidth - div.clientWidth;
		document.body.removeChild(div);

		return width;
	};

	/**
	 * Main Library
	 * @param {(String|Object)} content CSS3 selector string or node reference
	 * @param {Object} options 			User defined options
	 */
	var MiniBar = function(content, options) {

		this.content = content;

		if (typeof content === "string") {
			this.content = document.querySelector(content);
		}

		this.config = extend({}, defaultConfig, options);

		this.css = window.getComputedStyle(this.content);

		this.scrollbarSize = getScrollBarWidth();

		this.events = {
			update: this.update.bind(this),
			scroll: this.scroll.bind(this),
			mouseenter: this.mouseenter.bind(this),
			mousedown: this.mousedown.bind(this),
			mousemove: this.mousemove.bind(this),
			mouseup: this.mouseup.bind(this)
		};

		this.events.debounce = debounce(this.events.update, 50);

		this.init();
	}

	/**
	 * Init instance
	 * @return {Void}
	 */
	MiniBar.prototype.init = function init() {
		var that = this;

		this.content.classList.add(this.config.contentClass);

		this.container = document.createElement("div");
		this.container.classList.add(this.config.containerClass);

		if (this.config.alwaysShowBars) {
			this.container.classList.add(this.config.visibleClass);
		}

		this.bars = {
			x: {
				node: document.createElement("div")
			},
			y: {
				node: document.createElement("div")
			}
		};

		this.tracks = {
			x: {
				node: document.createElement("div")
			},
			y: {
				node: document.createElement("div")
			}
		};

		each(this.tracks, function (i, track) {
			track.node.classList.add(that.config.trackClass, that.config.trackClass + "-" + i);
			that.bars[i].node.classList.add(that.config.barClass);
			track.node.appendChild(that.bars[i].node);
			that.container.appendChild(track.node);

			on(that.bars[i].node, "mousedown", that.events.mousedown);
		});

		this.content.parentNode.insertBefore(this.container, this.content);
		this.container.appendChild(this.content);

		this.container.style.position = this.css.position === "static" ? "relative" : this.css.position;

		this.update();

		on(this.content, "scroll", this.events.scroll);
		on(this.container, "mouseenter", this.events.mouseenter);

		on(window, "resize", this.events.debounce);

		on(document, "DOMContentLoaded", this.events.update);
	};

	/**
	 * Scroll callback
	 * @return {Void}
	 */
	MiniBar.prototype.scroll = function scroll() {
		this.updateScrollBar("x");
		this.updateScrollBar("y");
	};

	/**
	 * Mouseenter callack
	 * @return {Void}
	 */
	MiniBar.prototype.mouseenter = function mouseenter() {
		this.updateScrollBar("x");
		this.updateScrollBar("y");
	};

	/**
	 * Mousedown callack
	 * @return {Void}
	 */
	MiniBar.prototype.mousedown = function mousedown(e) {
		e.preventDefault();

		var currentAxis = e.target === this.bars.x.node ? "x" : "y";
		var currentBar = this.bars[currentAxis];
		var currentTrack = this.tracks[currentAxis];

		this.currentAxis = currentAxis;

		// Lets do all the nasty reflow-triggering stuff before mousemove
		// otherwise it'll be a shit-show during mousemove
		this.update();

		// Keep the tracks visible during drag
		this.container.classList.add(this.config.visibleClass);

		// Save data for use during mousemove
		this.origin = {
			x: e.pageX - currentBar.x,
			y: e.pageY - currentBar.y,
			axis: "page" + currentAxis.toUpperCase(),
			prop: currentAxis === "x" ? currentTrack.width : currentTrack.height,
			size: currentAxis === "x" ? "scrollWidth" : "scrollHeight",
			offset: currentAxis === "x" ? "scrollLeft" : "scrollTop"
		};

		// Attach the mousemove and mouseup event listeners now
		// instead of permanently having them on
		on(document, "mousemove", this.events.mousemove);
		on(document, "mouseup", this.events.mouseup);
	};

	/**
	 * Mousemove callack
	 * @return {Void}
	 */
	MiniBar.prototype.mousemove = function mousemove(e) {
		e.preventDefault();

		var o = this.origin;
		var axis = this.currentAxis;
		var axisOffset = e[o.axis];
		var track = this.tracks[axis];
		var content = this.content;

		var offset = axisOffset - o[axis] - track[axis];
		var ratio = offset / o.prop;
		var scroll = ratio * this[o.size];

		// Update scroll position
		raf(function () {
			content[o.offset] = scroll;
		});
	};

	/**
	 * Mouseup callack
	 * @return {Void}
	 */
	MiniBar.prototype.mouseup = function mouseup() {
		this.origin = {};
		this.currentAxis = null;

		this.container.classList.toggle(this.config.visibleClass, this.config.alwaysShowBars);

		off(document, "mousemove", this.events.mousemove);
		off(document, "mouseup", this.events.mouseup);
	};

	/**
	 * Update cached values and recalculate sizes / positions
	 * @return {Void}
	 */
	MiniBar.prototype.update = function update() {
		var that = this;

		// Cache the dimensions
		each(this.tracks, function (i, track) {
			extend(track, rect(track.node));
			extend(that.bars[i], rect(that.bars[i].node));
		});

		this.rect = rect(this.container);

		this.scrollTop = this.content.scrollTop;
		this.scrollLeft = this.content.scrollLeft;
		this.scrollHeight = this.content.scrollHeight;
		this.scrollWidth = this.content.scrollWidth;

		// Do we need horizontal scrolling?
		var scrollX = this.scrollWidth > this.rect.width;

		// Do we need vertical scrolling?
		var scrollY = this.scrollHeight > this.rect.height;

		this.container.classList.toggle("mb-scroll-x", scrollX);
		this.container.classList.toggle("mb-scroll-y", scrollY);

		// Style the content
		style(this.content, {
			overflow: "auto",
			marginBottom: scrollX ? -this.scrollbarSize : "",
			paddingBottom: scrollX ? this.scrollbarSize : "",
			marginRight: scrollY ? -this.scrollbarSize : "",
			paddingRight: scrollY ? this.scrollbarSize : ""
		});

		this.scrollX = scrollX;
		this.scrollY = scrollY;

		// Update scrollbars
		this.updateScrollBar("x");
		this.updateScrollBar("y");
	};

	/**
	 * Update a scrollbar's size and position
	 * @return {Void}
	 */
	MiniBar.prototype.updateScrollBar = function updateScrollBar() {
		var that = this;

		var axis = arguments.length <= 0 || arguments[0] === undefined ? "y" : arguments[0];

		var css = {};
		var o = axis === "x" ? "left" : "top";
		var d = axis === "x" ? "width" : "height";
		var scroll = axis === "x" ? "scrollLeft" : "scrollTop";
		var size = axis === "x" ? "scrollWidth" : "scrollHeight";
		var scrollbar = this.bars[axis].node;
		var contentSize = this[size];
		var barSize = this.tracks[axis][d];

		// We need a live value not cached
		var scrollOffset = this.content[scroll];

		var barRatio = barSize / contentSize;
		var scrollRatio = scrollOffset / (contentSize - barSize);

		css[d] = Math.max(Math.floor(barRatio * barSize), this.config.minBarSize);
		css[o] = Math.floor((barSize - css[d]) * scrollRatio);

		raf(function () {
			style(that.bars[axis].node, css);
		});
	};

	/**
	 * Destroy instance
	 * @return {Void}
	 */
	MiniBar.prototype.destroy = function destroy() {
		var that = this;

		each(this.tracks, function (i, track) {
			off(that.bars[i].node, "mousedown", that.events.mousedown);
		});
		off(this.content, "scroll", this.events.scroll);
		off(this.container, "mouseenter", this.events.mouseenter);

		off(window, "resize", this.events.debounce);

		this.content.removeAttribute("style");

		this.container.parentNode.replaceChild(this.content, this.container);
	};

	root.MiniBar = MiniBar;

}(this));