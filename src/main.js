'use strict';

/* global jQuery */

(function($) {
    const defaults = {
        container: null,
        items: null,
        prev: null,
        next: null,
        links: null,
        idx: 0,
        vertical: false,
        duration: 300,
        loop: true,
        autoPlay: false,
        delay: 5000,
        useSwipe: true,
        swipeChangeOn: 0.5,
        swipeRatio(ratioX, ratioY) {
            return this.opt.vertical ? ratioY : ratioX;
        },
        activeClass: 'is-active',
        disabledClass: 'is-disabled',
        hideArrows: false,
        hideLinks: false,
        effect: 'slide',
        effects: {
            slide: {
                oldSlideCSS(oldIdx, newIdx, ratio) {
                    let coef = (((oldIdx < newIdx) && !(this.opt.loop && oldIdx === 0 && newIdx === this.count - 1)) || (this.opt.loop && oldIdx === this.count - 1 && newIdx === 0)) ? -1 : 1;
                    return this.opt.vertical ? { top: (coef * ratio * 100) + '%' } : { left: (coef * ratio * 100) + '%' };
                },
                newSlideCSS(oldIdx, newIdx, ratio) {
                    let coef = (((oldIdx < newIdx) && !(this.opt.loop && oldIdx === 0 && newIdx === this.count - 1)) || (this.opt.loop && oldIdx === this.count - 1 && newIdx === 0)) ? 1 : -1;
                    return this.opt.vertical ? { top: (coef * (1 - ratio) * 100) + '%' } : { left: (coef * (1 - ratio) * 100) + '%' };
                },
                resetSlideCSS() {
                    return this.opt.vertical ? { top: '' } : { left: '' };
                }
            },
            fade: {
                oldSlideCSS(oldIdx, newIdx, ratio) {
                    return { opacity: 1 - ratio, zIndex: 1 };
                },
                newSlideCSS(oldIdx, newIdx, ratio) {
                    return { opacity: ratio, zIndex: 2 };
                },
                resetSlideCSS() {
                    return { opacity: '', zIndex: '' };
                }
            }
        },
        beforeChange: null,
        afterChange: null,
        duringChange: null
    };

    const prop = window.Symbol ? window.Symbol('slider') : '__slider';


    /** Class representing an slider handler. */
    class Slider {
        /**
         * Create an instance, setup plugin.
         * @param {HTMLElement} el - element.
         * @param {object} options - settings.
         */
        constructor(el, options) {
            this.el = el;
            this.opt = $.extend({}, defaults, options);

            this.__timer = -1;

            if (!(this.opt.effect in this.opt.effects)) {
                throw new Error(`Effect ${this.opt.effect} does not exist`);
            }

            this.$container = this.opt.container ? $(this.opt.container) : $(this.el);
            this.$items = this.opt.items ? $(this.opt.items) : this.$container.children();

            this.$links = $(this.opt.links);
            this.$prev = $(this.opt.prev);
            this.$next = $(this.opt.next);

            this._bindResize();
            this._bindControl();

            if (this.opt.useSwipe) {
                this._bindTouch();
                this._bindMouse();
            }

            if (this.opt.autoPlay) {
                this.start();
            }

            this.$items.hide();
            this.show(this.opt.idx, true);
        }
        /**
         * Show previous slide.
         * @public
         * @param {boolean} force - skip animation.
         */
        showPrev(force) {
            const idx = this._getPrevIdx();
            if (idx !== -1) {
                this.show(idx, force);
            }
        }
        /**
         * Show next slide.
         * @public
         * @param {boolean} force - skip animation.
         */
        showNext(force) {
            const idx = this._getNextIdx();
            if (idx !== -1) {
                this.show(idx, force);
            }
        }
        /**
         * Show certain slide.
         * @public
         * @param {number} idx - index of slide.
         * @param {boolean} force - skip animation.
         */
        show(idx, force) {
            if (idx === this.idx) {
                console.warn('Trying to show current slide');
                return;
            }
            if (idx < 0 && idx > this.count - 1) {
                console.warn(`Trying to show slide out of range: ${idx}`);
                return;
            }

            if (this.isPlaying) {
                this.__wasPlaying = true;
                this.stop();
            }

            const d = force ? 0 : this.opt.duration;
            const oldIdx = this.idx,
                $old = (oldIdx !== -1) ? this.$items.eq(oldIdx) : $(),
                $new = this.$items.eq(idx);

            if (this.opt.beforeChange) {
                this.opt.beforeChange.call(this, oldIdx, idx);
            }

            if ($old.length) {
                $old.css(this._getPrevSlideCSS(oldIdx, idx, 0))
                    .animate(this._getPrevSlideCSS(oldIdx, idx, 1), { duration: d, complete: () => {
                        $old.css(this._getResetSlideCSS()).hide();
                    } });
            }
            $new.css(this._getNextSlideCSS(oldIdx, idx, 0)).show()
                .animate(this._getNextSlideCSS(oldIdx, idx, 1), { duration: d, complete: () => {
                    $new.css(this._getResetSlideCSS());
                    if (this.opt.afterChange) {
                        this.opt.afterChange.call(this, oldIdx, idx);
                    }
                    if (this.__wasPlaying) {
                        this.start();
                        delete this.__wasPlaying;
                    }
                }, progress: (a, p) => {
                    if (this.opt.duringChange) {
                        this.opt.duringChange.call(this, oldIdx, idx, p);
                    }
                } });

            this.idx = idx;
            this.check();
        }
        /**
         * Start automatic slideshow.
         * @public
         */
        start() {
            this.stop();
            this.__timer = setTimeout(() => {
                this.showNext();
            }, this.opt.delay);
        }
        /**
         * Stop automatic slideshow.
         * @public
         */
        stop() {
            if (this.__timer !== -1) {
                clearTimeout(this.__timer);
                this.__timer = -1;
            }
        }
        /**
         * Set arrows and navigation links actual state (enabled/disabled/hidden).
         * @public
         */
        check() {
            this.$links.removeClass(this.opt.activeClass).eq(this.idx).addClass(this.opt.activeClass);

            if (this.count <= 1) {
                if (this.opt.hideArrows) {
                    this.$prev.hide();
                    this.$next.hide();
                }
                if (this.opt.hideLinks) {
                    this.$links.hide();
                }
            } else {
                if (this.opt.hideArrows) {
                    this.$prev.show();
                    this.$next.show();
                }
                if (this.opt.hideLinks) {
                    this.$links.show();
                }
            }
            if (this._getPrevIdx() === -1) {
                this.$prev.addClass(this.opt.disabledClass);
            } else {
                this.$prev.removeClass(this.opt.disabledClass);
            }
            if (this._getNextIdx() === -1) {
                this.$next.addClass(this.opt.disabledClass);
            } else {
                this.$next.removeClass(this.opt.disabledClass);
            }
        }
        /**
         * Cache slider position settings (offset and size) due to touch and mouse events work correctly.
         * @public
         */
        resize() {
            const offset = this.$container.offset(),
                width = this.$container.outerWidth(),
                height = this.$container.outerHeight();
            this.__offset = { x: offset.left, y: offset.top };
            this.__size = { x: width, y: height };
        }
        /**
         * Get slides count.
         * @public
         * @return {number} Slides count.
         */
        get count() {
            return this.$items.length;
        }
        get isPlaying() {
            return this.__timer !== -1;
        }
        /**
         * Get previous slide index.
         * @protected
         * @return {number} Index (-1 if no slide).
         */
        _getPrevIdx() {
            let idx = this.idx - 1;
            if (idx < 0) {
                if (this.opt.loop) {
                    return this.count - 1;
                } else {
                    return -1;
                }
            }
            return idx;
        }
        /**
         * Get next slide index.
         * @protected
         * @return {number} Index (-1 if no slide).
         */
        _getNextIdx() {
            let idx = this.idx + 1;
            if (idx > this.count - 1) {
                if (this.opt.loop) {
                    return 0;
                } else {
                    return -1;
                }
            }
            return idx;
        }
        /**
         * Bind resize events.
         * @protected
         */
        _bindResize() {
            this.__resize = () => {
                this.resize();
            };
            $(window).on('resize', this.__resize);
            this.resize();
        }
        /**
         * Unbind resize events.
         * @protected
         */
        _unbindResize() {
            $(window).off('resize', this.__resize);

            delete this.resize;
        }
        /**
         * Bind control events (arrows and navigations links).
         * @protected
         */
        _bindControl() {
            this.__prevClick = (e) => {
                e.preventDefault();
                this.showPrev();
            };
            this.__nextClick = (e) => {
                e.preventDefault();
                this.showNext();
            };
            this.__linksClick = (e) => {
                e.preventDefault();
                const idx = this.$links.index(e.target);
                if (idx !== this.idx) {
                    this.show(idx);
                }
            };

            this.$prev.on('click', this.__prevClick);
            this.$next.on('click', this.__nextClick);
            this.$links.on('click', this.__linksClick);
        }
        /**
         * Bind control events (arrows and navigations links).
         * @protected
         */
        _unbindControl() {
            this.$prev.off('click', this.__prevClick).removeClass(this.opt.disabledClass);
            this.$next.off('click', this.__nextClick).removeClass(this.opt.disabledClass);
            this.$links.off('click', this.__linksClick).removeClass(this.opt.activeClass);

            delete this.__prevClick;
            delete this.__nextClick;
            delete this.__linksClick;
        }
        /**
         * Bind touch events.
         * @protected
         */
        _bindTouch() {
            this.__touchStart = (e) => {
                const point = this._getTouch(e);
                if (point) {
                    this._startSwipe(point);
                    this.$container.on('touchmove', this.__touchMove).on('touchend', this.__touchEnd).on('touchcancel', this.__touchCancel);
                }
            };
            this.__touchMove = (e) => {
                const point = this._getTouch(e);
                if (point) {
                    this._moveSwipe(point);
                }
            };
            this.__touchEnd = (e) => {
                const point = this._getTouch(e);
                if (point) {
                    this._endSwipe(point);
                }
                this.$container.off('touchmove', this.__touchMove).off('touchend', this.__touchEnd).off('touchcancel', this.__touchCancel);
            };
            this.__touchCancel = () => {
                this._endSwipe();
                this.$container.off('touchmove', this.__touchMove).off('touchend', this.__touchEnd).off('touchcancel', this.__touchCancel);
            };

            this.$container.on('touchstart', this.__touchStart);
        }
        /**
         * Unind touch events.
         * @protected
         */
        _unbindTouch() {
            this.$container.off('touchstart', this.__touchStart);

            delete this.__touchStart;
            delete this.__touchMove;
            delete this.__touchEnd;
            delete this.__touchCancel;
        }
        /**
         * Bind mouse events.
         * @protected
         */
        _bindMouse() {
            this.__mouseDown = (e) => {
                const point = this._getMouse(e);
                if (point) {
                    this._startSwipe(point);
                    this.$container.on('mousemove', this.__mouseMove).on('mouseup', this.__mouseUp);
                }
            };
            this.__mouseMove = (e) => {
                const point = this._getMouse(e);
                if (point) {
                    this._moveSwipe(point);
                }
            };
            this.__mouseUp = (e) => {
                const point = this._getMouse(e);
                if (point) {
                    this._endSwipe(point);
                }
                this.$container.off('mousemove', this.__mouseMove).off('mouseup', this.__mouseUp);
            };

            this.$container.on('mousedown', this.__mouseDown);
        }
        /**
         * Unbind mouse events.
         * @protected
         */
        _unbindMouse() {
            this.$container.off('mousedown', this.__mouseDown);

            delete this.__mouseDown;
            delete this.__mouseMove;
            delete this.__mouseUp;
        }
        /**
         * Get previous slide CSS properties depending on current state.
         * @protected
         * @param {number} oldIdx - index of old active slide.
         * @param {number} newIdx - index of new active slide.
         * @param {number} ratio - state of changing process (from 0 to 1).
         * @return {object} CSS properties.
         */
        _getPrevSlideCSS(oldIdx, newIdx, ratio) {
            return this.opt.effects[ this.opt.effect ].oldSlideCSS.call(this, oldIdx, newIdx, ratio);
        }
        /**
         * Get next slide CSS properties depending on current state.
         * @protected
         * @param {number} oldIdx - index of old active slide.
         * @param {number} newIdx - index of new active slide.
         * @param {number} ratio - state of changing process (from 0 to 1).
         * @return {object} CSS properties.
         */
        _getNextSlideCSS(oldIdx, newIdx, ratio) {
            return this.opt.effects[ this.opt.effect ].newSlideCSS.call(this, oldIdx, newIdx, ratio);
        }
        /**
         * Get CSS properties to reset slide state.
         * @protected
         * @return {object} CSS properties.
         */
        _getResetSlideCSS() {
            return this.opt.effects[ this.opt.effect ].resetSlideCSS.call(this);
        }
        /**
         * Start swipe handling.
         * @protected
         * @param {object} point - coordinates of point (x, y).
         */
        _startSwipe(point) {
            this.point = point;

            if (this.isPlaying) {
                this.__wasPlaying = true;
                this.stop();
            }
        }
        /**
         * Move swipe handling.
         * @protected
         * @param {object} point - coordinates of point (x, y).
         */
        _moveSwipe(point) {
            if (!this.point) return true;

            const kx = (point.x - this.point.x) / this.__size.x,
                ky = (point.y - this.point.y) / this.__size.y,
                k = this.opt.swipeRatio.call(this, kx, ky),
                newIdx = (k < 0) ? this._getNextIdx() : this._getPrevIdx();

            if (newIdx !== -1) {
                if (newIdx !== this.__newIdx) {
                    if (this.__newIdx !== undefined) {
                        this.$items.eq(this.__newIdx).css(this._getResetSlideCSS()).hide();
                    }
                    this.__newIdx = newIdx;
                    this.$items.eq(this.__newIdx).show();
                }

                if (this.__newIdx !== -1) {
                    const $old = this.$items.eq(this.idx),
                        $new = this.$items.eq(this.__newIdx),
                        ratio = Math.abs(k);

                    $old.css(this._getPrevSlideCSS(this.idx, this.__newIdx, ratio));
                    $new.css(this._getNextSlideCSS(this.idx, this.__newIdx, ratio));

                    if (this.opt.duringChange) {
                        this.opt.duringChange.call(this, this.idx, this.__newIdx, ratio);
                    }
                }
            }
        }
        /**
         * End swipe handling.
         * @protected
         * @param {object} point - coordinates of point (x, y).
         */
        _endSwipe(point) {
            if (!this.point) return true;

            if (this.__newIdx !== undefined) {
                const kx = point ? ((point.x - this.point.x) / this.__size.x) : 0,
                    ky = point ? ((point.y - this.point.y) / this.__size.y) : 0,
                    k = this.opt.swipeRatio.call(this, kx, ky);

                const $old = this.$items.eq(this.idx),
                    $new = this.$items.eq(this.__newIdx);

                const ratio = Math.abs(k),
                    d = this.opt.duration * ratio,
                    oldIdx = this.idx,
                    newIdx = this.__newIdx;

                if (ratio >= this.opt.swipeChangeOn) {
                    if (this.opt.beforeChange) {
                        this.opt.beforeChange.call(this, oldIdx, newIdx);
                    }

                    $old.animate(this._getPrevSlideCSS(oldIdx, newIdx, 1), { duration: d, complete: () => {
                        $old.css(this._getResetSlideCSS()).hide();
                    } });
                    $new.animate(this._getNextSlideCSS(oldIdx, newIdx, 1), { duration: d, complete: () => {
                        $new.css(this._getResetSlideCSS());
                        if (this.opt.afterChange) {
                            this.opt.afterChange.call(this, oldIdx, newIdx);
                        }
                    }, progress: (a, p) => {
                        if (this.opt.duringChange) {
                            this.opt.duringChange.call(this, oldIdx, newIdx, ratio + p * (1 - ratio));
                        }
                    } });

                    this.idx = this.__newIdx;
                    this.check();

                    if (this.__wasPlaying) {
                        this.start();
                        delete this.__wasPlaying;
                    }
                } else {
                    $old.animate(this._getPrevSlideCSS(oldIdx, newIdx, 0), { duration: d, complete: () => {
                        $old.css(this._getResetSlideCSS());
                    } });
                    $new.animate(this._getNextSlideCSS(oldIdx, newIdx, 0), { duration: d, complete: () => {
                        $new.css(this._getResetSlideCSS()).hide();
                    }, progress: (a, p) => {
                        if (this.opt.duringChange) {
                            this.opt.duringChange.call(this, oldIdx, newIdx, ratio - p * ratio);
                        }
                    } });
                }

                delete this.__newIdx;
            }

            delete this.point;
        }
        /**
         * Get touch event coordinates.
         * @protected
         * @param {event} event - touch event.
         * @return {object} coordinates (x, y).
         */
        _getTouch(e) {
            let touches = e.touches;
            if (!touches || !touches.length) {
                touches = e.targetTouches;
            }
            if (!touches || !touches.length) {
                touches = e.changedTouches;
            }
            if (!touches || touches.length !== 1) {
                return null;
            }
            return {
                x: touches[0].pageX - this.__offset.x,
                y: touches[0].pageY - this.__offset.y
            };
        }
        /**
         * Get mouse event coordinates.
         * @protected
         * @param {event} event - mouse event.
         * @return {object} coordinates (x, y).
         */
        _getMouse(e) {
            return {
                x: e.pageX - this.__offset.x,
                y: e.pageY - this.__offset.y
            };
        }
        /**
         * Destroy all created elements and unbind connected events.
         * @public
         */
        destroy() {
            this.stop();

            this._unbindResize();
            this._unbindControl();

            if (this.opt.useSwipe) {
                this._unbindTouch();
                this._unbindMouse();
            }

            this.$items.stop(true, true).css({ display: '' }).css(this._getResetSlideCSS());
            this.$prev.css({ display: '' }).removeClass(this.opt.disabledClass);
            this.$next.css({ display: '' }).removeClass(this.opt.disabledClass);
            this.$links.css({ display: '' }).removeClass(this.opt.activeClass);
        }
    }

    $.fn.extend({
        slider: function(arg, ...args) {
            if (typeof arg === 'string') {
                let value = [];

                for (let i = 0; i < this.length; i ++) {
                    const slider = this.get(i)[prop];
                    if (slider) {
                        if (typeof slider[arg] !== 'undefined') {
                            if (/^_/.test(arg)) {
                                throw new Error(`Can't call ${arg}: it isn't public`);
                            } else if (typeof slider[arg] === 'function') {
                                const res = slider[arg].apply(slider, args);
                                value.push(res);

                                if (arg === 'destroy') {
                                    delete this.get(i)[prop];
                                }
                            } else {
                                const res = slider[arg];
                                value.push(res);
                            }
                        } else {
                            throw new Error(`Can't call ${arg}: no such method or property`);
                        }
                    } else {
                        throw new Error(`Can't call ${arg}: Slider is not initialized`);
                    }
                }

                if (this.length === 0) {
                    return undefined;
                } else if (this.length === 1) {
                    return value[0];
                } else {
                    return value;
                }
            } else {
                for (let i = 0; i < this.length; i ++) {
                    if (this.get(i)[prop]) {
                        throw new Error('Slider is already initialized');
                    } else {
                        this.get(i)[prop] = new Slider(this.get(i), arg);
                    }
                }

                return this;
            }
        }
    });
})(jQuery);
