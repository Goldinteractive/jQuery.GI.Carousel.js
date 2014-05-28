/*!
 *
 * Version 0.2.3
 * This class could be used to create image carousels optimized for Mobile Phones and Tablets
 * Copyright Gold Interactive 2014
 * Author: Gianluca Guarini
 *
 */
/* jshint curly:false*/
/*global Modernizr $*/
(function(document, window, $document, $window, $body, $) {
    "use strict";

    $.support.transition = (function() {

        var transitionEnd = (function() {

            var el = document.createElement('GI'),
                transEndEventNames = {
                    'WebkitTransition': 'webkitTransitionEnd',
                    'MozTransition': 'transitionend',
                    'OTransition': 'oTransitionEnd otransitionend',
                    'transition': 'transitionend'
                }, name;

            for (name in transEndEventNames) {
                if (el.style[name] !== undefined) {
                    return transEndEventNames[name];
                }
            }

        }());

        return transitionEnd && {
            end: transitionEnd
        };

    })();

    /**
     * Returns a simple event regarding the original event is a mouse event or a touch event.
     */
    var getPointerEvent = function(event) {
        return event.originalEvent.targetTouches ? event.originalEvent.targetTouches[0] : event;
    };

    var GI_C_ID = 0;

    var GICarousel = function($el, myOptions) {

        /*
         *
         * GLOBAL PROTECTED VAR
         *
         */

        var self = this,
            defaultOptions = {
                // Callbacks API
                onBeforeInit: null,
                onCarouselReady: null,
                onViewPortUpdate: null,
                onItemChange: null,
                onDestroy: null,
                // settings
                responsive: true,
                parallax: true,
                parallaxFactor: 0.3,
                carousel: false,
                arrows: false,
                pagination: false,
                controlsWrapper: null,
                closebutton: false,
                keyboardNavigation: true,
                animationSpeed: 300,
                fullscreen: false,
                startId: 0,
                slidesWidthRatio: 1,
                slidesHeightRatio: 1,
                autoSlideInterval: 0,
                swipeSensibility: 100,
                nextButtonClass: '',
                prevButtonClass: '',
                closeButtonClass: ''
            },
            // IMPORTANT: these variables are not options so please don't change them
            currentIndex = 0,
            viewportSize = {
                width: 0,
                height: 0
            },
            istouch = 'ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch,
            eventsNames = {
                click: istouch ? "touchstart" : "click",
                mousedown: istouch ? "touchstart" : "mousedown",
                mouseup: istouch ? "touchend" : "mouseup",
                mousemove: istouch ? "touchmove" : "mousemove",
                mouseleave: istouch ? "touchleave" : "mouseleave"
            },
            mouse = {
                isDown: false,
                cachedX: 0,
                cachedY: 0,
                deltaX: 0,
                deltaY: 0
            },
            isMoving = false,
            keyboardKeys = [33, 34, 35, 36, 37, 38, 39, 40, 27],
            // If Modernizr is undefined we give the priority to the javascript animations
            csstransitions = $.support.transition,
            eventsNamespace = ".GICarousel" + GI_C_ID,
            halfItemsCount = 0,
            options = $.extend(defaultOptions, myOptions);

        /*
         *
         * PUBLIC VAR
         *
         */
        this.VERSION = "0.2.0";
        this.$el = $el;
        this.$controlsWrapper = options.controlsWrapper || this.$el;
        this.$list = $("> ul", this.$el).eq(0);
        this.$items = $("> li", this.$list);
        this.currentIndex = options.startId;
        this.carouselIndex = options.startId;
        this.itemsLength = this.$items.length;
        this.currentX = 0;
        this.totalWidth = 0;


        /*
         *
         * PRIVATE METHODS
         *
         */


        /*
         *
         * Execute all the callbacks only if they are functions
         *
         */

        var execCallback = function(callback, arg) {
            if (typeof callback === "function") {
                $.proxy(callback, self, arg)();
            }
        };

        /*
         *
         * This     function is fundamental to block the user events that could be triggered to many times(window scroll or window resize)
         * It executes the callback only once after the delay passed from the last triggered event
         *
         * param callback: { function } is the callback function to trigger after the delay
         * param delay: { int } it is the number of milliseconds that it must wait before trigger the callback
         * param event: { object } is the jQuery event object
         *
         */

        var debounce = function(callback, delay, event) {
            var timerId = event.type + event.handleObj.guid;
            this.GI_Timers = this.GI_Timers || {};

            if (this.GI_Timers[timerId]) clearTimeout(this.GI_Timers[timerId]);

            this.GI_Timers[timerId] = setTimeout($.proxy(function() {
                delete this.GI_Timers[timerId];
                callback.call(this, event);
            }, this), delay || 0);
        };
        /**
         * Build the navigation arrows html
         *
         */
        var _buildArrows = function() {
            this.$controlsWrapper.append('<i class="GI_C_arrow GI_C_prev GI_Controls"><span class="' + options.prevButtonClass + '"></span></i><i class="GI_C_arrow GI_C_next GI_Controls"><span class="' + options.nextButtonClass + '"></span></i>');
            this.$next = $('.GI_C_next', this.$controlsWrapper);
            this.$prev = $('.GI_C_prev', this.$controlsWrapper);
        };

        /*
         *
         * Build a nice pagination to navigate the carousel
         *
         */

        var _buildPagination = function() {
            var i = 0,
                paginationHtml = "<ul class='GI_C_paginator GI_Controls'>";

            for (; i < this.itemsLength; i++) {
                var activeClass = i === this.currentIndex ? "active" : "";
                paginationHtml += "<li class='" + activeClass + "'></li>";
            }
            paginationHtml += "</ul>";

            this.$controlsWrapper.append(paginationHtml);

            this.$paginator = $(".GI_C_paginator", this.$controlsWrapper);

        };
        /**
         * Show and hide the arrows from the current slide index
         *
         */
        var _updateArrows = function() {
            if (options.carousel) return;
            if (self.currentIndex <= 0) {
                self.$prev.addClass('GI_C_hidden');
            } else if (self.$prev.hasClass('GI_C_hidden')) {
                self.$prev.removeClass('GI_C_hidden');
            }
            if (self.currentIndex >= self.itemsLength - 1) {
                self.$next.addClass('GI_C_hidden');
            } else if (self.$next.hasClass('GI_C_hidden')) {
                self.$next.removeClass('GI_C_hidden');
            }
        };
        /**
         *
         * Append the class current over the current item displayed
         *
         */
        var _updateCurrentClass = function() {
            if (options.carousel)
                this.$list.find('li').removeClass('current').eq(this.carouselIndex).addClass('current');
            else
                this.$items.removeClass('current').eq(this.currentIndex).addClass('current');
        };
        /**
         *
         * Reposition the carousel items into the dom to create the carousel effect
         *
         */
        var _updateCarousel = function() {
            if (!options.carousel) return;
            var _carouselIndex = null;
            if (this.currentIndex >= halfItemsCount + 1) {
                this.$itemsClone.data('position', 'after');
                this.$list.append(this.$itemsClone);
            } else if (this.currentIndex <= halfItemsCount - 1) {
                this.$itemsClone.data('position', 'before');
                this.$list.prepend(this.$itemsClone);
            }
            if (this.currentIndex <= 0) {
                _carouselIndex = this.itemsLength;
            }
            if (this.currentIndex >= this.itemsLength - 1) {
                _carouselIndex = this.itemsLength - 1;
            }
            if (_carouselIndex) {
                this.carouselIndex = _carouselIndex;
                this.currentX = -(viewportSize.width * this.carouselIndex);
                this.$list.removeClass('animated').css({
                    left: this.currentX
                });
            }
        };
        /**
         *
         * Clone all the items to create the carousel loop
         *
         */
        var _buildCarousel = function() {
            this.$itemsClone = this.$items.clone();
            if (this.currentIndex > halfItemsCount) {
                this.$itemsClone.data('position', 'after');
                this.$list.append(this.$itemsClone);
            } else if (this.currentIndex < halfItemsCount) {
                this.$itemsClone.data('position', 'before');
                this.$list.prepend(this.$itemsClone);
                this.carouselIndex = this.currentIndex + this.itemsLength;
            }
        };

        /*
         *
         * Callback triggered anytime a slide is changed
         *
         */

        var _onItemChange = function(e) {
            if ($(e.target)[0] !== this.$list[0] && csstransitions) return;

            // update the DOM
            _updateCarousel.call(this);

            if (options.pagination) {
                this.$paginator.find("li")
                    .removeClass("active")
                    .eq(this.currentIndex)
                    .addClass("active");
            }
            if (options.arrows)
                _updateArrows();

            if (options.parallax)
                _doParallax.call(this);

            isMoving = false;

            _updateCurrentClass.call(this);

            execCallback(options.onItemChange, this.currentIndex);
        };


        var _onMouseMove = function(e) {
            if (!mouse.isDown) {
                return false;
            }
            var cachedY = mouse.deltaY;

            mouse.deltaX = ~~ (getPointerEvent(e).pageX - mouse.cachedX);
            mouse.deltaY = ~~ (getPointerEvent(e).pageY - mouse.cachedY);

            if (Math.abs(mouse.deltaY) < options.swipeSensibility) {
                e.preventDefault(); // TODO: try to understand why this does not work on touch devices
            }

            this.$list.css({
                "left": this.$list.data("old-x-position") + mouse.deltaX
            });

            if (options.parallax)
                _doParallax.call(this);

        };

        /*
         *
         * Should I explain also these functions?!
         *
         */

        var _onMouseDown = function(e) {
            this.stopAutoslide();
            if (isMoving) return;
            if (e.type === "mousedown") e.preventDefault();

            this.$list.removeClass("animated").data("old-x-position", window.parseInt(this.$list.css("left")));

            mouse.cachedX = getPointerEvent(e).pageX;
            mouse.cachedY = getPointerEvent(e).pageY;

            mouse.isDown = true;

        };
        var _onMouseUp = function(e) {
            if (!mouse.isDown) return;

            // make the list draggable
            this.$list.addClass("animated");

            if (Math.abs(mouse.deltaX) > options.swipeSensibility) {

                if (mouse.deltaX > 0) {
                    this.prev();
                } else {
                    this.next();
                }
            } else {
                this.moveToSlide();
            }

            mouse.cachedX = 0;
            mouse.deltaX = 0;
            mouse.cachedY = 0;
            mouse.deltaY = 0;

            mouse.isDown = false;
        };

        var _onKeypress = function(e) {
            if ($.inArray(e.keyCode, keyboardKeys) > -1) {
                e.preventDefault();
            }
            if (e.keyCode === 39) {
                this.next();
            } else if (e.keyCode === 37) {
                this.prev();
            } else if (e.keyCode === 27) {
                this.destroy();
            }
        };

        var _onArrowClicked = function(e) {
            e.preventDefault();
            this.stopAutoslide();
            var $this = $(e.currentTarget);
            if ($this.hasClass('GI_C_next')) this.next();
            else this.prev();
        };

        /**
         * Make the parallax effect on the inner contwnts having the .parallax class
         */
        var _doParallax = function() {
            if (!csstransitions) return;
            this.$items.each(function(i) {
                var $parallaxWrappwer = $('.parallax', this);

                $parallaxWrappwer.css({
                    marginLeft: self.$items.eq(i).offset().left * options.parallaxFactor
                });
            });
        };

        /*
         *
         * PUBLIC METHODS
         *
         */

        this.init = function() {
            // not enough items to init the carousel
            if (this.$items.length <= 1) {
                this.setViewport();
                return this;
            }

            this.currentIndex = options.startId < 0 ? 0 : options.startId;
            isMoving = false;

            execCallback(options.onBeforeInit);

            // Add the classes needed to style the gallery
            this.$el.addClass("GI_C_wrapper");
            this.$list.addClass("GI_C_items");
            if (options.carousel) {
                // variable needed only for the carousel
                halfItemsCount = ~~ (this.itemsLength / 2);
                _buildCarousel.call(this);
                _updateCarousel.call(this);
            }
            if (options.pagination)
                _buildPagination.call(this);

            if (options.arrows) {
                _buildArrows.call(this);
                _updateArrows();
            }

            if (options.closebutton) {
                this.$controlsWrapper.append('<div class="GI_C_close GI_Controls"><span class="' + options.closeButtonClass + '"></span></div>');
                this.$closebutton = $('.GI_C_items', this.$controlsWrapper);
            }

            // setting the viewport
            this.setViewport();



            this.bindAll();

            if (options.autoSlideInterval)
                this.startAutoslide();



            execCallback(options.onCarouselReady);

            GI_C_ID++;
        };

        /*
         *
         * Positioning all the elements setting the width of the list based on the width of all its contents
         *
         */

        this.setViewport = function() {
            // force the wrapper display to get the right size
            this.$el.css({
                "display": "block",
                "visibility": "hidden"
            });
            // caching the viewport size
            viewportSize = {
                width: options.fullscreen ? $body.width() : this.$el.width(),
                height: options.fullscreen ? $body.height() : this.$el.height()
            };

            // restoring the wrapper css display properties
            this.$el.css({
                "display": "inherit",
                "visibility": "inherit"
            });

            this.totalWidth = viewportSize.width * ((options.carousel ? (this.$items.length * 2) : this.$items.length) + 1);
            this.currentX = ((this.$itemsClone && this.$itemsClone.data('position') === 'before') ? -(this.currentIndex + this.itemsLength) : -this.currentIndex) * viewportSize.width;

            // setting the size of the list in order to contain all its items
            this.$list.removeClass('animated').css({
                width: this.totalWidth,
                height: viewportSize.height,
                left: this.currentX
            });

            _updateCurrentClass.call(this);
            // setting the size of every single item
            this.$items.css({
                width: viewportSize.width * options.slidesWidthRatio,
                height: viewportSize.height * options.slidesHeightRatio
            });

            if (this.$itemsClone)
                this.$itemsClone.css({
                    width: viewportSize.width,
                    height: viewportSize.height
                });

            isMoving = false;

            execCallback(options.onViewPortUpdate);
        };

        /**
         *
         * Setup the autoslide according to the interval passed to the plugin
         *
         */
        this.startAutoslide = function(timeout) {

            this.stopAutoslide();

            this.autoslideTimer = window.setInterval(function() {
                self.next();
            }, options.autoSlideInterval ||  timeout);
        };

        this.stopAutoslide = function() {
            if (this.autoslideTimer)
                window.clearInterval(this.autoslideTimer);
        };


        /*
         *
         * Positioning all the elements setting the width of the list based on the width of all its contents
         * @param index: { int } it is the index of the image that we need to show
         *
         */

        this.moveToSlide = function(index) {

            if (isMoving) return;
            var oldX = this.currentX;
            this.currentIndex = typeof index === 'number' ? index : this.currentIndex;

            // this var changes its value depending on the carousel option value
            var tmpPosition = 0;

            // this.currentIndex must be always in a valid range
            if (this.currentIndex < 0) {
                this.currentIndex = 0;
            }
            if (this.currentIndex >= this.itemsLength) {
                this.currentIndex = this.itemsLength - 1;
            }

            // ok there is a little bit of math here but it is not too complicated ;)
            if (options.carousel) {
                // get how many carousel loops we have done
                var carouselLoops = Math.floor(this.carouselIndex / this.itemsLength);
                // if the index argument is passed to this function
                if (typeof index === 'number') {
                    if (carouselLoops !== 0) {
                        // if carouselLoops is a positive number..
                        if (carouselLoops > 0)
                            this.carouselIndex = this.currentIndex + (carouselLoops + this.itemsLength) - 1;
                        // otherwise..
                        else
                            this.carouselIndex = this.currentIndex - (carouselLoops + this.itemsLength);
                        // normalizing the currentIndex
                    } else {
                        this.carouselIndex = this.currentIndex;
                    }
                }
                this.currentIndex = Math.ceil(this.carouselIndex - (carouselLoops * this.itemsLength));
                tmpPosition = this.carouselIndex;
            } else {
                tmpPosition = this.currentIndex;
            }
            this.currentX = -tmpPosition * viewportSize.width;
            if (this.currentX !== oldX)
                isMoving = true;
            else
                isMoving = false;

            this.$list.addClass('animated').stop(true, false)[csstransitions ? "css" : "animate"]({
                "left": this.currentX
            }, options.animationSpeed, $.proxy(_onItemChange, this, this.currentIndex));

        };

        this.next = function() {
            if (isMoving) return;
            this.currentIndex++;
            this.carouselIndex++;
            this.moveToSlide();
        };

        this.prev = function() {
            if (isMoving) return;
            this.currentIndex--;
            this.carouselIndex--;
            this.moveToSlide();
        };

        /*
         *
         * Bind all the events needed
         *
         */

        this.bindAll = function() {
            // If it supports Css3 transitions we need to listen the transitionend event to trigger the onItemcChange callback
            if (csstransitions) {
                this.$el.on(csstransitions.end + eventsNamespace, this.$list, $.proxy(_onItemChange, this));
            }

            if (options.pagination) {
                this.$controlsWrapper.on(eventsNames.click + eventsNamespace, ".GI_C_paginator li", $.proxy(debounce, this, function(e) {
                    this.stopAutoslide();
                    this.moveToSlide($(e.currentTarget).index());
                }, 100));
            }
            if (options.arrows) {
                this.$controlsWrapper.on(eventsNames.click + eventsNamespace, ".GI_C_arrow", $.proxy(_onArrowClicked, this));
            }

            if (options.closebutton) {
                this.$controlsWrapper.on(eventsNames.click + eventsNamespace, ".GI_C_close", $.proxy(this.destroy, this));
            }
            this.$el.on(eventsNames.mousedown + eventsNamespace, ".GI_C_items", $.proxy(_onMouseDown, this));
            this.$el.on(eventsNames.mousemove + eventsNamespace, ".GI_C_items", $.proxy(_onMouseMove, this));
            this.$el.on(eventsNames.mouseup + eventsNamespace, ".GI_C_items", $.proxy(_onMouseUp, this));
            this.$el.on(eventsNames.mouseleave + eventsNamespace, ".GI_C_items", $.proxy(_onMouseUp, this));

            if (options.responsive)
                $window.on("resize" + eventsNamespace + " orientationchange" + eventsNamespace, $.proxy(debounce, this, this.setViewport, 300));
            if (options.keyboardNavigation)
                $window.on("keydown" + eventsNamespace, $.proxy(_onKeypress, this));

        };
        this.unbindAll = function() {
            this.$el.off(eventsNamespace);
            this.$controlsWrapper.off(eventsNamespace);
            $window.off(eventsNamespace);
        };

        /*
         *
         * Remove all the events of the plugin
         *
         */

        this.destroy = function(e) {
            if (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            this.currentIndex = null;
            this.currentX = null;
            this.carouselIndex = null;
            this.unbindAll();
            // probably this could be useful sometimes
            // I'll keep this commented
            //this.$list.attr('style', '');
            this.$list.removeClass('animated');
            if (this.$itemsClone)
                this.$itemsClone.remove();

            this.stopAutoslide();

            execCallback(options.onDestroy);
        };

        return this.init();
    };

    /*
     *
     * Exporting the class extending jQuery
     *
     */

    $.fn.GICarousel = function(myOptions) {
        if (!this.length) return;
        return new GICarousel(this, myOptions);
    };

}(document, window, $(document), $(window), $('body'), jQuery));
