/*!
 * MiniBar 0.1.10
 * http://mobius.ovh/
 *
 * Released under the MIT license
 */
(function(root) {

	"use strict";

	var win = window,
		doc = document,
		body = doc.body,

		// Dimension terms
		trackPos = { x: "left" , y: "top" },
		trackSize = { x: "width" , y: "height" },
		scrollPos = { x: "scrollLeft" , y: "scrollTop" },
		scrollSize = { x: "scrollWidth" , y: "scrollHeight" },
		mAxis = { x: "pageX" , y: "pageY" };

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
	 * Object.assign polyfill
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
	var on = function(el, e, fn) {
		el.addEventListener(e, fn, false);
	};

	/**
	 * Remove event listener from target
	 * @param  {Object} el
	 * @param  {String} e
	 * @param  {Function} fn
	 */
	var off = function(el, e, fn) {
		el.removeEventListener(e, fn);
	};

	/**
	 * Iterator helper
	 * @param  {(Array|Object)}   arr Any object, array or array-like collection.
	 * @param  {Function} f   The callback function
	 * @param  {Object}   s      Change the value of this
	 * @return {Void}
	 */
	var each = function(arr, fn, s) {
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
	var style = function(el, prop) {
		var css = el && el.style;
		var obj = "[object Object]" === Object.prototype.toString.call(prop);

		if (css) {
			if (!prop) {
				return win.getComputedStyle(el);
			} else {
				if (obj) {
					each(prop, function (p, v) {
						if (!(p in css)) {
							p = "-webkit-" + p;
						}
						css[p] = v + (typeof v === "string" ? "" : p === "opacity" ? "" : "px");
					});
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
	var rect = function(el) {
		var w = win;
		var r = el.getBoundingClientRect();
		var x = w.pageXOffset !== undefined ? w.pageXOffset : (doc.documentElement || body.parentNode || body).scrollLeft;
		var y = w.pageYOffset !== undefined ? w.pageYOffset : (doc.documentElement || body.parentNode || body).scrollTop;

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
	var raf = win.requestAnimationFrame || function () {
		var tl = 0;

		return win.webkitRequestAnimationFrame || win.mozRequestAnimationFrame || function (fn) {
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
		var width = 0;
		var div = doc.createElement("div");

		div.style.cssText = "width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;";

		doc.body.appendChild(div);
		width = div.offsetWidth - div.clientWidth;
		doc.body.removeChild(div);

		return width;
	};

	/**
	 * Main Library
	 * @param {(String|Object)} content CSS3 selector string or node reference
	 * @param {Object} options 			User defined options
	 */
	var MiniBar = function(container, options) {

		var t = this;

		t.container = typeof container === "string" ? doc.querySelector(container) : container;

		t.config = extend({}, config, options || win.MiniBarOptions || {});

		t.css = win.getComputedStyle(t.container);

		t.size = getScrollBarWidth();
		t.textarea = t.container.nodeName.toLowerCase() === "textarea";

		t.bars = { x: {}, y: {} };
		t.tracks = { x: {}, y: {} };

		// Events
		t.events = {};

		// Bind events
		each(["update", "scroll", "mouseenter", "mousedown", "mousemove", "mouseup", "mousewheel"], function(i, evt) {
			t.events[evt] = t[evt].bind(t);
		}, t);

		// Debounce win resize
		t.events.debounce = debounce(t.events.update, 50);

		t.init();
	};

	var proto = MiniBar.prototype;

	/**
	 * Init instance
	 * @return {Void}
	 */
	proto.init = function() {
		var t = this;

		if ( !t.initialised ) {

			if ( t.textarea ) {
				t.content = t.container;
				t.container = doc.createElement("div");
				t.container.classList.add(t.config.textareaClass);

				t.content.parentNode.insertBefore(t.container, t.content);
				t.container.appendChild(t.content);

				on(t.content, "input", function(e) {
					t.update();
				});

			} else {
				t.content = doc.createElement("div");

				// Move all nodes to the the new content node
				while(t.container.firstChild) {
					t.content.appendChild(t.container.firstChild);
				}
			}

			t.container.classList.add(t.config.containerClass);

			t.content.classList.add(t.config.contentClass);

			if (t.config.alwaysShowBars) {
				t.container.classList.add(t.config.visibleClass);
			}

			// Set the tracks and bars up and append them to the container
			each(t.tracks, function (i, track) {
				t.bars[i].node = doc.createElement("div");
				track.node = doc.createElement("div");

				// IE10 can't do multiple args
				track.node.classList.add(t.config.trackClass);
				track.node.classList.add(t.config.trackClass + "-" + i);

				t.bars[i].node.classList.add(t.config.barClass);
				track.node.appendChild(t.bars[i].node);
				t.container.appendChild(track.node);

				if ( t.config.barType === "progress" ) {
					track.node.classList.add(t.config.progressClass);

					on(track.node, "mousedown", t.events.mousedown);
				} else {
					on(t.bars[i].node, "mousedown", t.events.mousedown);
				}

				on(track.node, "mouseenter", function(e) {
					t.container.classList.add(t.config.hoverClass + "-" + i);
				});
				on(track.node, "mouseleave", function(e) {
					if ( !t.down ) {
						t.container.classList.remove(t.config.hoverClass + "-" + i);
					}
				});
			});

			// Append the content
			t.container.appendChild(t.content);

			if ( t.css.position === "static" ) {
				t.manualPosition = true;
				t.container.style.position = "relative";
			}

			t.update();

			on(t.content, "scroll", t.events.scroll);
			on(t.content, "wheel", t.events.mousewheel);
			on(t.container, "mouseenter", t.events.mouseenter);

			on(win, "resize", t.events.debounce);

			on(doc, 'DOMContentLoaded', t.events.update);
			on(win, 'load', t.events.update);

			t.initialised = true;
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

			var t = this, y = e.deltaY, startTime = Date.now();

			var horizontalScroll = function() {
				var now = Date.now(),
						ct = now - startTime,
						scroll = easeOutCirc(ct, 0, 8, 400);

				if ( ct > 400 ) {
					cancelAnimationFrame(t.frame);
					return;
				}

				if ( y < 0 ) {
					t.content.scrollLeft -= scroll;
				} else if ( y > 0 ) {
					t.content.scrollLeft += scroll;
				}

				t.frame = raf(horizontalScroll);
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
		on(doc, "mousemove", this.events.mousemove);
		on(doc, "mouseup", this.events.mouseup);
	};

	/**
	 * Mousemove callack
	 * @return {Void}
	 */
	proto.mousemove = function(e) {
		e.preventDefault();

		var t = this, o = this.origin, axis = this.currentAxis,
			track = t.tracks[axis],
			ts = track[trackSize[axis]],
			offset, ratio, scroll;

		if ( t.config.barType === "progress" ) {
			offset = e[mAxis[axis]] - track[axis];
			ratio = offset / ts;
			scroll = ratio * (t.content[scrollSize[axis]] -  t.rect[trackSize[axis]]);
		} else {
			offset = e[mAxis[axis]] - o[axis] - track[axis];
			ratio = offset / ts;
			scroll = ratio * t[scrollSize[axis]];
		}

		// Update scroll position
		raf(function () {
			t.content[scrollPos[axis]] = scroll;
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

		off(doc, "mousemove", evts.mousemove);
		off(doc, "mouseup", evts.mouseup);
	};

	/**
	 * Update cached values and recalculate sizes / positions
	 * @return {Void}
	 */
	proto.update = function() {
		var t = this, ct = t.content;

		// Cache the dimensions

		t.rect = rect(t.container);

		t.scrollTop = ct.scrollTop;
		t.scrollLeft = ct.scrollLeft;
		t.scrollHeight = ct.scrollHeight;
		t.scrollWidth = ct.scrollWidth;

		// Do we need horizontal scrolling?
		var sx = t.scrollWidth > t.rect.width && !t.textarea;

		// Do we need vertical scrolling?
		var sy = t.scrollHeight > t.rect.height;

		t.container.classList.toggle("mb-scroll-x", sx);
		t.container.classList.toggle("mb-scroll-y", sy);

		// Style the content
		style(ct, {
			overflow: "auto",
			marginBottom: sx ? -t.size : "",
			paddingBottom: sx ? t.size : "",
			marginRight: sy ? -t.size : "",
			paddingRight: sy ? t.size : ""
		});

		t.scrollX = sx;
		t.scrollY = sy;

		each(t.tracks, function (i, track) {
			extend(track, rect(track.node));
			extend(t.bars[i], rect(t.bars[i].node));
		});

		// Update scrollbars
		t.updateScrollBars();

		// Only scroll to bottom if the cursor is at the end of the content and we're not dragging
		if ( t.textarea && !t.down && ct.selectionStart >= ct.value.length ) {
			ct.scrollTop = t.scrollHeight + 1000;
		}
	};

	/**
	 * Update a scrollbar's size and position
	 * @return {Void}
	 */
	proto.updateScrollBar = function(axis) {

		var t = this, css = {},
			ts = trackSize,
			ss = scrollSize,
			o = t.config,

			// Width or height of track
			tsize = t.tracks[axis][ts[axis]],

			// Width or height of content
			cs = t.rect[ts[axis]],

			// We need a live value, not cached
			so = t.content[scrollPos[axis]],

			br = tsize / t[ss[axis]],
			sr = so / (t[ss[axis]] - cs);

		if ( o.barType === "progress" ) {
			// Only need to set the size of a progress bar
			css[ts[axis]] = Math.floor(tsize * sr);
		} else {
			// Set the scrollbar size
			css[ts[axis]] = Math.max(Math.floor(br * cs), o.minBarSize);

			// Set the scrollbar position
			css[trackPos[axis]] = Math.floor((tsize - css[ts[axis]]) * sr);
		}

		raf(function () {
			style(t.bars[axis].node, css);
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
		var t = this, ct = this.container, cl = ct.classList;

		if ( t.initialised ) {

			// Remove the event listeners
			off(ct, "mouseenter", t.events.mouseenter);
			off(win, "resize", t.events.debounce);

			// Remove the main classes from the container
			cl.remove(t.config.visibleClass);
			cl.remove(t.config.containerClass);

			// Move the nodes back to their original container
			while(t.content.firstChild) {
				ct.appendChild(t.content.firstChild);
			}

			// Remove the tracks
			each(t.tracks, function(i, track) {
				ct.removeChild(track.node);
				cl.remove("mb-scroll-" + i);
			});

			// Remove the content node
			ct.removeChild(t.content);

			// Remove manual positioning
			if ( t.manualPosition ) {
				ct.style.position = "";

				// IE returns null for empty style attribute
				if ( ct.getAttribute("style") === null || !ct.getAttribute("style").length ) {
					ct.removeAttribute("style");
				}
			}

			// Clear node references
			t.bars = { x: {}, y: {} };
			t.tracks = { x: {}, y: {} };
			t.content = null;

			t.initialised = false;
		}
	};

	root.MiniBar = MiniBar;

}(this));