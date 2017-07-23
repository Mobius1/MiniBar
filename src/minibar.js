/*!
 * MiniBar 0.1.3
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
		barType: "default",
		minBarSize: 10,
		alwaysShowBars: false,

		containerClass: "mb-container",
		contentClass: "mb-content",
		trackClass: "mb-track",
		barClass: "mb-bar",
		visibleClass: "mb-visible",
		progressClass: "mb-progress",
		hoverClass: "mb-hover",
		scrollingClass: "mb-scrolling"
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
	}

	/**
	 * requestAnimationFrame Polyfill
	 */
	var raf = window.requestAnimationFrame || function () {
		var timeLast = 0;

		return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
			var timeCurrent = new Date().getTime(), timeDelta;

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
	var MiniBar = function(container, options) {

		this.container = container;

		if (typeof content === "string") {
			this.container = document.querySelector(container);
		}

		this.config = extend({}, defaultConfig, options || window.MiniBarOptions || {});

		this.css = window.getComputedStyle(this.container);

		this.scrollbarSize = getScrollBarWidth();

		this.bars = { x: {}, y: {} };
		this.tracks = { x: {}, y: {} };

		// Dimension objects
		this.trackPos = { x: "left" , y:  "top" };
		this.trackSize = { x: "width" , y:  "height" };
		this.scrollPos = { x: "scrollLeft" , y:  "scrollTop" };
		this.scrollSize = { x: "scrollWidth" , y:  "scrollHeight" };
		this.offsetAxis = { x: "offsetX" , y:  "offsetY" };
		this.mouseAxis = { x: "pageX" , y:  "pageY" };

		// Events
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
	};

	/**
	 * Init instance
	 * @return {Void}
	 */
	MiniBar.prototype.init = function() {
		var that = this;

		if ( !that.initialised ) {

			that.container.classList.add(that.config.containerClass);

			that.content = document.createElement("div");
			that.content.classList.add(that.config.contentClass);

			if (that.config.alwaysShowBars) {
				that.container.classList.add(that.config.visibleClass);
			}

			// Move all nodes to the the new content node
			while(that.container.firstChild) {
				that.content.appendChild(that.container.firstChild);
			}

			// Set the tracks and bars up and append them to the container
			each(that.tracks, function (i, track) {
				that.bars[i].node = document.createElement("div");
				track.node = document.createElement("div");

				track.node.classList.add(that.config.trackClass, that.config.trackClass + "-" + i);
				that.bars[i].node.classList.add(that.config.barClass);
				track.node.appendChild(that.bars[i].node);
				that.container.appendChild(track.node);

				if ( that.config.barType === "progress" ) {
					track.node.classList.add(that.config.progressClass);

					on(track.node, "mousedown", that.events.mousedown);
				} else {
					on(that.bars[i].node, "mousedown", that.events.mousedown);
				}

				on(track.node, "mouseenter", function(e) {
					that.container.classList.add(that.config.hoverClass + "-" + i);
				});
				on(track.node, "mouseleave", function(e) {
					if ( !that.down )
						that.container.classList.remove(that.config.hoverClass + "-" + i);
				});
			});

			// Append the content
			that.container.appendChild(that.content);

			that.container.style.position = that.css.position === "static" ? "relative" : that.css.position;

			that.update();

			on(that.content, "scroll", that.events.scroll);
			on(that.container, "mouseenter", that.events.mouseenter);

			on(window, "resize", that.events.debounce);

			on(document, 'DOMContentLoaded', that.events.update);
			on(window, 'load', that.events.update);

			that.initialised = true;
		}
	};

	/**
	 * Scroll callback
	 * @return {Void}
	 */
	MiniBar.prototype.scroll = function() {
		this.updateScrollBars();
	};

	/**
	 * Mouseenter callack
	 * @return {Void}
	 */
	MiniBar.prototype.mouseenter = function(e) {
		this.updateScrollBars();
	};

	/**
	 * Mousedown callack
	 * @return {Void}
	 */
	MiniBar.prototype.mousedown = function(e) {
		e.preventDefault();

		this.down = true;

		var type = this.config.barType === "progress" ? "tracks" : "bars";
		var currentAxis = e.target === this[type].x.node ? "x" : "y";

		this.currentAxis = currentAxis;

		// Lets do all the nasty reflow-triggering stuff before mousemove
		// otherwise it'll be a shit-show during mousemove
		this.update();

		// Keep the tracks visible during drag
		this.container.classList.add(this.config.visibleClass);
		this.container.classList.add(this.config.scrollingClass + "-" + this.currentAxis);


		// Save data for use during mousemove
		if ( this.config.barType === "progress" ) {

			this.origin = {
				x: e.pageX - this.tracks[currentAxis].x,
				y: e.pageY - this.tracks[currentAxis].y
			};

			this.mousemove(e);

		} else {
			this.origin = {
				x: e.pageX - this.bars[currentAxis].x,
				y: e.pageY - this.bars[currentAxis].y
			};
		}

		// Attach the mousemove and mouseup event listeners now
		// instead of permanently having them on
		on(document, "mousemove", this.events.mousemove);
		on(document, "mouseup", this.events.mouseup);
	};

	/**
	 * Mousemove callack
	 * @return {Void}
	 */
	MiniBar.prototype.mousemove = function(e) {
		e.preventDefault();

		var that = this, o = this.origin;
		var track = that.tracks[that.currentAxis];
		var trackSize = track[that.trackSize[that.currentAxis]];
		var contentSize = that.rect[that.trackSize[that.currentAxis]];
		var offset, ratio, scroll;

		if ( that.config.barType === "progress" ) {
			offset = e[that.mouseAxis[that.currentAxis]] - track[that.currentAxis];
			ratio = offset / trackSize;
			scroll = ratio * (that.content[that.scrollSize[that.currentAxis]] -  contentSize);
		} else {
			offset = e[that.mouseAxis[that.currentAxis]] - o[that.currentAxis] - track[that.currentAxis];
			ratio = offset / trackSize;
			scroll = ratio * that[that.scrollSize[that.currentAxis]];
		}

		// Update scroll position
		raf(function () {
			that.content[that.scrollPos[that.currentAxis]] = scroll;
		});
	};

	/**
	 * Mouseup callack
	 * @return {Void}
	 */
	MiniBar.prototype.mouseup = function(e) {

		this.container.classList.toggle(this.config.visibleClass, this.config.alwaysShowBars);
		this.container.classList.remove(this.config.scrollingClass + "-" + this.currentAxis);

		if ( !e.target.classList.contains(this.config.barClass) ) {
			this.container.classList.remove(this.config.hoverClass + "-x");
			this.container.classList.remove(this.config.hoverClass + "-y");
		}

		this.origin = {};
		this.currentAxis = null;
		this.down = false;

		off(document, "mousemove", this.events.mousemove);
		off(document, "mouseup", this.events.mouseup);
	};

	/**
	 * Update cached values and recalculate sizes / positions
	 * @return {Void}
	 */
	MiniBar.prototype.update = function() {
		var that = this;

		// Cache the dimensions

		that.rect = rect(that.container);

		that.scrollTop = that.content.scrollTop;
		that.scrollLeft = that.content.scrollLeft;
		that.scrollHeight = that.content.scrollHeight;
		that.scrollWidth = that.content.scrollWidth;

		// Do we need horizontal scrolling?
		var scrollX = that.scrollWidth > that.rect.width;

		// Do we need vertical scrolling?
		var scrollY = that.scrollHeight > that.rect.height;

		that.container.classList.toggle("mb-scroll-x", scrollX);
		that.container.classList.toggle("mb-scroll-y", scrollY);

		// Style the content
		style(that.content, {
			overflow: "auto",
			marginBottom: scrollX ? -that.scrollbarSize : "",
			paddingBottom: scrollX ? that.scrollbarSize : "",
			marginRight: scrollY ? -that.scrollbarSize : "",
			paddingRight: scrollY ? that.scrollbarSize : ""
		});

		that.scrollX = scrollX;
		that.scrollY = scrollY;

		each(that.tracks, function (i, track) {
			extend(track, rect(track.node));
			extend(that.bars[i], rect(that.bars[i].node));
		});

		// Update scrollbars
		that.updateScrollBars();
	};

	/**
	 * Update a scrollbar's size and position
	 * @return {Void}
	 */
	MiniBar.prototype.updateScrollBar = function(axis) {

		var that = this, css = {};
		var trackSize = that.tracks[axis][that.trackSize[axis]];
		var contentSize = that.rect[that.trackSize[axis]];

		// We need a live value, not cached
		var scrollOffset = that.content[that.scrollPos[axis]];

		var barRatio = trackSize / that[that.scrollSize[axis]];
		var scrollRatio = scrollOffset / (that[that.scrollSize[axis]] - contentSize);

		if ( that.config.barType === "progress" ) {
			// Only need to set the size of a progress bar
			css[that.trackSize[axis]] = Math.floor(trackSize * scrollRatio);
		} else {
			// Set the scrollbar size
			css[that.trackSize[axis]] = Math.max(Math.floor(barRatio * contentSize), that.config.minBarSize);

			// Set the scrollbar position
			css[that.trackPos[axis]] = Math.floor((trackSize - css[that.trackSize[axis]]) * scrollRatio);
		}

		raf(function () {
			style(that.bars[axis].node, css);
		});
	};

	/**
	 * Update all scrollbars
	 * @return {Void}
	 */
	MiniBar.prototype.updateScrollBars = function() {
		each(this.bars, function(i, v) {
			this.updateScrollBar(i);
		}, this);
	};

	/**
	 * Destroy instance
	 * @return {Void}
	 */
	MiniBar.prototype.destroy = function() {
		var that = this;

		if ( that.initialised ) {

			// Remove the event listeners
			off(that.container, "mouseenter", that.events.mouseenter);
			off(window, "resize", that.events.debounce);

			// Remove the main classes from the container
			that.container.classList.remove(that.config.visibleClass);
			that.container.classList.remove(that.config.containerClass);

			// Move the nodes back to their original container
			while(that.content.firstChild) {
				that.container.appendChild(that.content.firstChild);
			}

			// Remove the tracks
			each(that.tracks, function(i, track) {
				that.container.removeChild(track.node);
				that.container.classList.remove("mb-scroll-" + i);
			});

			// Remove the content node
			that.container.removeChild(that.content);

			// Clear node references
			that.bars = { x: {}, y: {} };
			that.tracks = { x: {}, y: {} };
			that.content = null;

			that.initialised = false;
		}
	};

	root.MiniBar = MiniBar;

}(this));
