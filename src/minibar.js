/*!
 * MiniBar 0.1.14
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
		horizontalMouseScroll: false,

		containerClass: "mb-container",
		contentClass: "mb-content",
		trackClass: "mb-track",
		barClass: "mb-bar",
		visibleClass: "mb-visible",
		progressClass: "mb-progress",
		hoverClass: "mb-hover",
		scrollingClass: "mb-scrolling",
		textareaClass: "mb-textarea",
		wrapperClass: "mb-wrapper"
	};

	/**
	 * Deep extend
	 * @param  {Object} src
	 * @param  {Object} props
	 * @return {Object}
	 */
	var extend = function(src, props) {
		for (var p in props) {
			var v = props[p];
			if (v && Object.prototype.toString.call(v) === "[object Object]") {
					src[p] = src[p] || {};
					extend(src[p], v);
			} else {
					src[p] = v;
			}
		}
		return src;
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
	 * classList shim
	 * @type {Object}
	 */
	var classList = {
		contains: function(a, b) {
			if ( a ) { return a.classList ? a.classList.contains(b) : !!a.className && !!a.className.match(new RegExp("(\\s|^)" + b + "(\\s|$)")); }
		},
		add: function(a, b) {
			if (!classList.contains(a, b)) { if (a.classList) { a.classList.add(b); } else { a.className = a.className.trim() + " " + b; } }
		},
		remove: function(a, b) {
			if (classList.contains(a, b)) { if (a.classList) { a.classList.remove(b); } else { a.className = a.className.replace(new RegExp("(^|\\s)" + b.split(" ").join("|") + "(\\s|$)", "gi"), " "); } }
		},
		toggle: function(a, b, f) {
			var result = this.contains(a, b), method = result ? f !== true && "remove" : f !== false && "add";

			if (method) {
				this[method](a, b);
			}
		}
	};

	/**
	 * Main Library
	 * @param {(String|Object)} content CSS3 selector string or node reference
	 * @param {Object} options 			User defined options
	 */
	var MiniBar = function(container, options) {
		this.container = typeof container === "string" ? doc.querySelector(container) : container;

		this.config = extend(config, options || win.MiniBarOptions);

		this.css = win.getComputedStyle(this.container);

		this.size = getScrollBarWidth();
		this.textarea = this.container.nodeName.toLowerCase() === "textarea";

		this.bars = { x: {}, y: {} };
		this.tracks = { x: {}, y: {} };

		// Events
		this.events = {};

		// Bind events
		each(["update", "scroll", "mouseenter", "mousedown", "mousemove", "mouseup", "mousewheel"], function(i, evt) {
			this.events[evt] = this[evt].bind(this);
		}, this);

		// Debounce win resize
		this.events.debounce = debounce(this.events.update, 50);

		this.init();
	};

	var proto = MiniBar.prototype;

	/**
	 * Init instance
	 * @return {Void}
	 */
	proto.init = function() {
		var mb = this;

		if ( !mb.initialised ) {

			// We need a seperate wrapper for the textarea that we can pad
			// otherwise the text will be up against the container edges
			if ( mb.textarea ) {
				mb.content = mb.container;
				mb.container = document.createElement("div");
				classList.add(mb.container, mb.config.textareaClass);

				mb.wrapper = document.createElement("div");
				classList.add(mb.wrapper, mb.config.wrapperClass);
				mb.container.appendChild(mb.wrapper);

				mb.content.parentNode.insertBefore(mb.container, mb.content);

				// Update the bar on input
				mb.content.addEventListener("input", function(e) {
					mb.update();
				});

			} else {
				mb.content = doc.createElement("div");

				// Move all nodes to the the new content node
				while(mb.container.firstChild) {
					mb.content.appendChild(mb.container.firstChild);
				}
			}

			classList.add(mb.container, mb.config.containerClass);

			classList.add(mb.content, mb.config.contentClass);

			if (mb.config.alwaysShowBars) {
				classList.add(mb.container, mb.config.visibleClass);
			}

			// Set the tracks and bars and append them to the container
			each(mb.tracks, function (axis, track) {
				mb.bars[axis].node = doc.createElement("div");
				track.node = doc.createElement("div");

				// IE10 can't do multiple args
				classList.add(track.node, mb.config.trackClass);
				classList.add(track.node, mb.config.trackClass + "-" + axis);

				classList.add(mb.bars[axis].node, mb.config.barClass);
				track.node.appendChild(mb.bars[axis].node);
				mb.container.appendChild(track.node);

				if ( mb.config.barType === "progress" ) {
					classList.add(track.node, mb.config.progressClass);

					on(track.node, "mousedown", mb.events.mousedown);
				} else {
					on(mb.bars[axis].node, "mousedown", mb.events.mousedown);
				}

				on(track.node, "mouseenter", function(e) {
					classList.add(mb.container, mb.config.hoverClass + "-" + axis);
				});
				on(track.node, "mouseleave", function(e) {
					if ( !mb.down ) {
						classList.remove(mb.container, mb.config.hoverClass + "-" + axis);
					}
				});
			});

			// Append the content
			if ( mb.textarea ) {
				mb.wrapper.appendChild(mb.content);
			} else {
				mb.container.appendChild(mb.content);
			}

			if ( mb.css.position === "static" ) {
				mb.manualPosition = true;
				mb.container.style.position = "relative";
			}

			mb.update();

			on(mb.content, "scroll", mb.events.scroll);
			on(mb.content, "wheel", mb.events.mousewheel);
			on(mb.container, "mouseenter", mb.events.mouseenter);

			on(win, "resize", mb.events.debounce);

			on(doc, 'DOMContentLoaded', mb.events.update);
			on(win, 'load', mb.events.update);

			mb.initialised = true;
		}
	};

	/**
	 * Scroll callback
	* @param  {Object} e Event interface
	 * @return {Void}
	 */
	proto.scroll = function(e) {
		this.updateScrollBars();
	};

	/**
	 * Scroll content by amount
	 * @param  {Number} 	amount   Number of pixels to scroll
	 * @param  {String} 	axis     Scroll axis
	 * @param  {Number} 	duration Duration of scroll animation in ms
	 * @param  {Function} 	easing   Easing function
	 * @return {Void}
	 */
	proto.scrollBy = function(amount, axis, duration, easing) {

		axis = axis || "y";

		// No animation
		if ( duration === 0 ) {
			this.content[scrollPos[axis]] += amount;
			return;
		}

		// Duration of scroll
		if ( duration === undefined ) {
			duration = 250;
		}

		// Easing function
		easing = easing || function (t, b, c, d) {
			t /= d;
			return -c * t*(t-2) + b;
		};

		var t = this, start = Date.now(), position = t.content[scrollPos[axis]];

		// Scroll function
		var scroll = function() {
			var now = Date.now(), ct = now - start;

			// Cancel after allotted interval
			if ( ct > duration ) {
				cancelAnimationFrame(t.frame);
				return;
			}

			// Scroll the content
			t.content[scrollPos[axis]] = easing(ct, position, amount, duration);

			// requestAnimationFrame
			t.frame = raf(scroll);
		};

		scroll();
	};

	/**
	 * Mousewheel callback
	 * @param  {Object} e Event interface
	 * @return {Void}
	 */
	proto.mousewheel = function(e) {
		e.preventDefault();

		if ( this.config.horizontalMouseScroll ) {
			this.scrollBy(e.deltaY * 100, "x");
		}
	};

	/**
	 * Mouseenter callack
	 * @param  {Object} e Event interface
	 * @return {Void}
	 */
	proto.mouseenter = function(e) {
		this.updateScrollBars();
	};

	/**
	 * Mousedown callack
	 * @param  {Object} e Event interface
	 * @return {Void}
	 */
	proto.mousedown = function(e) {
		e.preventDefault();

		this.down = true;

		var mb = this, o = mb.config, type = o.barType === "progress" ? "tracks" : "bars";
		var axis = e.target === mb[type].x.node ? "x" : "y";

		mb.currentAxis = axis;

		// Lets do all the nasty reflow-triggering stuff before mousemove
		// otherwise it'll be a shit-show during mousemove
		mb.update();

		// Keep the tracks visible during drag
		classList.add(mb.container, o.visibleClass);
		classList.add(mb.container, o.scrollingClass + "-" + axis);


		// Save data for use during mousemove
		if ( o.barType === "progress" ) {

			mb.origin = {
				x: e.pageX - mb.tracks[axis].x,
				y: e.pageY - mb.tracks[axis].y
			};

			mb.mousemove(e);

		} else {
			mb.origin = {
				x: e.pageX - mb.bars[axis].x,
				y: e.pageY - mb.bars[axis].y
			};
		}

		// Attach the mousemove and mouseup event listeners now
		// instead of permanently having them on
		on(doc, "mousemove", mb.events.mousemove);
		on(doc, "mouseup", mb.events.mouseup);
	};

	/**
	 * Mousemove callack
	 * @param  {Object} e Event interface
	 * @return {Void}
	 */
	proto.mousemove = function(e) {
		e.preventDefault();

		var mb = this, o = this.origin, axis = this.currentAxis,
			track = mb.tracks[axis],
			ts = track[trackSize[axis]],
			offset, ratio, scroll;

		if ( mb.config.barType === "progress" ) {
			offset = e[mAxis[axis]] - track[axis];
			ratio = offset / ts;
			scroll = ratio * (mb.content[scrollSize[axis]] -  mb.rect[trackSize[axis]]);
		} else {
			offset = e[mAxis[axis]] - o[axis] - track[axis];
			ratio = offset / ts;
			scroll = ratio * mb[scrollSize[axis]];
		}

		// Update scroll position
		raf(function () {
			mb.content[scrollPos[axis]] = scroll;
		});
	};

	/**
	 * Mouseup callack
	 * @param  {Object} e Event interface
	 * @return {Void}
	 */
	proto.mouseup = function(e) {
		var o = this.config, evts = this.events;

		classList.toggle(this.container, o.visibleClass, o.alwaysShowBars);
		classList.remove(this.container, o.scrollingClass + "-" + this.currentAxis);

		if ( !classList.contains(e.target, o.barClass) ) {
			classList.remove(this.container, o.hoverClass + "-x");
			classList.remove(this.container, o.hoverClass + "-y");
		}

		this.origin = {};
		this.currentAxis = null;
		this.down = false;

		off(doc, "mousemove", evts.mousemove);
		off(doc, "mouseup", evts.mouseup);
	};

	/**
	 * Update cached values and recalculate sizes / positions
	 * @param  {Object} e Event interface
	 * @return {Void}
	 */
	proto.update = function() {
		var mb = this, ct = mb.content;

		// Cache the dimensions

		mb.rect = rect(mb.container);

		mb.scrollTop = ct.scrollTop;
		mb.scrollLeft = ct.scrollLeft;
		mb.scrollHeight = ct.scrollHeight;
		mb.scrollWidth = ct.scrollWidth;

		// Do we need horizontal scrolling?
		var sx = mb.scrollWidth > mb.rect.width && !mb.textarea;

		// Do we need vertical scrolling?
		var sy = mb.scrollHeight > mb.rect.height;

		classList.toggle(mb.container, "mb-scroll-x", sx);
		classList.toggle(mb.container, "mb-scroll-y", sy);

		// Style the content
		style(ct, {
			overflow: "auto",
			marginBottom: sx ? -mb.size : "",
			paddingBottom: sx ? mb.size : "",
			marginRight: sy ? -mb.size : "",
			paddingRight: sy ? mb.size : ""
		});

		mb.scrollX = sx;
		mb.scrollY = sy;

		each(mb.tracks, function (i, track) {
			extend(track, rect(track.node));
			extend(mb.bars[i], rect(mb.bars[i].node));
		});

		// Update scrollbars
		mb.updateScrollBars();

		mb.wrapperPadding = 0;

		if ( mb.textarea ) {
			var css = style(mb.wrapper);

			mb.wrapperPadding = parseInt(css.paddingTop, 10) + parseInt(css.paddingBottom, 10);

			// Only scroll to bottom if the cursor is at the end of the content and we're not dragging
			if ( !mb.down && mb.content.selectionStart >= mb.content.value.length ) {
				mb.content.scrollTop = mb.scrollHeight + 1000;
			}
		}
	};

	/**
	 * Update a scrollbar's size and position
	 * @param  {String} axis
	 * @return {Void}
	 */
	proto.updateScrollBar = function(axis) {

		var mb = this, css = {},
			ts = trackSize,
			ss = scrollSize,
			o = mb.config,

			// Width or height of track
			tsize = mb.tracks[axis][ts[axis]],

			// Width or height of content
			cs = mb.rect[ts[axis]] - mb.wrapperPadding,

			// We need a live value, not cached
			so = mb.content[scrollPos[axis]],

			br = tsize / mb[ss[axis]],
			sr = so / (mb[ss[axis]] - cs);

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
			style(mb.bars[axis].node, css);
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
		var mb = this, ct = this.container;

		if ( mb.initialised ) {

			// Remove the event listeners
			off(ct, "mouseenter", mb.events.mouseenter);
			off(win, "resize", mb.events.debounce);

			// Remove the main classes from the container
			classList.remove(ct, mb.config.visibleClass);
			classList.remove(ct, mb.config.containerClass);

			// Move the nodes back to their original container
			while(mb.content.firstChild) {
				ct.appendChild(mb.content.firstChild);
			}

			// Remove the tracks
			each(mb.tracks, function(i, track) {
				ct.removeChild(track.node);
				classList.remove(ct, "mb-scroll-" + i);
			});

			// Remove the content node
			ct.removeChild(mb.content);

			// Remove manual positioning
			if ( mb.manualPosition ) {
				ct.style.position = "";

				// IE returns null for empty style attribute
				if ( ct.getAttribute("style") === null || !ct.getAttribute("style").length ) {
					ct.removeAttribute("style");
				}
			}

			// Clear node references
			mb.bars = { x: {}, y: {} };
			mb.tracks = { x: {}, y: {} };
			mb.content = null;

			mb.initialised = false;
		}
	};

	root.MiniBar = MiniBar;

}(this));