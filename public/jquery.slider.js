(function() {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) {
                    var c = "function" == typeof require && require;
                    if (!f && c) return c(i, !0);
                    if (u) return u(i, !0);
                    var a = new Error("Cannot find module '" + i + "'");
                    throw a.code = "MODULE_NOT_FOUND", a;
                }
                var p = n[i] = {
                    exports: {}
                };
                e[i][0].call(p.exports, function(r) {
                    var n = e[i][1][r];
                    return o(n || r);
                }, p, p.exports, r, e, n, t);
            }
            return n[i].exports;
        }
        for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
        return o;
    }
    return r;
})()({
    1: [ function(require, module, exports) {
        "use strict";
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();
        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }
        (function($) {
            var defaults = {
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
                delay: 5e3,
                useSwipe: true,
                swipeChangeOn: .5,
                swipeRatio: function swipeRatio(ratioX, ratioY) {
                    return this.opt.vertical ? ratioY : ratioX;
                },
                activeClass: "is-active",
                disabledClass: "is-disabled",
                hideArrows: false,
                hideLinks: false,
                effect: "slide",
                effects: {
                    slide: {
                        oldSlideCSS: function oldSlideCSS(oldIdx, newIdx, ratio) {
                            var coef = oldIdx < newIdx && !(this.opt.loop && oldIdx === 0 && newIdx === this.count - 1) || this.opt.loop && oldIdx === this.count - 1 && newIdx === 0 ? -1 : 1;
                            return this.opt.vertical ? {
                                top: coef * ratio * 100 + "%"
                            } : {
                                left: coef * ratio * 100 + "%"
                            };
                        },
                        newSlideCSS: function newSlideCSS(oldIdx, newIdx, ratio) {
                            var coef = oldIdx < newIdx && !(this.opt.loop && oldIdx === 0 && newIdx === this.count - 1) || this.opt.loop && oldIdx === this.count - 1 && newIdx === 0 ? 1 : -1;
                            return this.opt.vertical ? {
                                top: coef * (1 - ratio) * 100 + "%"
                            } : {
                                left: coef * (1 - ratio) * 100 + "%"
                            };
                        },
                        resetSlideCSS: function resetSlideCSS() {
                            return this.opt.vertical ? {
                                top: ""
                            } : {
                                left: ""
                            };
                        }
                    },
                    fade: {
                        oldSlideCSS: function oldSlideCSS(oldIdx, newIdx, ratio) {
                            return {
                                opacity: 1 - ratio,
                                zIndex: 1
                            };
                        },
                        newSlideCSS: function newSlideCSS(oldIdx, newIdx, ratio) {
                            return {
                                opacity: ratio,
                                zIndex: 2
                            };
                        },
                        resetSlideCSS: function resetSlideCSS() {
                            return {
                                opacity: "",
                                zIndex: ""
                            };
                        }
                    }
                },
                beforeChange: null,
                afterChange: null,
                duringChange: null
            };
            var prop = window.Symbol ? window.Symbol("slider") : "__slider";
            var Slider = function() {
                function Slider(el, options) {
                    _classCallCheck(this, Slider);
                    this.el = el;
                    this.opt = $.extend({}, defaults, options);
                    this.__timer = -1;
                    if (!(this.opt.effect in this.opt.effects)) {
                        throw new Error("Effect " + this.opt.effect + " does not exist");
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
                _createClass(Slider, [ {
                    key: "showPrev",
                    value: function showPrev(force) {
                        var idx = this._getPrevIdx();
                        if (idx !== -1) {
                            this.show(idx, force);
                        }
                    }
                }, {
                    key: "showNext",
                    value: function showNext(force) {
                        var idx = this._getNextIdx();
                        if (idx !== -1) {
                            this.show(idx, force);
                        }
                    }
                }, {
                    key: "show",
                    value: function show(idx, force) {
                        var _this = this;
                        if (idx === this.idx) {
                            console.warn("Trying to show current slide");
                            return;
                        }
                        if (idx < 0 && idx > this.count - 1) {
                            console.warn("Trying to show slide out of range: " + idx);
                            return;
                        }
                        if (this.isPlaying) {
                            this.__wasPlaying = true;
                            this.stop();
                        }
                        var d = force ? 0 : this.opt.duration;
                        var oldIdx = this.idx, $old = oldIdx !== -1 ? this.$items.eq(oldIdx) : $(), $new = this.$items.eq(idx);
                        if (this.opt.beforeChange) {
                            this.opt.beforeChange.call(this, oldIdx, idx);
                        }
                        if ($old.length) {
                            $old.css(this._getPrevSlideCSS(oldIdx, idx, 0)).animate(this._getPrevSlideCSS(oldIdx, idx, 1), {
                                duration: d,
                                complete: function complete() {
                                    $old.css(_this._getResetSlideCSS()).hide();
                                }
                            });
                        }
                        $new.css(this._getNextSlideCSS(oldIdx, idx, 0)).show().animate(this._getNextSlideCSS(oldIdx, idx, 1), {
                            duration: d,
                            complete: function complete() {
                                $new.css(_this._getResetSlideCSS());
                                if (_this.opt.afterChange) {
                                    _this.opt.afterChange.call(_this, oldIdx, idx);
                                }
                                if (_this.__wasPlaying) {
                                    _this.start();
                                    delete _this.__wasPlaying;
                                }
                            },
                            progress: function progress(a, p) {
                                if (_this.opt.duringChange) {
                                    _this.opt.duringChange.call(_this, oldIdx, idx, p);
                                }
                            }
                        });
                        this.idx = idx;
                        this.check();
                    }
                }, {
                    key: "start",
                    value: function start() {
                        var _this2 = this;
                        this.stop();
                        this.__timer = setTimeout(function() {
                            _this2.showNext();
                        }, this.opt.delay);
                    }
                }, {
                    key: "stop",
                    value: function stop() {
                        if (this.__timer !== -1) {
                            clearTimeout(this.__timer);
                            this.__timer = -1;
                        }
                    }
                }, {
                    key: "check",
                    value: function check() {
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
                }, {
                    key: "resize",
                    value: function resize() {
                        var offset = this.$container.offset(), width = this.$container.outerWidth(), height = this.$container.outerHeight();
                        this.__offset = {
                            x: offset.left,
                            y: offset.top
                        };
                        this.__size = {
                            x: width,
                            y: height
                        };
                    }
                }, {
                    key: "_getPrevIdx",
                    value: function _getPrevIdx() {
                        var idx = this.idx - 1;
                        if (idx < 0) {
                            if (this.opt.loop) {
                                return this.count - 1;
                            } else {
                                return -1;
                            }
                        }
                        return idx;
                    }
                }, {
                    key: "_getNextIdx",
                    value: function _getNextIdx() {
                        var idx = this.idx + 1;
                        if (idx > this.count - 1) {
                            if (this.opt.loop) {
                                return 0;
                            } else {
                                return -1;
                            }
                        }
                        return idx;
                    }
                }, {
                    key: "_bindResize",
                    value: function _bindResize() {
                        var _this3 = this;
                        this.__resize = function() {
                            _this3.resize();
                        };
                        $(window).on("resize", this.__resize);
                        this.resize();
                    }
                }, {
                    key: "_unbindResize",
                    value: function _unbindResize() {
                        $(window).off("resize", this.__resize);
                        delete this.resize;
                    }
                }, {
                    key: "_bindControl",
                    value: function _bindControl() {
                        var _this4 = this;
                        this.__prevClick = function(e) {
                            e.preventDefault();
                            _this4.showPrev();
                        };
                        this.__nextClick = function(e) {
                            e.preventDefault();
                            _this4.showNext();
                        };
                        this.__linksClick = function(e) {
                            e.preventDefault();
                            var idx = _this4.$links.index(e.target);
                            if (idx !== _this4.idx) {
                                _this4.show(idx);
                            }
                        };
                        this.$prev.on("click", this.__prevClick);
                        this.$next.on("click", this.__nextClick);
                        this.$links.on("click", this.__linksClick);
                    }
                }, {
                    key: "_unbindControl",
                    value: function _unbindControl() {
                        this.$prev.off("click", this.__prevClick).removeClass(this.opt.disabledClass);
                        this.$next.off("click", this.__nextClick).removeClass(this.opt.disabledClass);
                        this.$links.off("click", this.__linksClick).removeClass(this.opt.activeClass);
                        delete this.__prevClick;
                        delete this.__nextClick;
                        delete this.__linksClick;
                    }
                }, {
                    key: "_bindTouch",
                    value: function _bindTouch() {
                        var _this5 = this;
                        this.__touchStart = function(e) {
                            var point = _this5._getTouch(e);
                            if (point) {
                                _this5._startSwipe(point);
                                _this5.$container.on("touchmove", _this5.__touchMove).on("touchend", _this5.__touchEnd).on("touchcancel", _this5.__touchCancel);
                            }
                        };
                        this.__touchMove = function(e) {
                            var point = _this5._getTouch(e);
                            if (point) {
                                _this5._moveSwipe(point);
                            }
                        };
                        this.__touchEnd = function(e) {
                            var point = _this5._getTouch(e);
                            if (point) {
                                _this5._endSwipe(point);
                            }
                            _this5.$container.off("touchmove", _this5.__touchMove).off("touchend", _this5.__touchEnd).off("touchcancel", _this5.__touchCancel);
                        };
                        this.__touchCancel = function() {
                            _this5._endSwipe();
                            _this5.$container.off("touchmove", _this5.__touchMove).off("touchend", _this5.__touchEnd).off("touchcancel", _this5.__touchCancel);
                        };
                        this.$container.on("touchstart", this.__touchStart);
                    }
                }, {
                    key: "_unbindTouch",
                    value: function _unbindTouch() {
                        this.$container.off("touchstart", this.__touchStart);
                        delete this.__touchStart;
                        delete this.__touchMove;
                        delete this.__touchEnd;
                        delete this.__touchCancel;
                    }
                }, {
                    key: "_bindMouse",
                    value: function _bindMouse() {
                        var _this6 = this;
                        this.__mouseDown = function(e) {
                            var point = _this6._getMouse(e);
                            if (point) {
                                _this6._startSwipe(point);
                                _this6.$container.on("mousemove", _this6.__mouseMove).on("mouseup", _this6.__mouseUp);
                            }
                        };
                        this.__mouseMove = function(e) {
                            var point = _this6._getMouse(e);
                            if (point) {
                                _this6._moveSwipe(point);
                            }
                        };
                        this.__mouseUp = function(e) {
                            var point = _this6._getMouse(e);
                            if (point) {
                                _this6._endSwipe(point);
                            }
                            _this6.$container.off("mousemove", _this6.__mouseMove).off("mouseup", _this6.__mouseUp);
                        };
                        this.$container.on("mousedown", this.__mouseDown);
                    }
                }, {
                    key: "_unbindMouse",
                    value: function _unbindMouse() {
                        this.$container.off("mousedown", this.__mouseDown);
                        delete this.__mouseDown;
                        delete this.__mouseMove;
                        delete this.__mouseUp;
                    }
                }, {
                    key: "_getPrevSlideCSS",
                    value: function _getPrevSlideCSS(oldIdx, newIdx, ratio) {
                        return this.opt.effects[this.opt.effect].oldSlideCSS.call(this, oldIdx, newIdx, ratio);
                    }
                }, {
                    key: "_getNextSlideCSS",
                    value: function _getNextSlideCSS(oldIdx, newIdx, ratio) {
                        return this.opt.effects[this.opt.effect].newSlideCSS.call(this, oldIdx, newIdx, ratio);
                    }
                }, {
                    key: "_getResetSlideCSS",
                    value: function _getResetSlideCSS() {
                        return this.opt.effects[this.opt.effect].resetSlideCSS.call(this);
                    }
                }, {
                    key: "_startSwipe",
                    value: function _startSwipe(point) {
                        this.point = point;
                        if (this.isPlaying) {
                            this.__wasPlaying = true;
                            this.stop();
                        }
                    }
                }, {
                    key: "_moveSwipe",
                    value: function _moveSwipe(point) {
                        if (!this.point) return true;
                        var kx = (point.x - this.point.x) / this.__size.x, ky = (point.y - this.point.y) / this.__size.y, k = this.opt.swipeRatio.call(this, kx, ky), newIdx = k < 0 ? this._getNextIdx() : this._getPrevIdx();
                        if (newIdx !== -1) {
                            if (newIdx !== this.__newIdx) {
                                if (this.__newIdx !== undefined) {
                                    this.$items.eq(this.__newIdx).css(this._getResetSlideCSS()).hide();
                                }
                                this.__newIdx = newIdx;
                                this.$items.eq(this.__newIdx).show();
                            }
                            if (this.__newIdx !== -1) {
                                var $old = this.$items.eq(this.idx), $new = this.$items.eq(this.__newIdx), ratio = Math.abs(k);
                                $old.css(this._getPrevSlideCSS(this.idx, this.__newIdx, ratio));
                                $new.css(this._getNextSlideCSS(this.idx, this.__newIdx, ratio));
                                if (this.opt.duringChange) {
                                    this.opt.duringChange.call(this, this.idx, this.__newIdx, ratio);
                                }
                            }
                        }
                    }
                }, {
                    key: "_endSwipe",
                    value: function _endSwipe(point) {
                        var _this7 = this;
                        if (!this.point) return true;
                        if (this.__newIdx !== undefined) {
                            var kx = point ? (point.x - this.point.x) / this.__size.x : 0, ky = point ? (point.y - this.point.y) / this.__size.y : 0, k = this.opt.swipeRatio.call(this, kx, ky);
                            var $old = this.$items.eq(this.idx), $new = this.$items.eq(this.__newIdx);
                            var ratio = Math.abs(k), d = this.opt.duration * ratio, oldIdx = this.idx, newIdx = this.__newIdx;
                            if (ratio >= this.opt.swipeChangeOn) {
                                if (this.opt.beforeChange) {
                                    this.opt.beforeChange.call(this, oldIdx, newIdx);
                                }
                                $old.animate(this._getPrevSlideCSS(oldIdx, newIdx, 1), {
                                    duration: d,
                                    complete: function complete() {
                                        $old.css(_this7._getResetSlideCSS()).hide();
                                    }
                                });
                                $new.animate(this._getNextSlideCSS(oldIdx, newIdx, 1), {
                                    duration: d,
                                    complete: function complete() {
                                        $new.css(_this7._getResetSlideCSS());
                                        if (_this7.opt.afterChange) {
                                            _this7.opt.afterChange.call(_this7, oldIdx, newIdx);
                                        }
                                    },
                                    progress: function progress(a, p) {
                                        if (_this7.opt.duringChange) {
                                            _this7.opt.duringChange.call(_this7, oldIdx, newIdx, ratio + p * (1 - ratio));
                                        }
                                    }
                                });
                                this.idx = this.__newIdx;
                                this.check();
                                if (this.__wasPlaying) {
                                    this.start();
                                    delete this.__wasPlaying;
                                }
                            } else {
                                $old.animate(this._getPrevSlideCSS(oldIdx, newIdx, 0), {
                                    duration: d,
                                    complete: function complete() {
                                        $old.css(_this7._getResetSlideCSS());
                                    }
                                });
                                $new.animate(this._getNextSlideCSS(oldIdx, newIdx, 0), {
                                    duration: d,
                                    complete: function complete() {
                                        $new.css(_this7._getResetSlideCSS()).hide();
                                    },
                                    progress: function progress(a, p) {
                                        if (_this7.opt.duringChange) {
                                            _this7.opt.duringChange.call(_this7, oldIdx, newIdx, ratio - p * ratio);
                                        }
                                    }
                                });
                            }
                            delete this.__newIdx;
                        }
                        delete this.point;
                    }
                }, {
                    key: "_getTouch",
                    value: function _getTouch(e) {
                        var touches = e.touches;
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
                }, {
                    key: "_getMouse",
                    value: function _getMouse(e) {
                        return {
                            x: e.pageX - this.__offset.x,
                            y: e.pageY - this.__offset.y
                        };
                    }
                }, {
                    key: "destroy",
                    value: function destroy() {
                        this.stop();
                        this._unbindResize();
                        this._unbindControl();
                        if (this.opt.useSwipe) {
                            this._unbindTouch();
                            this._unbindMouse();
                        }
                        this.$items.stop(true, true).css({
                            display: ""
                        }).css(this._getResetSlideCSS());
                        this.$prev.css({
                            display: ""
                        }).removeClass(this.opt.disabledClass);
                        this.$next.css({
                            display: ""
                        }).removeClass(this.opt.disabledClass);
                        this.$links.css({
                            display: ""
                        }).removeClass(this.opt.activeClass);
                    }
                }, {
                    key: "count",
                    get: function get() {
                        return this.$items.length;
                    }
                }, {
                    key: "isPlaying",
                    get: function get() {
                        return this.__timer !== -1;
                    }
                } ]);
                return Slider;
            }();
            $.fn.extend({
                slider: function slider(arg) {
                    if (typeof arg === "string") {
                        var value = [];
                        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                            args[_key - 1] = arguments[_key];
                        }
                        for (var i = 0; i < this.length; i++) {
                            var slider = this.get(i)[prop];
                            if (slider) {
                                if (typeof slider[arg] !== "undefined") {
                                    if (/^_/.test(arg)) {
                                        throw new Error("Can't call " + arg + ": it isn't public");
                                    } else if (typeof slider[arg] === "function") {
                                        var res = slider[arg].apply(slider, args);
                                        value.push(res);
                                        if (arg === "destroy") {
                                            delete this.get(i)[prop];
                                        }
                                    } else {
                                        var _res = slider[arg];
                                        value.push(_res);
                                    }
                                } else {
                                    throw new Error("Can't call " + arg + ": no such method or property");
                                }
                            } else {
                                throw new Error("Can't call " + arg + ": Slider is not initialized");
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
                        for (var _i = 0; _i < this.length; _i++) {
                            if (this.get(_i)[prop]) {
                                throw new Error("Slider is already initialized");
                            } else {
                                this.get(_i)[prop] = new Slider(this.get(_i), arg);
                            }
                        }
                        return this;
                    }
                }
            });
        })(jQuery);
    }, {} ]
}, {}, [ 1 ]);
//# sourceMappingURL=maps/jquery.slider.js.map
