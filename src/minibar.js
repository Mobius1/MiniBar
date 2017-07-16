/*!
 * MiniBar 0.0.2
 * http://mobius.ovh/
 *
 * Released under the MIT license
 */


/**
 * Default configuration properties
 * @type {Object}
 */
const defaultConfig = {
	minBarSize: 50,
	alwaysShowBars: false,

	containerClass: "mb-container",
	contentClass: "mb-content",
	trackClass: "mb-track",
	barClass: "mb-bar",
	visibleClass: "mb-visible"
};

/**
 * Iterator helper
 * @param  {(Array|Object)}   collection Any object, array or array-like collection.
 * @param  {Function} callback   The callback function
 * @param  {Object}   scope      Change the value of this
 * @return {Void}
 */
function each(collection, callback, scope) {
	if ("[object Object]" === Object.prototype.toString.call(collection)) {
		for (let d in collection) {
			if (Object.prototype.hasOwnProperty.call(collection, d)) {
				callback.call(scope, d, collection[d]);
			}
		}
	} else {
		for (let e = 0, f = collection.length; e < f; e++) {
			callback.call(scope, e, collection[e]);
		}
	}
}

/**
 * Add event listener to target
 * @param  {Object} target
 * @param  {String} event
 * @param  {Function} callback
 */
function on(target, event, callback) {
	target.addEventListener(event, callback, false);
}

/**
 * Remove event listener to target
 * @param  {Object} target
 * @param  {String} event
 * @param  {Function} callback
 */
function off(target, event, callback) {
	target.removeEventListener(event, callback);
}

/**
 * Mass assign style properties
 * @param  {Object} el
 * @param  {(String|Object)} prop
 * @param  {String} val
 */
function style(el, prop, val) {
	const css = el && el.style;
	const isObj = "[object Object]" === Object.prototype.toString.call(prop);

	if (css) {
		if (val === void 0 && !isObj) {
			val = window.getComputedStyle(el);
			return prop === void 0 ? val : val[prop];
		} else {
			if (isObj) {
				each(prop, (p, v) => {
					if (!(p in css)) {
						p = `-webkit-${p}`;
					}
					css[p] = v + (typeof v === "string" ? "" : p === "opacity" ? "" : "px");
				});
			} else {
				if (!(prop in css)) {
					prop = `-webkit-${prop}`;
				}
				css[prop] =
					val + (typeof val === "string" ? "" : prop === "opacity" ? "" : "px");
			}
		}
	}
}

function roundUp(val) {
	return (val + 0.5) << 0;
}

function roundDown(val) {
	return ~~val;
}

/**
 * Get an element's DOMRect relative to the document instead of the viewport.
 * @param  {Object} t 	HTMLElement
 * @param  {Boolean} e 	Include margins
 * @return {Object}   	Formatted DOMRect copy
 */
function rect(el) {
	const win = window;
	const doc = document;
	const body = doc.body;
	const r = el.getBoundingClientRect();
	const x = win.pageXOffset !== undefined ?
		win.pageXOffset :
		(doc.documentElement || body.parentNode || body).scrollLeft;
	const y = win.pageYOffset !== undefined ?
		win.pageYOffset :
		(doc.documentElement || body.parentNode || body).scrollTop;

	return {
		x: r.left + x,
		y: r.top + y,
		height: roundUp(r.height),
		width: roundUp(r.width)
	};
}

function debounce(a, b, c) {
	let d;
	return function() {
		const e = this;
		const f = arguments;

		const g = () => {
			d = null;
			if (!c) a.apply(e, f);
		};

		const h = c && !d;
		clearTimeout(d);
		d = setTimeout(g, b);
		if (h) {
			a.apply(e, f);
		}
	};
}

/**
 * requestAnimationFrame Polyfill
 */
const raf =
	window.requestAnimationFrame ||
	(() => {
		let timeLast = 0;

		return (
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			(callback => {
				const timeCurrent = new Date().getTime();
				let timeDelta;

				/* Dynamically set the delay on a per-tick basis to more closely match 60fps. */
				/* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671. */
				timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
				timeLast = timeCurrent + timeDelta;

				return setTimeout(() => {
					callback(timeCurrent + timeDelta);
				}, timeDelta);
			})
		);
	})();

/**
 * Get native scrollbar width
 * @return {Number} Scrollbar width
 */
function getScrollBarWidth() {
	let width = 0;
	const div = document.createElement("div");

	div.style.cssText = `width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;`;

	document.body.appendChild(div);
	width = div.offsetWidth - div.clientWidth;
	document.body.removeChild(div);

	return width;
}

class MiniBar {
	constructor(content, options) {
		this.content = content;

		if (typeof content === "string") {
			this.content = document.querySelector(content);
		}

		this.config = this.extend({}, defaultConfig, options);

		this.css = window.getComputedStyle(this.content);

		this.scrollbarSize = getScrollBarWidth();

		this.events = {
			update: this.update.bind(this),
			scroll: this.scroll.bind(this),
			mouseenter: this.mouseenter.bind(this),
			mousedown: this.mousedown.bind(this),
			mousemove: this.mousemove.bind(this),
			mouseup: this.mouseup.bind(this),
		};

		this.events.debounce = debounce(this.events.update, 50);

		this.init();
	}

	init() {
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

		each(this.tracks, (i, track) => {
			track.node.classList.add(this.config.trackClass, `${this.config.trackClass}-${i}`);
			this.bars[i].node.classList.add(this.config.barClass);
			track.node.appendChild(this.bars[i].node);
			this.container.appendChild(track.node);

			on(this.bars[i].node, "mousedown", this.events.mousedown);
		});

		this.content.parentNode.insertBefore(this.container, this.content);
		this.container.appendChild(this.content);

		this.container.style.position = this.css.position === "static" ?
			"relative" :
			this.css.position;

		this.update();

		on(this.content, "scroll", this.events.scroll);
		on(this.container, "mouseenter", this.events.mouseenter);

		on(window, "resize", this.events.debounce);

		on(document, "DOMContentLoaded", this.events.update);
	}

	scroll() {
		this.updateScrollBar("x");
		this.updateScrollBar("y");
	}

	mouseenter() {
		this.updateScrollBar("x");
		this.updateScrollBar("y");
	}

	mousedown(e) {
		e.preventDefault();

		let currentAxis = e.target === this.bars.x.node ? "x" : "y";
		let currentBar = this.bars[currentAxis];
		let currentTrack = this.tracks[currentAxis];

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
			axis: `page${currentAxis.toUpperCase()}`,
			prop: currentAxis === "x" ? currentTrack.width : currentTrack.height,
			size: currentAxis === "x" ? "scrollWidth" : "scrollHeight",
			offset: currentAxis === "x" ? "scrollLeft" : "scrollTop",
		};

		// Attach the mousemove and mouseup event listeners now
		// instead of permanently having them on
		on(document, "mousemove", this.events.mousemove);
		on(document, "mouseup", this.events.mouseup);
	}

	mousemove(e) {
		e.preventDefault();

		let o = this.origin;
		let axis = this.currentAxis;
		let axisOffset = e[o.axis];
		let track = this.tracks[axis];
		let content = this.content;

		// Calculate how far the user's mouse is from the top/left of the scrollbar (minus the dragOffset).
		let offset = axisOffset - o[axis] - track[axis];

		// Convert the mouse position into a percentage of the scrollbar height/width.
		let ratio = offset / o.prop;

		// Scroll the content by the same percentage.
		let scroll = ratio * this[o.size];

		// Update scrollTop / scrollLeft
		raf(() => {
			content[o.offset] = scroll;
		});
	}

	mouseup() {
		this.origin = {};
		this.currentAxis = null;

		this.container.classList.toggle(this.config.visibleClass, this.config.alwaysShowBars);

		off(document, "mousemove", this.events.mousemove);
		off(document, "mouseup", this.events.mouseup);
	}

	update() {

		// Cache the dimensions
		each(this.tracks, (i, track) => {
			this.extend(track, rect(track.node));
			this.extend(this.bars[i], rect(this.bars[i].node));
		});

		this.rect = rect(this.container);

		this.scrollTop = this.content.scrollTop;
		this.scrollLeft = this.content.scrollLeft;
		this.scrollHeight = this.content.scrollHeight;
		this.scrollWidth = this.content.scrollWidth;

		let scrollX = this.scrollWidth > this.rect.width;
		let scrollY = this.scrollHeight > this.rect.height;

		this.container.classList.toggle("mb-scroll-x", scrollX);
		this.container.classList.toggle("mb-scroll-y", scrollY);

		style(this.content, {
			overflow: "auto",
			marginBottom: scrollX ? -this.scrollbarSize : "",
			paddingBottom: scrollX ? this.scrollbarSize : "",
			marginRight: scrollY ? -this.scrollbarSize : "",
			paddingRight: scrollY ? this.scrollbarSize : ""
		});

		this.scrollX = scrollX;
		this.scrollY = scrollY;

		this.updateScrollBar("x");
		this.updateScrollBar("y");
	}

	updateScrollBar(axis = "y") {
		let css = {};
		let o = axis === "x" ? "left" : "top";
		let d = axis === "x" ? "width" : "height";
		let scroll = axis === "x" ? "scrollLeft" : "scrollTop";
		let size = axis === "x" ? "scrollWidth" : "scrollHeight";
		let scrollbar = this.bars[axis].node;
		let contentSize = this[size];
		let barSize = this.tracks[axis][d];

		// We need a live value not cached
		let scrollOffset = this.content[scroll];

		let barRatio = barSize / contentSize;
		let scrollRatio = scrollOffset / (contentSize - barSize);

		css[d] = Math.max(roundDown(barRatio * barSize), this.config.minBarSize);
		css[o] = roundDown((barSize - css[d]) * scrollRatio);

		raf(() => {
			style(this.bars[axis].node, css);
		});
	}

	destroy() {
		each(this.tracks, (i, track) => {
			off(this.bars[i].node, "mousedown", this.events.mousedown);
		});
		off(this.content, "scroll", this.events.scroll);
		off(this.container, "mouseenter", this.events.mouseenter);

		off(window, "resize", this.events.debounce);

		this.content.removeAttribute("style");

		this.container.parentNode.replaceChild(this.content, this.container);
	}

	extend(target, varArgs) {
		if (target == null) { // TypeError if undefined or null
			throw new TypeError('Cannot convert undefined or null to object');
		}

		const to = Object(target);

		for (let index = 1; index < arguments.length; index++) {
			const nextSource = arguments[index];

			if (nextSource != null) { // Skip over if undefined or null
				for (const nextKey in nextSource) {
					// Avoid bugs when hasOwnProperty is shadowed
					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
		}
		return to;
	}
}