# jQuery plugin for flexible sliders

## Options
* `container` `{String|jQuery}` - selector or jQuery-object of slides container (element to handle swipe actions) (default: `el`)
* `items` `{String|jQuery}` - selector or jQuery-object of list of slides (default: children of `container`)
* `prev` `{String|jQuery}` - selector or jQuery-object of previous arrow
* `next` `{String|jQuery}` - selector or jQuery-object of next arrow
* `links` `{String|jQuery}` - selector or jQuery-object of list of navigation links
* `idx` `{Number}` - index of slide to show first (default: `0`)
* `vertical` `{Boolean}` - use vertical mode for swipe and slide effect (default: `false`)
* `duration` `{Number}` - animation duration in ms (default: `300`)
* `loop` `{Boolean}` - show first slide after the last and last one after the first (default: `true`)
* `autoPlay` `{Boolean}` - turn on slideshow (default: `false`)
* `delay` `{Number}` - delay between slides in slideshow in ms (default: `5000`)
* `useSwipe` `{Boolean}` - use swipe handlers (touch and mouse) to change slides (default: `true`)
* `swipeChangeOn` `{Number}` - position [0, 1] of next slide while swiping when current slide must be changed (default: `0.5`)
* `swipeRatio` `{Function}` - function to define swipe position (default: returns `ratioY` in vertical mode else `ratioX`), positional arguments:
    * `ratioX` - relative position on x axis [0, 1]
    * `ratioY` - relative position on y axis [0, 1]
* `activeClass` `{String}` - active navigation link class (default: `is-active`)
* `disabledClass` `{String}` - disabled arrow class (default: `is-disabled`)
* `hideArrows` `{Boolean}` - hide arrows when only one slide exists (default: `false`)
* `hideLinks` `{Boolean}` - hide navigation links when only one slide exists (default: `false`)
* `beforeChange` `{Function}` - function to call before slide is changed (default: `null`), positional arguments:
    * `oldIdx` `{Number}` - old slide index
    * `newIdx` `{Number}` - new slide index
* `afterChange` `{Function}` - function to call after slide is changed (default: `null`), arguments are the same as in `beforeChange`
* `duringChange` `{Function}` - function to call during slide is changed (default: `null`), positional arguments:
    * `oldIdx` `{Number}` - old slide index
    * `newIdx` `{Number}` - new slide index
    * `ratio` `{Number}` - slide position [0, 1]
* `effect` `{String}` - animation effect name (`slide`, `fade`) (default: `slide`)
* `effects` `{Object}` - custom animation description, see example below
    * `oldSlideCSS` `{Function}` - returns CSS properties for slide which is ready to turn off
    * `newSlideCSS` `{Function}` - returns CSS properties for slide which is ready to turn on
    * `resetSlideCSS` `{Function}` - returns CSS properties for slide to reset

## Methods

### showPrev
Show previous slide
`@param` `{boolean}` skip animation
Example:
`$('#slider').slider('showPrev') // with animation`
`$('#slider').slider('showPrev', true) // without animation`

### showNext
Show next slide
`@param` `{boolean}` skip animation
Example:
`$('#slider').slider('showNext') // with animation`
`$('#slider').slider('showNext', true) // without animation`

### show
Show certain slide
`@param` `{number}` index of slide
`@param` `{boolean}` skip animation
Example:
`$('#slider').slider('show', 3) // with animation`
`$('#slider').slider('show', 3, true) // without animation`

### start
Start automatic slideshow
Example:
`$('#slider').slider('start')`

### stop
Stop automatic slideshow
Example:
`$('#slider').slider('stop')`

### check
Set arrows and navigation links actual state (enabled/disabled/hidden)
Example:
`$('#slider').slider('check')`

### resize
Cache slider position settings (offset and size) due to touch and mouse events work correctly
Example:
`$('#slider').slider('resize')`

### count
Get slides count
`@return {number} Slides count`
Example:
`var count = $('#slider').slider('count')`

### destroy
Destroy all created elements and unbind connected events
Example:
`$('#slider').slider('destroy')`


## Examples
### Simple initialization
```
<div id="slider">
    <div class="item">...</div>
    <div class="item">...</div>
    <div class="item">...</div>
</div>

<script>
    $('#slider').slider();
</script>
```

### Initialization with options
```
<div id="slider">
    <div class="container">
        <div class="item">...</div>
        <div class="item">...</div>
        <div class="item">...</div>
    </div>
    <div class="arrows">
        <a href="#" class="prev">←</a>
        <a href="#" class="next">→</a>
    </div>
    <div class="links">
        <a href="#" class="link">1</a>
        <a href="#" class="link">2</a>
        <a href="#" class="link">3</a>
    </div>
</div>

<script>
    $('#slider').slider({
        container: '#slider .container',
        items: '#slider .item',
        prev: '#slider .prev',
        next: '#slider .next',
        links: '#slider .link',
        idx: 2,
        loop: false,
        duration: 500,
        autoPlay: true,
        delay: 5000,
        useSwipe: false,
        activeClass: 'is-active',
        disabledClass: 'is-disabled'
    });
</script>
```

### Initialization with custom effect and events
```
<div id="slider">
    <div class="item">...</div>
    <div class="item">...</div>
    <div class="item">...</div>
</div>

<script>
    $('#slider').slider({
        useSwipe: true,
        swipeChangeOn: 0.4,
        swipeRatio: function(ratioX, ratioY) {
            return ratioY;
        },
        beforeChange: function(oldIdx, newIdx) {
            console.log('beforeChange', oldIdx, newIdx);
        },
        afterChange: function(oldIdx, newIdx) {
            console.log('afterChange', oldIdx, newIdx);
        },
        duringChange: function(oldIdx, newIdx, ratio) {
            console.log('duringChange', oldIdx, newIdx, ratio);
        },
        effect: 'myeffect',
        effects: {
            myeffect: {
                oldSlideCSS: function(oldIdx, newIdx, ratio) {
                    return {
                        left: 0,
                        top: 0,
                        opacity: 1,
                        zIndex: 1
                    };
                },
                newSlideCSS: function(oldIdx, newIdx, ratio) {
                    var coef = (oldIdx < newIdx) ? 1 : -1;
                    if (this.opt.loop) {
                        if (oldIdx === 0 && newIdx === this.count - 1) {
                            coef = -1;
                        } else if (oldIdx === this.count - 1 && newIdx === 0) {
                            coef = 1;
                        }
                    }
                    return {
                        left: (coef * (1 - ratio) * 100) + '%',
                        top: (coef * (1 - ratio) * 100) + '%',
                        opacity: ratio,
                        zIndex: 2
                    };
                },
                resetSlideCSS: function() {
                    return {
                        left: '',
                        top: '',
                        opacity: '',
                        zIndex: ''
                    };
                }
            }
        }
    });
</script>
```
