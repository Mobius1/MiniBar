/*!
 * MiniBar 0.1.10
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
	var config = {
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
		scrollingClass: "mb-scrolling",
		textareaClass: "mb-textarea"
	};

	/**
	 * Object.assign polyfill (https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill)
	 * @param  {Object} target
	 * @param  {Object} args
	 * @return {Object}
	 */
	var extend = function(o, args) {
		var to = Object(o);

		for (var index = 1; index < arguments.length; index++) {
			var ns = arguments[index];

			if (ns != null) {
				// Skip over if undefined or null
				for (var nxt in ns) {
					// Avoid bugs when hasOwnProperty is shadowed
					if (Object.prototype.hasOwnProperty.call(ns, nxt)) {
						to[nxt] = ns[nxt];
					}
				}
			}
		}
		return to;
	};

	/**
	 * Add event listener to target
	 * @param  {Object} el
	 * @param  {String} e
	 * @param  {Function} fn
	 */
	var on = function on(el, e, fn) {
		el.addEventListener(e, fn, false);
	};

	/**
	 * Remove event listener to target
	 * @param  {Object} el
	 * @param  {String} e
	 * @param  {Function} fn
	 */
	var off = function off(el, e, fn) {
		el.removeEventListener(e, fn);
	};

	/**
	 * Iterator helper
	 * @param  {(Array|Object)}   arr Any object, array or array-like collection.
	 * @param  {Function} f   The callback function
	 * @param  {Object}   s      Change the value of this
	 * @return {Void}
	 */
	var each = function each(arr, fn, s) {
		if ("[object Object]" === Object.prototype.toString.call(arr)) {
			for (var d in arr) {
				if (Object.prototype.hasOwnProperty.call(arr, d)) {
					fn.call(s, d, arr[d]);
				}
			}
		} else {
			for (var e = 0, f = arr.length; e < f; e++) {
				fn.call(s, e, arr[e]);
			}
		}
	};

	/**
	 * Mass assign style properties
	 * @param  {Object} el
	 * @param  {(String|Object)} prop
	 * @param  {String} val
	 */
	var style = function style(el, prop, val) {
		var css = el && el.style;
		var obj = "[object Object]" === Object.prototype.toString.call(prop);

		if (css) {
			if (!val && !obj) {
				return window.getComputedStyle(el);
			} else {
				if (obj) {
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
		var w = window;
		var d = document;
		var b = d.body;
		var r = el.getBoundingClientRect();
		var x = w.pageXOffset !== undefined ? w.pageXOffset : (d.documentElement || b.parentNode || b).scrollLeft;
		var y = w.pageYOffset !== undefined ? w.pageYOffset : (d.documentElement || b.parentNode || b).scrollTop;

		return {
			x: r.left + x,
			y: r.top + y,
			height: Math.round(r.height),
			width: Math.round(r.width)
		};
	};

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not be triggered.
	 * @param  {Function} fn
	 * @param  {Number} wait
	 * @param  {Boolean} now
	 * @return {Function}
	 */
	function debounce(fn, wait, now) {
		var t;
		return function() {
			var ctx = this, args = arguments;
			var later = function() {
				t = null;
				if (!now) fn.apply(ctx, args);
			};
			var callNow = now && !t;
			clearTimeout(t);
			t = setTimeout(later, wait);
			if (callNow) fn.apply(ctx, args);
		};
	}

	/**
	 * requestAnimationFrame Polyfill
	 */
	var raf = window.requestAnimationFrame || function () {
		var tl = 0;

		return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (fn) {
			var tc = new Date().getTime(), td;

			/* Dynamically set the delay on a per-tick basis to more closely match 60fps. */
			/* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671. */
			td = Math.max(0, 16 - (tc - tl));
			tl = tc + td;

			return setTimeout(function () {
				fn(tc + td);
			}, td);
		};
	}();

	// t: current time, b: begInnIng value, c: change In value, d: duration
	var easeOutCirc = function (t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	};

	/**
	 * Get native scrollbar width
	 * @return {Number} Scrollbar width
	 */
	var getScrollBarWidth = function() {
		var width = 0, d = document;
		var div = d.createElement("div");

		div.style.cssText = "width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;";

		d.body.appendChild(div);
		width = div.offsetWidth - div.clientWidth;
		d.body.removeChild(div);

		return width;
	};

	/**
	 * Main Library
	 * @param {(String|Object)} content CSS3 selector string or node reference
	 * @param {Object} options 			User defined options
	 */
	var MiniBar = function(container, options) {

		this.container = typeof container === "string" ? document.querySelector(container) : container;

		this.config = extend({}, config, options || window.MiniBarOptions || {});

		this.css = window.getComputedStyle(this.container);

		this.size = getScrollBarWidth();
		this.textarea = this.container.nodeName.toLowerCase() === "textarea";

		this.bars = { x: {}, y: {} };
		this.tracks = { x: {}, y: {} };

		// Dimension objects
		this.trackPos = { x: "left" , y: "top" };
		this.trackSize = { x: "width" , y: "height" };
		this.scrollPos = { x: "scrollLeft" , y: "scrollTop" };
		this.scrollSize = { x: "scrollWidth" , y: "scrollHeight" };
		this.mouseAxis = { x: "pageX" , y: "pageY" };

		// Events
		this.events = {};

		each(["update", "scroll", "mouseenter", "mousedown", "mousemove", "mouseup", "mousewheel"], function(i, evt) {
			this.events[evt] = this[evt].bind(this);
		}, this);

		this.events.debounce = debounce(this.events.update, 50);

		this.init();
	};

	var proto = MiniBar.prototype;

	/**
	 * Init instance
	 * @return {Void}
	 */
	proto.init = function() {
		var that = this;

		if ( !that.initialised ) {

			if ( that.textarea ) {
				that.content = that.container;
				that.container = document.createElement("div");
				that.container.classList.add(that.config.textareaClass);

				that.content.parentNode.insertBefore(that.container, that.content);
				that.container.appendChild(that.content);

				on(that.content, "input", function(e) {
					that.update();
				});

			} else {
				that.content = document.createElement("div");

				// Move all nodes to the the new content node
				while(that.container.firstChild) {
					that.content.appendChild(that.container.firstChild);
				}
			}

			that.container.classList.add(that.config.containerClass);

			that.content.classList.add(that.config.contentClass);

			if (that.config.alwaysShowBars) {
				that.container.classList.add(that.config.visibleClass);
			}

			// Set the tracks and bars up and append them to the container
			each(that.tracks, function (i, track) {
				that.bars[i].node = document.createElement("div");
				track.node = document.createElement("div");

				// IE10 can't do multiple args
				track.node.classList.add(that.config.trackClass);
				track.node.classList.add(that.config.trackClass + "-" + i);

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
					if ( !that.down ) {
						that.container.classList.remove(that.config.hoverClass + "-" + i);
					}
				});
			});

			// Append the content
			that.container.appendChild(that.content);

			if ( that.css.position === "static" ) {
				that.manualPosition = true;
				that.container.style.position = "relative";
			}

			that.update();

			on(that.content, "scroll", that.events.scroll);
			on(that.content, "wheel", that.events.mousewheel);
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
	proto.scroll = function(e) {
		this.updateScrollBars();
	};

	/**
	 * Mousewheel callback
	 * @return {Void}
	 */
	proto.mousewheel = function(e) {
		if ( this.config.horizontalMouseScroll ) {

			e.preventDefault();

			var that = this, y = e.deltaY, startTime = Date.now();

			var horizontalScroll = function() {
				var now = Date.now(),
						ct = now - startTime,
						scroll = easeOutCirc(ct, 0, 8, 400);

				if ( ct > 400 ) {
					cancelAnimationFrame(that.frame);
					return;
				}

				if ( y < 0 ) {
					that.content.scrollLeft -= scroll;
				} else if ( y > 0 ) {
					that.content.scrollLeft += scroll;
				}

				that.frame = raf(horizontalScroll);
			};

			horizontalScroll();
		}
	};

	/**
	 * Mouseenter callack
	 * @return {Void}
	 */
	proto.mouseenter = function(e) {
		this.updateScrollBars();
	};

	/**
	 * Mousedown callack
	 * @return {Void}
	 */
	proto.mousedown = function(e) {
		e.preventDefault();

		this.down = true;

		var o = this.config, type = o.barType === "progress" ? "tracks" : "bars";
		var axis = e.target === this[type].x.node ? "x" : "y";

		this.currentAxis = axis;

		// Lets do all the nasty reflow-triggering stuff before mousemove
		// otherwise it'll be a shit-show during mousemove
		this.update();

		// Keep the tracks visible during drag
		this.container.classList.add(o.visibleClass);
		this.container.classList.add(o.scrollingClass + "-" + axis);


		// Save data for use during mousemove
		if ( o.barType === "progress" ) {

			this.origin = {
				x: e.pageX - this.tracks[axis].x,
				y: e.pageY - this.tracks[axis].y
			};

			this.mousemove(e);

		} else {
			this.origin = {
				x: e.pageX - this.bars[axis].x,
				y: e.pageY - this.bars[axis].y
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
	proto.mousemove = function(e) {
		e.preventDefault();

		var that = this, o = this.origin, axis = this.currentAxis;
		var track = that.tracks[axis];
		var trackSize = track[that.trackSize[axis]];
		var contentSize = that.rect[that.trackSize[axis]];
		var offset, ratio, scroll;

		if ( that.config.barType === "progress" ) {
			offset = e[that.mouseAxis[axis]] - track[axis];
			ratio = offset / trackSize;
			scroll = ratio * (that.content[that.scrollSize[axis]] -  contentSize);
		} else {
			offset = e[that.mouseAxis[axis]] - o[axis] - track[axis];
			ratio = offset / trackSize;
			scroll = ratio * that[that.scrollSize[axis]];
		}

		// Update scroll position
		raf(function () {
			that.content[that.scrollPos[axis]] = scroll;
		});
	};

	/**
	 * Mouseup callack
	 * @return {Void}
	 */
	proto.mouseup = function(e) {
		var cl = this.container.classList, o = this.config, evts = this.events;

		cl.toggle(o.visibleClass, o.alwaysShowBars);
		cl.remove(o.scrollingClass + "-" + this.currentAxis);

		if ( !e.target.classList.contains(o.barClass) ) {
			cl.remove(o.hoverClass + "-x");
			cl.remove(o.hoverClass + "-y");
		}

		this.origin = {};
		this.currentAxis = null;
		this.down = false;

		off(document, "mousemove", evts.mousemove);
		off(document, "mouseup", evts.mouseup);
	};

	/**
	 * Update cached values and recalculate sizes / positions
	 * @return {Void}
	 */
	proto.update = function() {
		var that = this, ct = that.content;

		// Cache the dimensions

		that.rect = rect(that.container);

		that.scrollTop = ct.scrollTop;
		that.scrollLeft = ct.scrollLeft;
		that.scrollHeight = ct.scrollHeight;
		that.scrollWidth = ct.scrollWidth;

		// Do we need horizontal scrolling?
		var sx = that.scrollWidth > that.rect.width && !that.textarea;

		// Do we need vertical scrolling?
		var sy = that.scrollHeight > that.rect.height;

		that.container.classList.toggle("mb-scroll-x", sx);
		that.container.classList.toggle("mb-scroll-y", sy);

		// Style the content
		style(ct, {
			overflow: "auto",
			marginBottom: sx ? -that.size : "",
			paddingBottom: sx ? that.size : "",
			marginRight: sy ? -that.size : "",
			paddingRight: sy ? that.size : ""
		});

		that.scrollX = sx;
		that.scrollY = sy;

		each(that.tracks, function (i, t) {
			extend(t, rect(t.node));
			extend(that.bars[i], rect(that.bars[i].node));
		});

		// Update scrollbars
		that.updateScrollBars();

		// Only scroll to bottom if the cursor is at the end of the content and we're not dragging
		if ( that.textarea && !that.down && ct.selectionStart >= ct.value.length ) {
			ct.scrollTop = that.scrollHeight + 1000;
		}
	};

	/**
	 * Update a scrollbar's size and position
	 * @return {Void}
	 */
	proto.updateScrollBar = function(axis) {

		var that = this, css = {};

		// Width or height of track
		var ts = that.tracks[axis][that.trackSize[axis]];

		// Width or height of content
		var cs = that.rect[that.trackSize[axis]];

		// We need a live value, not cached
		var so = that.content[that.scrollPos[axis]];

		var br = ts / that[that.scrollSize[axis]];
		var sr = so / (that[that.scrollSize[axis]] - cs);

		if ( that.config.barType === "progress" ) {
			// Only need to set the size of a progress bar
			css[that.trackSize[axis]] = Math.floor(ts * sr);
		} else {
			// Set the scrollbar size
			css[that.trackSize[axis]] = Math.max(Math.floor(br * cs), that.config.minBarSize);

			// Set the scrollbar position
			css[that.trackPos[axis]] = Math.floor((ts - css[that.trackSize[axis]]) * sr);
		}

		raf(function () {
			style(that.bars[axis].node, css);
		});
	};

	/**
	 * Update all scrollbars
	 * @return {Void}
	 */
	proto.updateScrollBars = function() {
		each(this.bars, function(i, v) {
			this.updateScrollBar(i);
		}, this);
	};

	/**
	 * Destroy instance
	 * @return {Void}
	 */
	proto.destroy = function() {
		var that = this, ct = this.container;

		if ( that.initialised ) {

			// Remove the event listeners
			off(ct, "mouseenter", that.events.mouseenter);
			off(window, "resize", that.events.debounce);

			// Remove the main classes from the container
			ct.classList.remove(that.config.visibleClass);
			ct.classList.remove(that.config.containerClass);

			// Move the nodes back to their original container
			while(that.content.firstChild) {
				ct.appendChild(that.content.firstChild);
			}

			// Remove the tracks
			each(that.tracks, function(i, track) {
				ct.removeChild(track.node);
				ct.classList.remove("mb-scroll-" + i);
			});

			// Remove the content node
			ct.removeChild(that.content);

			// Remove manual positioning
			if ( that.manualPosition ) {
				ct.style.position = "";

				// IE returns null for empty style attribute
				if ( ct.getAttribute("style") === null || !ct.getAttribute("style").length ) {
					ct.removeAttribute("style");
				}
			}

			// Clear node references
			that.bars = { x: {}, y: {} };
			that.tracks = { x: {}, y: {} };
			that.content = null;

			that.initialised = false;
		}
	};

	root.MiniBar = MiniBar;

}(this));