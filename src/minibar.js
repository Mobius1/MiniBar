/*!
 * MiniBar 0.4.0
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
        trackPos = {
            x: "left",
            y: "top"
        },
        trackSize = {
            x: "width",
            y: "height"
        },
        scrollPos = {
            x: "scrollLeft",
            y: "scrollTop"
        },
        scrollSize = {
            x: "scrollWidth",
            y: "scrollHeight"
        },
        offsetSize = {
            x: "offsetWidth",
            y: "offsetHeight"
        },
        mAxis = {
            x: "pageX",
            y: "pageY"
        };

    /**
     * Default configuration properties
     * @type {Object}
     */
    var mbConfig = {
        barType: "default",
        minBarSize: 10,
        alwaysShowBars: false,
        horizontalMouseScroll: false,

        scrollX: true,
        scrollY: true,

        navButtons: false,
        scrollAmount: 10,
        wheelScrollAmount: 100,

        mutationObserver: {
            attributes: false,
            childList: true,
            subtree: true
        },

        onInit: function() {},
        onUpdate: function() {},
        onStart: function() {},
        onScroll: function() {},
        onEnd: function() {},

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
            item: "mb-item",
            itemVisible: "mb-item-visible",
            itemPartial: "mb-item-partial",
            itemHidden: "mb-item-hidden"
        }
    };

    /**
     * Object.assign polyfill
     * @param  {Object} target
     * @param  {Object} args
     * @return {Object}
     */
    var extend = function(r, t) {
        for (var e = Object(r), n = 1; n < arguments.length; n++) {
            var a = arguments[n];
            if (null != a)
                for (var o in a) Object.prototype.hasOwnProperty.call(a, o) && (e[o] = a[o])
        }
        return e
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
     * Check is item array or array-like
     * @param  {Mixed} arr
     * @return {Boolean}
     */
    var isCollection = function(arr) {
        return Array.isArray(arr) || arr instanceof HTMLCollection || arr instanceof NodeList;
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
     * @param  {Object} t
     * @param  {(String|Object)} e
     * @param  {String|Object}
     */
    var style = function(t, e) {
        var i = t && t.style,
            n = "[object Object]" === Object.prototype.toString.call(e);
        if (i) {
            if (!e) return win.getComputedStyle(t);
            n && each(e, function(t, e) {
                t in i || (t = "-webkit-" + t), i[t] = e + ("string" == typeof e ? "" : "opacity" === t ? "" : "px")
            })
        }
    };

    /**
     * Get an element's DOMRect relative to the document instead of the viewport.
     * @param  {Object} t   HTMLElement
     * @param  {Boolean} e  Include margins
     * @return {Object}     Formatted DOMRect copy
     */
    var rect = function(e) {
        var t = win,
            o = e.getBoundingClientRect(),
            b = doc.documentElement || body.parentNode || body,
            d = (void 0 !== t.pageXOffset) ? t.pageXOffset : b.scrollLeft,
            n = (void 0 !== t.pageYOffset) ? t.pageYOffset : b.scrollTop;
        return {
            x: o.left + d,
            y: o.top + n,
            x2: o.left + o.width + d,
            y2: o.top + o.height + n,
            height: Math.round(o.height),
            width: Math.round(o.width)
        }
    };

    /**
     * Returns a function, that, as long as it continues to be invoked, will not be triggered.
     * @param  {Function} fn
     * @param  {Number} wait
     * @param  {Boolean} now
     * @return {Function}
     */
    var debounce = function(n, t, u) {
        var e;
        return function() {
            var i = this,
                o = arguments,
                a = u && !e;
            clearTimeout(e), e = setTimeout(function() {
                e = null, u || n.apply(i, o)
            }, t), a && n.apply(i, o)
        }
    }

    var raf = win.requestAnimationFrame || function() {
        var e = 0;
        return win.webkitRequestAnimationFrame || win.mozRequestAnimationFrame || function(n) {
            var t, i = (new Date).getTime();
            return t = Math.max(0, 16 - (i - e)), e = i + t, setTimeout(function() {
                n(i + t)
            }, t)
        }
    }();
    var caf = win.cancelAnimationFrame || function(id) {
        clearTimeout(id);
    }();

    /**
     * Get native scrollbar width
     * @return {Number} Scrollbar width
     */
    var scrollWidth = function() {
        var t = 0,
            e = doc.createElement("div");
        return e.style.cssText = "width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;", doc.body.appendChild(e), t = e.offsetWidth - e.clientWidth, doc.body.removeChild(e), t
    };

    /**
     * classList shim
     * @type {Object}
     */
    var classList = {
        contains: function(s, a) {
            if (s) return s.classList ? s.classList.contains(a) : !!s.className && !!s.className.match(new RegExp("(\\s|^)" + a + "(\\s|$)"))
        },
        add: function(s, a) {
            classList.contains(s, a) || (s.classList ? s.classList.add(a) : s.className = s.className.trim() + " " + a)
        },
        remove: function(s, a) {
            classList.contains(s, a) && (s.classList ? s.classList.remove(a) : s.className = s.className.replace(new RegExp("(^|\\s)" + a.split(" ").join("|") + "(\\s|$)", "gi"), " "))
        },
        toggle: function(s, a, c) {
            var i = this.contains(s, a) ? !0 !== c && "remove" : !1 !== c && "add";
            i && this[i](s, a)
        }
    };

    /**
     * Main Library
     * @param {(String|Object)} content CSS3 selector string or node reference
     * @param {Object} options          User defined options
     */
    var MiniBar = function(container, options) {
        this.container = typeof container === "string" ? doc.querySelector(container) : container;

        this.config = mbConfig;

        // User options
        if (options) {
            this.config = extend({}, mbConfig, options);
        } else if (win.MiniBarOptions) {
            this.config = extend({}, mbConfig, win.MiniBarOptions);
        }

        this.css = win.getComputedStyle(this.container);

        this.size = scrollWidth();
        this.textarea = this.container.nodeName.toLowerCase() === "textarea";

        this.bars = { x: {}, y: {} };
        this.tracks = { x: {},  y: {} };

        this.lastX = 0;
        this.lastY = 0;

        this.scrollDirection = {x: 0, y: 0};

        // Events
        this.events = {};

        // Bind events
        each(["update", "scroll", "mouseenter", "mousedown", "mousemove", "mouseup", "wheel"], function(i, evt) {
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
        var mb = this,
            o = mb.config,
            ev = mb.events;

        if (!mb.initialised) {

            // We need a seperate wrapper for the textarea that we can pad
            // otherwise the text will be up against the container edges
            if (mb.textarea) {
                mb.content = mb.container;
                mb.container = doc.createElement("div");
                classList.add(mb.container, o.classes.textarea);

                mb.wrapper = doc.createElement("div");
                classList.add(mb.wrapper, o.classes.wrapper);
                mb.container.appendChild(mb.wrapper);

                mb.content.parentNode.insertBefore(mb.container, mb.content);

                // Update the bar on input
                mb.content.addEventListener("input", function(e) {
                    mb.update();
                });

            } else {
                mb.content = doc.createElement("div");

                // Move all nodes to the the new content node
                while (mb.container.firstChild) {
                    mb.content.appendChild(mb.container.firstChild);
                }
            }

            classList.add(mb.container, o.classes.container);
            classList.add(mb.content, o.classes.content);

            if (o.alwaysShowBars) {
                classList.add(mb.container, o.classes.visible);
            }

            // Set the tracks and bars and append them to the container
            each(mb.tracks, function(axis, track) {
                mb.bars[axis].node = doc.createElement("div");
                track.node = doc.createElement("div");

                classList.add(track.node, o.classes.track);
                classList.add(track.node, o.classes.track + "-" + axis);

                classList.add(mb.bars[axis].node, o.classes.bar);
                track.node.appendChild(mb.bars[axis].node);

                // Add nav buttons
                if (o.navButtons) {
                    var dec = doc.createElement("button"),
                        inc = doc.createElement("button"),
                        wrap = doc.createElement("div"),
                        amount = o.scrollAmount;

                    dec.className = o.classes.btn + " " + o.classes.decrease;
                    inc.className = o.classes.btn + " " + o.classes.increase;
                    wrap.className = o.classes.btns + " " + o.classes.btns + "-" + axis;

                    wrap.appendChild(dec);
                    wrap.appendChild(track.node);
                    wrap.appendChild(inc);

                    mb.container.appendChild(wrap);

                    classList.add(mb.container, o.classes.nav);

                    // Mousedown on buttons
                    on(wrap, "mousedown", function(e) {
                        var el = e.target;

                        caf(mb.frame);

                        if (el === inc || el === dec) {

                            var scroll = mb.content[scrollPos[axis]];

                            var move = function(c) {
                                switch (mb.content[scrollPos[axis]] = scroll, el) {
                                    case dec:
                                        scroll -= amount;
                                        break;
                                    case inc:
                                        scroll += amount
                                }
                                mb.frame = raf(move)
                            };

                            move();
                        }

                    });

                    // Mouseup on buttons
                    on(wrap, "mouseup", function(e) {
                        var c = e.target,
                            m = 5 * amount;
                        caf(mb.frame), c !== inc && c !== dec || mb.scrollBy(c === dec ? -m : m, axis)
                    });

                } else {
                    mb.container.appendChild(track.node);
                }

                if (o.barType === "progress") {
                    classList.add(track.node, o.classes.progress);

                    on(track.node, "mousedown", ev.mousedown);
                } else {
                    on(mb.bars[axis].node, "mousedown", ev.mousedown);
                }

                on(track.node, "mouseenter", function(e) {
                    classList.add(mb.container, o.classes.hover + "-" + axis);
                });

                on(track.node, "mouseleave", function(e) {
                    if (!mb.down) {
                        classList.remove(mb.container, o.classes.hover + "-" + axis);
                    }
                });
            });

            // Append the content
            if (mb.textarea) {
                mb.wrapper.appendChild(mb.content);
            } else {
                mb.container.appendChild(mb.content);
            }

            if (mb.css.position === "static") {
                mb.manualPosition = true;
                mb.container.style.position = "relative";
            }

            if ( o.observableItems ) {
                const items = this.getItems();

                if ( items.length && "IntersectionObserver" in window ) {
                    mb.items = items;

                    var threshold = [];

                    // Increase / decrease to set granularity
                    var increment = 0.01

                    // Don't want to have to type all of them...
                    for (var i=0; i<1; i+=increment) {
                        threshold.push(i);
                    }

                    var callback = function(entries, observer) {
                        entries.forEach(entry => {
                            var node = entry.target;
                            var ratio = entry.intersectionRatio;
                            var intersecting = entry.isIntersecting;
                            var visible = intersecting && ratio >= 1;
                            var hidden = !intersecting && ratio <= 0;
                            var partial = intersecting && ratio > 0 && ratio < 1;

                            node.classList.toggle(o.classes.itemVisible, visible);
                            node.classList.toggle(o.classes.itemPartial, partial);
                            node.classList.toggle(o.classes.itemHidden, hidden);
                        });
                    };

                    this.intersectionObserver = new IntersectionObserver(callback, {
                        root: null,
                        rootMargin: '0px',
                        threshold: threshold
                    });

                    each(items, function(i, item) {
                        mb.intersectionObserver.observe(item);
                    });

                }
            }

            mb.update();

            on(mb.content, "scroll", ev.scroll);
            on(mb.container, "mouseenter", ev.mouseenter);

            if (o.horizontalMouseScroll) {
                on(mb.content, "wheel", ev.wheel);
            }

            on(win, "resize", ev.debounce);

            on(doc, 'DOMContentLoaded', ev.update);
            on(win, 'load', ev.update);

            // check for MutationObserver support
            if ( "MutationObserver" in window ) {
                var callback = function(mutationsList, observer) {
                    for(var mutation of mutationsList) {
                        // update the instance if content changes
                        if (mutation.type == 'childList') {
                            // if the IntersectionObserver API is used, we need to observe / unobserve items
                            if ( mb.intersectionObserver ) {
                                for(var node of mutation.addedNodes) {
                                    mb.intersectionObserver.observe(node);
                                }

                                for(var node of mutation.removedNodes) {
                                    mb.intersectionObserver.unobserve(node);
                                }
                            }
                        }
                    }

                    if ( mb.intersectionObserver ) {
                        mb.items = mb.getItems();
                    }

                    // setTimeout(mb.update.bind(mb), 500);
                    mb.update();
                };

                this.mutationObserver = new MutationObserver(callback);

                this.mutationObserver.observe(this.content, this.config.mutationObserver);
            }

            mb.initialised = true;

            setTimeout(function() {
                mb.config.onInit.call(mb, mb.getData());
            }, 10);
        }
    };

    /**
     * Scroll callback
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.scroll = function(e) {
        const data = this.getData(true);

        if ( data.scrollLeft > this.lastX ) {
            this.scrollDirection.x = 1;
        } else if ( data.scrollLeft < this.lastX ) {
            this.scrollDirection.x = -1;
        }

        if ( data.scrollTop > this.lastY ) {
            this.scrollDirection.y = 1;
        } else if ( data.scrollTop < this.lastY ) {
            this.scrollDirection.y = -1;
        }

        this.updateBars();

        this.config.onScroll.call(this, data);

				this.lastX = data.scrollLeft;
				this.lastY = data.scrollTop;
    };

    proto.getItems = function() {
        const o = this.config;
        let items;
        if ( typeof o.observableItems === "string" ) {
            items = this.content.querySelectorAll(o.observableItems);
        }

        if ( o.observableItems instanceof HTMLCollection || o.observableItems instanceof NodeList ) {
            items = [].slice.call(o.observableItems);
        }

        return items;
    };

    /**
     * Get instance data
     * @return {Object}
     */
    proto.getData = function(scrolling) {
        var c = this.content;
        const scrollTop = c.scrollTop;
        const scrollLeft = c.scrollLeft;
        const scrollHeight = c.scrollHeight;
        const scrollWidth = c.scrollWidth;
        const offsetWidth = c.offsetWidth;
        const offsetHeight = c.offsetHeight;
        const barSize = this.size;
        const containerRect = this.rect;

        return {
            scrollTop,
            scrollLeft,
            scrollHeight,
            scrollWidth,
            offsetWidth,
            offsetHeight,
            containerRect,
            barSize
        }
    };

    /**
     * Scroll content by amount
     * @param  {Number|String}     position   Position to scroll to
     * @param  {String}     axis     Scroll axis
     * @return {Void}
     */
    proto.scrollTo = function(position, axis) {

        axis = axis || "y";

        var data = this.getData(), amount;

        if ( typeof position === "string" ) {
            if ( position === "start" ) {
                amount = -data[scrollPos[axis]];
            } else if ( position === "end" ) {
                amount = data[scrollSize[axis]] - data[offsetSize[axis]] - data[scrollPos[axis]];
            }
        } else {
            amount = position - data[scrollPos[axis]];
        }

        this.scrollBy(amount, axis);
    };

    /**
     * Scroll content by amount
     * @param  {Number}     amount   Number of pixels to scroll
     * @param  {String}     axis     Scroll axis
     * @param  {Number}     duration Duration of scroll animation in ms
     * @param  {Function}   easing   Easing function
     * @return {Void}
     */
    proto.scrollBy = function(amount, axis, duration, easing) {

        axis = axis || "y";

        // No animation
        if (duration === 0) {
            this.content[scrollPos[axis]] += amount;
            return;
        }

        // Duration of scroll
        if (duration === undefined) {
            duration = 250;
        }

        // Easing function
        easing = easing || function(t, b, c, d) {
            t /= d;  return -c * t * (t - 2) + b;
        };

        var mb = this,  st = Date.now(),  pos = mb.content[scrollPos[axis]];

        // Scroll function
        var scroll = function() {
            var now = Date.now(),
                ct = now - st;

            // Cancel after allotted interval
            if (ct > duration) {
                caf(mb.frame);
				mb.content[scrollPos[axis]] = Math.ceil(pos + amount);
                return;
            }

            // Update scroll position
            mb.content[scrollPos[axis]] = Math.ceil(easing(ct, pos, amount, duration));

            // requestAnimationFrame
            mb.frame = raf(scroll);
        };

        mb.frame = scroll();
    };

    /**
     * Mousewheel callback
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.wheel = function(e) {
        e.preventDefault();

        var mb = this,
            o = mb.config,
            factor = e.deltaMode !== 0 ? 100 : 1,
            way = (e.deltaY/Math.abs(e.deltaY),
            amount = o.wheelScrollAmount === undefined ? e.deltaY * factor : o.wheelScrollAmount * way;

        this.scrollBy(amount, "x");
    };

    /**
     * Mouseenter callack
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.mouseenter = function(e) {
        this.updateBars();
    };

    /**
     * Mousedown callack
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.mousedown = function(e) {
        e.preventDefault();

        var mb = this,
            o = mb.config,
            type = o.barType === "progress" ? "tracks" : "bars",
            axis = e.target === mb[type].x.node ? "x" : "y";

        mb.down = true;

        mb.currentAxis = axis;

        // Lets do all the nasty reflow-triggering stuff now
        // otherwise it'll be a shit-show during mousemove
        mb.update();

        // Keep the tracks visible during drag
        classList.add(mb.container, o.classes.visible);
        classList.add(mb.container, o.classes.scrolling + "-" + axis);

        // Save data for use during mousemove
        o.barType === "progress" ? (mb.origin = {
            x: e.pageX - mb.tracks[axis].x,
            y: e.pageY - mb.tracks[axis].y
        }, mb.mousemove(e)) : mb.origin = {
            x: e.pageX - mb.bars[axis].x,
            y: e.pageY - mb.bars[axis].y
        };

        // Attach the mousemove and mouseup listeners now
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

        var mb = this,
            o = this.origin,
            axis = this.currentAxis,
            track = mb.tracks[axis],
            ts = track[trackSize[axis]],
            offset, ratio, scroll,
            progress = mb.config.barType === "progress";

        offset = progress ? e[mAxis[axis]] - track[axis] : e[mAxis[axis]] - o[axis] - track[axis];
        ratio = offset / ts;
        scroll = progress ? ratio * (mb.content[scrollSize[axis]] - mb.rect[trackSize[axis]]) : ratio * mb[scrollSize[axis]];

        // Update scroll position
        raf(function() {
            mb.content[scrollPos[axis]] = scroll;
        });
    };

    /**
     * Mouseup callack
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.mouseup = function(e) {
        var mb = this,
            o = mb.config,
            ev = mb.events;

        classList.toggle(mb.container, o.classes.visible, o.alwaysShowBars);
        classList.remove(mb.container, o.classes.scrolling + "-" + mb.currentAxis);

        if (!classList.contains(e.target, o.classes.bar)) {
            classList.remove(mb.container, o.classes.hover + "-x");
            classList.remove(mb.container, o.classes.hover + "-y");
        }

        mb.currentAxis = null;
        mb.down = false;

        off(doc, "mousemove", ev.mousemove);
        off(doc, "mouseup", ev.mouseup);
    };

    /**
     * Update cached values and recalculate sizes / positions
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.update = function() {
        var mb = this,
            o = mb.config,
            ct = mb.content,
            s = mb.size;

        // Cache the dimensions
        mb.rect = rect(mb.container);

        mb.scrollTop = ct.scrollTop;
        mb.scrollLeft = ct.scrollLeft;
        mb.scrollHeight = ct.scrollHeight;
        mb.scrollWidth = ct.scrollWidth;
        mb.offsetWidth = ct.offsetWidth;
        mb.offsetHeight = ct.offsetHeight;
        mb.clientWidth = ct.clientWidth;
        mb.clientHeight = ct.clientHeight;

        // Do we need horizontal scrolling?
        var sx = mb.scrollWidth > mb.offsetWidth && !mb.textarea;

        // Do we need vertical scrolling?
        var sy = mb.scrollHeight > mb.offsetHeight;

        classList.toggle(mb.container, "mb-scroll-x", sx && o.scrollX && !o.hideBars);
        classList.toggle(mb.container, "mb-scroll-y", sy && o.scrollY && !o.hideBars);

        // Style the content
        style(ct, {
            overflowX: sx ? "auto" : "",
            overflowY: sy ? "auto" : "",
            marginBottom: sx ? -s : "",
            paddingBottom: sx ? s : "",
            marginRight: sy ? -s : "",
            paddingRight: sy && !o.hideBars ? s : ""
        });

        mb.scrollX = sx;
        mb.scrollY = sy;

        each(mb.tracks, function(i, track) {
            extend(track, rect(track.node));
            extend(mb.bars[i], rect(mb.bars[i].node));
        });

        // Update scrollbars
        mb.updateBars();

        mb.wrapperPadding = 0;

        if (mb.textarea) {
            var css = style(mb.wrapper);

            // Textarea wrapper has added padding
            mb.wrapperPadding = parseInt(css.paddingTop, 10) + parseInt(css.paddingBottom, 10);

            // Only scroll to bottom if the cursor is at the end of the content and we're not dragging
            if (!mb.down && mb.content.selectionStart >= mb.content.value.length) {
                mb.content.scrollTop = mb.scrollHeight + 1000;
            }
        }

		this.config.onUpdate.call(this, this.getData());
    };

    /**
     * Update a scrollbar's size and position
     * @param  {String} axis
     * @return {Void}
     */
    proto.updateBar = function(axis) {

        var mb = this,
            css = {},
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

        if (o.barType === "progress") {
            // Only need to set the size of a progress bar
            css[ts[axis]] = Math.floor(tsize * sr);
        } else {
            // Set the scrollbar size
            css[ts[axis]] = Math.max(Math.floor(br * cs), o.minBarSize);

            // Set the scrollbar position
            css[trackPos[axis]] = Math.floor((tsize - css[ts[axis]]) * sr);
        }

        raf(function() {
            style(mb.bars[axis].node, css);
        });
    };

    /**
     * Update all scrollbars
     * @return {Void}
     */
    proto.updateBars = function() {
        each(this.bars, function(i, v) {
            this.updateBar(i);
        }, this);
    };

    /**
     * Destroy instance
     * @return {Void}
     */
    proto.destroy = function() {
        var mb = this,
            o = mb.config,
            ct = mb.container;

        if (mb.initialised) {

            // Remove the event listeners
            off(ct, "mouseenter", mb.events.mouseenter);
            off(win, "resize", mb.events.debounce);

            // Remove the main classes from the container
            classList.remove(ct, o.classes.visible);
            classList.remove(ct, o.classes.container);
            classList.remove(ct, o.classes.nav);

            // Remove the tracks and / or buttons
            each(mb.tracks, function(i, track) {
                ct.removeChild(o.navButtons ? track.node.parentNode : track.node);
                classList.remove(ct, "mb-scroll-" + i);
            });

            // Move the nodes back to their original container
            while (mb.content.firstChild) {
                ct.appendChild(mb.content.firstChild);
            }

            // Remove the content node
            ct.removeChild(mb.content);

            // Remove manual positioning
            if (mb.manualPosition) {
                ct.style.position = "";
            }

            // Clear node references
            mb.bars = {
                x: {},
                y: {}
            };
            mb.tracks = {
                x: {},
                y: {}
            };
            mb.content = null;

            if ( mb.mutationObserver ) {
                mb.mutationObserver.disconnect();
                mb.mutationObserver = false;
            }

            if ( o.observableItems ) {
                if ( mb.intersectionObserver ) {
                    mb.intersectionObserver.disconnect();
                    mb.intersectionObserver = false;
                }

                each(mb.items, function(i, item) {
                    const node = item.node || item;
                    node.classList.remove(o.classes.item);
                    node.classList.remove(o.classes.itemVisible);
                    node.classList.remove(o.classes.itemPartial);
                    node.classList.remove(o.classes.itemHidden);
                });
            }

            mb.initialised = false;
        }
    };

    root.MiniBar = MiniBar;

}(this));
