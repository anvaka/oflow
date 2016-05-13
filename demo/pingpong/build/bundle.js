(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint sloppy: true */

module.exports = Ball;

/**
 * Represents a ball object on the scene
 */
function Ball(scene) {
    this.x = scene.width() / 2;
    this.y = scene.height() / 2;
    this.vx = 1;// + Math.random()* 2;
    this.vy = 1;// + Math.random() * 2;

    this.move = function () {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < 0) {
            this.y = 0;
            this.vy = -this.vy;
        } else if (this.y > scene.height()) {
            this.y = scene.height();
            this.vy = -this.vy;
        }
    };
    this.setPosition = function (pos) {
        this.x = pos.x;
        this.y = pos.y;
    };
    this.isOut = function () {
        if (this.x < 0) {
            return 'left';
        }
        if (this.x > scene.width()) {
            return 'right';
        }
        return false;
    };
}

},{}],2:[function(require,module,exports){
/*global document */
/*jslint sloppy: true */

module.exports = ComputerController;

/**
 * Controls a handle by computer (naive computer vs player)
 */
function ComputerController(ball) {
    var myHandle;

    this.mount = function (handle) {
        myHandle = handle;
    };

    this.dismount = function () {
        myHandle = null;
    };

    this.step = function () {
        if (myHandle) {
            if (myHandle.y > ball.y) {
                myHandle.move(Math.random() * 2 + 1);
            } else {
                myHandle.move(-(Math.random() * 2 + 1));
            }
        }
    };
}

},{}],3:[function(require,module,exports){
/*jslint sloppy: true */

module.exports = WebCamController;

var oflow = require('../../../../src/main.js');
/**
 * Controls a handle via optical flow detection from the webcam.
 */
function WebCamController() {
    var flow = new oflow.WebCamFlow(),
        readyCallback,
        waitReady = true;

    return {
        mount: function (handle) {
            flow.onCalculated(function (direction) {
                if (waitReady) {
                    readyCallback();
                    waitReady = false;
                }
                handle.move(-direction.v * 10);
            });
            flow.startCapture();
        },
        dismount: function () {
            flow.stopCapture();
        },
        onReady: function (callback) {
            readyCallback = callback;
        },
        step: function () {
        }
    };
}

},{"../../../../src/main.js":15}],4:[function(require,module,exports){
/*jslint sloppy: true, vars: true */
/*global requestAnimationFrame, cancelAnimationFrame */

module.exports = EventLoop;
/**
 * A simple event loop class, which fires onRender events on each animation frame
 */
function EventLoop() {
    var renderCallbacks = [],
        intervalId,
        startInternal = function () {
            intervalId = requestAnimationFrame(startInternal);
            for (var i = 0, n = renderCallbacks.length; i < n; ++i) {
                renderCallbacks[i]();
            }
        };

    this.onRender = function (callback) {
        if (typeof callback === 'function') {
            renderCallbacks.push(callback);
        }
    };
    this.start = function () {
        startInternal();
    };
    this.stop = function () {
        if (intervalId) {
            cancelAnimationFrame(intervalId);
            intervalId = null;
        }
    };
}

},{}],5:[function(require,module,exports){
/*jslint plusplus: true, sloppy: true */

var Handle = require('./handle.js');
var Ball = require('./ball.js');
var settings = require('./settings.js');
var Geometry = require('./intersect.js');

module.exports = Game;

/**
 * Ping Pong game model
 **/
function Game(scene) {
    var isOver = false,
        overCallbacks = [],
        cachedPos = new Geometry.Point(),
        ball = new Ball(scene),

        gameOver = function (side) {
            var i;
            isOver = true;
            for (i = 0; i < overCallbacks.length; ++i) {
                overCallbacks[i](side);
            }
        };

    this.leftHandle = new Handle(true, scene);
    this.rightHandle = new Handle(false, scene);
    this.ball = ball;

    this.step =  function () {
        if (isOver) {
            return;
        }
        ball.move();
        var outSide = ball.isOut();
        if (this.leftHandle.hit(ball)) {
            cachedPos.x = settings.handleWidth;
            cachedPos.y = ball.y;
            ball.setPosition(cachedPos);
            ball.vx = -ball.vx;
        } else if (this.rightHandle.hit(ball)) {
            cachedPos.x = this.rightHandle.x;
            cachedPos.y = ball.y;
            ball.setPosition(cachedPos);
            ball.vx = -ball.vx;
        } else if (outSide) {
            gameOver(outSide);
        }

        scene.render(this.leftHandle, this.rightHandle, ball);
    };
    this.isOver = function () {
        return isOver;
    };
    this.onOver = function (callback) {
        if (typeof callback === 'function') {
            overCallbacks.push(callback);
        }
    };
}

},{"./ball.js":1,"./handle.js":6,"./intersect.js":7,"./settings.js":10}],6:[function(require,module,exports){
/*jslint sloppy: true */

var settings = require('./settings');
var Geometry = require('./intersect');

module.exports = Handle;

/**
 * Represents a single ping pong handle either left or right
 **/
function Handle(isLeft, scene) {
    this.height = settings.handleHeight;
    this.width = settings.handleWidth;
    this.x = isLeft ? 0 : scene.width() - this.width;
    this.y = (scene.height() - this.height) / 2;

    var offset = isLeft ? this.width : 0,
        intersect = new Geometry.Intersect();

    this.hit = function ballHitsHandle(ball) {
        return intersect.run(this.x + offset, this.y, this.x + offset, this.y + this.height,
                        ball.x, ball.y, ball.x + ball.vx, ball.y + ball.vy);
    };

    this.move = function moveHandle(direction) {
        var y = this.y - direction;
        if (0 <= y && y <= scene.height() - this.height) {
            this.y = y;
        } else {
            this.y = y < 0 ? 0 : scene.height() - this.height;
        }
    };
}

},{"./intersect":7,"./settings":10}],7:[function(require,module,exports){
/* namespace Geometry */

module.exports = {
  Point: Point,
  Intersect: Intersect
};

function Point() {
    this.x = this.y = 0;
}

Point.prototype = { x: 0, y: 0 };


/**
 * Quick algorithm to detect intersection of two line segments.
 * Originally published in Graphics GEM:
 * http://www.opensource.apple.com/source/graphviz/graphviz-498/graphviz/dynagraph/common/xlines.c
 **/
function Intersect() {
    this.result = new Point();
}

Intersect.prototype.run = function (x1, y1, x2, y2, // first line segment
                                    x3, y3, x4, y4) { // second line segment
    var a1, a2, b1, b2, c1, c2, /* Coefficients of line eqns. */
        r1, r2, r3, r4,         /* 'Sign' values */
        denom, offset, num;     /* Intermediate values */


    /* Compute a1, b1, c1, where line joining points 1 and 2
     * is "a1 x  +  b1 y  +  c1  =  0".
     */
    a1 = y2 - y1;
    b1 = x1 - x2;
    c1 = x2 * y1 - x1 * y2;

    /* Compute r3 and r4.
     */
    r3 = a1 * x3 + b1 * y3 + c1;
    r4 = a1 * x4 + b1 * y4 + c1;

    /* Check signs of r3 and r4.  If both point 3 and point 4 lie on
     * same side of line 1, the line segments do not intersect.
     */

    if (r3 !== 0 && r4 !== 0 && ((r3 >= 0) === (r4 >= 4))) {
        return null; //no itersection.
    }

    /* Compute a2, b2, c2 */
    a2 = y4 - y3;
    b2 = x3 - x4;
    c2 = x4 * y3 - x3 * y4;

    /* Compute r1 and r2 */

    r1 = a2 * x1 + b2 * y1 + c2;
    r2 = a2 * x2 + b2 * y2 + c2;

    /* Check signs of r1 and r2.  If both point 1 and point 2 lie
     * on same side of second line segment, the line segments do
     * not intersect.
     */
    if (r1 !== 0 && r2 !== 0 && ((r1 >= 0) === (r2 >= 0))) {
        return null; // no intersection;
    }
     /* Line segments intersect: compute intersection point.
     */

    denom = a1 * b2 - a2 * b1;
    if (denom === 0) {
        return null; // Actually collinear..
    }

    offset = denom < 0 ? -denom / 2 : denom / 2;
    offset = 0.0;

    /* The denom/2 is to get rounding instead of truncating.  It
     * is added or subtracted to the numerator, depending upon the
     * sign of the numerator.
     */


    num = b1 * c2 - b2 * c1;
    this.result.x = (num < 0 ? num - offset : num + offset) / denom;

    num = a2 * c1 - a1 * c2;
    this.result.y = (num < 0 ? num - offset : num + offset) / denom;

    return this.result;
};

},{}],8:[function(require,module,exports){
var Scene = require('./scene.js');
var Game = require('./game.js');
var EventLoop = require('./eventLoop.js');
var ComputerController = require('./controllers/computerController.js');
var WebCamController = require('./controllers/webcamController.js');
var whenReady = require('./utils.js');

var UP_ARROW = 38, DOWN_ARROW = 40, KEY_W = 87, KEY_S = 83,
    scene = new Scene(document.getElementById('scene')),
    game = new Game(scene),
    eventLoop = new EventLoop(),
    leftController = new ComputerController(game.ball),
    rightController = new WebCamController();


eventLoop.onRender(function renderFrame() {
    if (!game.isOver()) {
        leftController.step();
        rightController.step();
        game.step();
    }
});

game.onOver(function() {
    leftController.dismount();
    rightController.dismount();
    eventLoop.stop();
});

leftController.mount(game.leftHandle);
rightController.mount(game.rightHandle);

whenReady(leftController, rightController).run(
    function () {
        eventLoop.start();
    }
);

},{"./controllers/computerController.js":2,"./controllers/webcamController.js":3,"./eventLoop.js":4,"./game.js":5,"./scene.js":9,"./utils.js":11}],9:[function(require,module,exports){
/*jslint sloppy: true */

var settings = require("./settings.js");

module.exports = Scene;

/**
 * Renders game to the canvas.
 */
function Scene(container) {
    var ctx = container.getContext('2d'),
        cachedHeight = container.height,
        cachedWidth = container.width,
        getWidth = function () {
            return cachedWidth;
        },
        getHeight = function () {
            return cachedHeight;
        },
        renderHandle = function (color, handle) {
            ctx.fillStyle = color;
            ctx.fillRect(handle.x, handle.y, handle.width, handle.height);
        },
        clearBackground = function (color) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, getWidth(), getHeight());
        },
        renderBall = function (color, ball) {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(ball.x, ball.y, settings.ballradius, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();
        };

    return {
        width: function () {
            return getWidth();
        },
        height: function () {
            return getHeight();
        },
        render: function (leftHandle, rightHandle, ball) {
            clearBackground('#000000');
            renderHandle('#ccaa00', leftHandle);
            renderHandle('#00aa00', rightHandle);
            renderBall('#ffffff', ball);
        }
    };
}

},{"./settings.js":10}],10:[function(require,module,exports){
module.exports = {
  handleWidth: 6,
  handleHeight: 40,
  ballradius: 3,
  keyboardControllerSpeed: 3
};

},{}],11:[function(require,module,exports){
/*global window */
/*jslint plusplus: true, sloppy: true */

module.exports = whenReady;

/**
 * just a little helper method to wait for multiple objects
 * and fire event when all of them indicated they are ready
 */
function whenReady() {
    var pendingObjects = [].slice.call(arguments),
        wait = pendingObjects.length,
        resolvedCallback,
        promise = {
            run : function (callback) {
                resolvedCallback = callback;
            }
        },
        resolved = function () {
            wait -= 1;
            if (wait <= 0 && resolvedCallback) {
                resolvedCallback();
            }
        },
        i;

    for (i = 0; i < pendingObjects.length; i++) {
        if (typeof pendingObjects[i].onReady === 'function') {
            pendingObjects[i].onReady(resolved);
        } else {
            window.setTimeout(resolved, 0);
        }
    }
    if (pendingObjects.length === 0) {
        window.setTimeout(resolved, 0);
    }

    return promise; // to Domenic, this is not a promise, I know :).
}

},{}],12:[function(require,module,exports){
/*global window,  */

var FlowCalculator = require('./flowCalculator.js');

module.exports = CanvasFlow;

/**
 * A high level interface to capture optical flow from the <canvas> tag.
 * The API is symmetrical to webcamFlow.js
 *
 * Usage example:
 *  var flow = new VideoFlow();
 *
 *  // Every time when optical flow is calculated
 *  // call the passed in callback:
 *  flow.onCalculated(function (direction) {
 *      // direction is an object which describes current flow:
 *      // direction.u, direction.v {floats} general flow vector
 *      // direction.zones {Array} is a collection of flowZones.
 *      //  Each flow zone describes optical flow direction inside of it.
 *  });
 *  // Starts capturing the flow from webcamera:
 *  flow.startCapture();
 *  // once you are done capturing call
 *  flow.stopCapture();
 */
function CanvasFlow(defaultCanvasTag, zoneSize) {
    var calculatedCallbacks = [],
        canvas = defaultCanvasTag,
        ctx,
        width,
        height,
        oldImage,
        loopId,
        calculator = new FlowCalculator(zoneSize || 8),

        requestAnimFrame = window.requestAnimationFrame       ||
                           window.webkitRequestAnimationFrame ||
                           window.mozRequestAnimationFrame    ||
                           window.oRequestAnimationFrame      ||
                           window.msRequestAnimationFrame     ||
                           function( callback ) { window.setTimeout(callback, 1000 / 60); },
        cancelAnimFrame =  window.cancelAnimationFrame ||
                           window.mozCancelAnimationFrame,
        isCapturing = false,

        getCurrentPixels = function () {
            return ctx.getImageData(0, 0, width, height).data;
        },
        calculate = function () {
            var newImage = getCurrentPixels();
            if (oldImage && newImage) {
                var zones = calculator.calculate(oldImage, newImage, width, height);
                calculatedCallbacks.forEach(function (callback) {
                    callback(zones);
                });
            }
            oldImage = newImage;
        },

        initView = function () {
            width = canvas.width;
            height = canvas.height;
            ctx = canvas.getContext('2d');
        },
        animloop = function () {
            if (isCapturing) {
                loopId = requestAnimFrame(animloop);
                calculate();
            }
        };

    if (!defaultCanvasTag) {
        var err = new Error();
        err.message = "Video tag is required";
        throw err;
    }

    this.startCapture = function () {
        // todo: error?
        isCapturing = true;
        initView();
        animloop();
    };
    this.stopCapture = function () {
        cancelAnimFrame(loopId);
        isCapturing = false;
    };
    this.onCalculated = function (callback) {
        calculatedCallbacks.push(callback);
    };
    this.getWidth = function () { return width; };
    this.getHeight = function () { return height; };
}

},{"./flowCalculator.js":13}],13:[function(require,module,exports){
/*jslint sloppy: true, vars: true, plusplus: true, white: true */

var FlowZone = require('./flowZone');

module.exports = FlowCalculator;

/**
 * The heart of the optical flow detection. Implements Lucas-Kande method:
 * http://en.wikipedia.org/wiki/Lucas%E2%80%93Kanade_method
 * Current implementation is not extremely tolerant to garbage collector.
 * This could be improved...
 */
function FlowCalculator(step) {
    this.step = step || 8;
}

FlowCalculator.prototype.calculate = function (oldImage, newImage, width, height) {
    var zones = [];
    var step = this.step;
    var winStep = step * 2 + 1;

    var A2, A1B2, B1, C1, C2;
    var u, v, uu, vv;
    uu = vv = 0;
    var wMax = width - step - 1;
    var hMax = height - step - 1;
    var globalY, globalX, localY, localX;

    for (globalY = step + 1; globalY < hMax; globalY += winStep) {
        for (globalX = step + 1; globalX < wMax; globalX += winStep) {
            A2 = A1B2 = B1 = C1 = C2 = 0;

            for (localY = -step; localY <= step; localY++) {
                for (localX = -step; localX <= step; localX++) {
                    var address = (globalY + localY) * width + globalX + localX;

                    var gradX = (newImage[(address - 1) * 4]) - (newImage[(address + 1) * 4]);
                    var gradY = (newImage[(address - width) * 4]) - (newImage[(address + width) * 4]);
                    var gradT = (oldImage[address * 4]) - (newImage[address * 4]);

                    A2 += gradX * gradX;
                    A1B2 += gradX * gradY;
                    B1 += gradY * gradY;
                    C2 += gradX * gradT;
                    C1 += gradY * gradT;
                }
            }

            var delta = (A1B2 * A1B2 - A2 * B1);

            if (delta !== 0) {
                /* system is not singular - solving by Kramer method */
                var Idelta = step / delta;
                var deltaX = -(C1 * A1B2 - C2 * B1);
                var deltaY = -(A1B2 * C2 - A2 * C1);

                u = deltaX * Idelta;
                v = deltaY * Idelta;
            } else {
                /* singular system - find optical flow in gradient direction */
                var norm = (A1B2 + A2) * (A1B2 + A2) + (B1 + A1B2) * (B1 + A1B2);
                if (norm !== 0) {
                    var IGradNorm = step / norm;
                    var temp = -(C1 + C2) * IGradNorm;

                    u = (A1B2 + A2) * temp;
                    v = (B1 + A1B2) * temp;
                } else {
                    u = v = 0;
                }
            }

            if (-winStep < u && u < winStep &&
                -winStep < v && v < winStep) {
                uu += u;
                vv += v;
                zones.push(new FlowZone(globalX, globalY, u, v));
            }
        }
    }

    return {
        zones : zones,
        u : uu / zones.length,
        v : vv / zones.length
    };
};

},{"./flowZone":14}],14:[function(require,module,exports){
module.exports = FlowZone;

function FlowZone(x, y, u, v) {
    this.x = x;
    this.y = y;
    this.u = u;
    this.v = v;
}

},{}],15:[function(require,module,exports){
module.exports = {
  WebCamFlow: require('./webcamFlow'),
  VideoFlow: require('./videoFlow'),
  CanvasFlow: require('./canvasFlow'),
  FlowZone: require('./flowZone'),
  FlowCalculator: require('./flowCalculator')
};

},{"./canvasFlow":12,"./flowCalculator":13,"./flowZone":14,"./videoFlow":16,"./webcamFlow":17}],16:[function(require,module,exports){
/*global window */

var FlowCalculator = require('./flowCalculator');
module.exports = VideoFlow;

/**
 * A high level interface to capture optical flow from the <video> tag.
 * The API is symmetrical to webcamFlow.js
 *
 * Usage example:
 *  var flow = new VideoFlow();
 *
 *  // Every time when optical flow is calculated
 *  // call the passed in callback:
 *  flow.onCalculated(function (direction) {
 *      // direction is an object which describes current flow:
 *      // direction.u, direction.v {floats} general flow vector
 *      // direction.zones {Array} is a collection of flowZones.
 *      //  Each flow zone describes optical flow direction inside of it.
 *  });
 *  // Starts capturing the flow from webcamera:
 *  flow.startCapture();
 *  // once you are done capturing call
 *  flow.stopCapture();
 */
function VideoFlow(defaultVideoTag, zoneSize) {
    var calculatedCallbacks = [],
        canvas,
        video = defaultVideoTag,
        ctx,
        width,
        height,
        oldImage,
        loopId,
        calculator = new FlowCalculator(zoneSize || 8),

        requestAnimFrame = window.requestAnimationFrame       ||
                           window.webkitRequestAnimationFrame ||
                           window.mozRequestAnimationFrame    ||
                           window.oRequestAnimationFrame      ||
                           window.msRequestAnimationFrame     ||
                           function( callback ) { window.setTimeout(callback, 1000 / 60); },
        cancelAnimFrame =  window.cancelAnimationFrame ||
                           window.mozCancelAnimationFrame,
        isCapturing = false,

        getCurrentPixels = function () {
            width = video.videoWidth;
            height = video.videoHeight;
            canvas.width  = width;
            canvas.height = height;

            if (width && height) {
                ctx.drawImage(video, 0, 0);
                var imgd = ctx.getImageData(0, 0, width, height);
                return imgd.data;
            }
        },
        calculate = function () {
            var newImage = getCurrentPixels();
            if (oldImage && newImage) {
                var zones = calculator.calculate(oldImage, newImage, width, height);
                calculatedCallbacks.forEach(function (callback) {
                    callback(zones);
                });
            }
            oldImage = newImage;
        },

        initView = function () {
            width = video.videoWidth;
            height = video.videoHeight;

            if (!canvas) { canvas = window.document.createElement('canvas'); }
            ctx = canvas.getContext('2d');
        },
        animloop = function () {
            if (isCapturing) {
                loopId = requestAnimFrame(animloop);
                calculate();
            }
        };

    if (!defaultVideoTag) {
        var err = new Error();
        err.message = "Video tag is required";
        throw err;
    }

    this.startCapture = function () {
        // todo: error?
        isCapturing = true;
        initView();
        animloop();
    };
    this.stopCapture = function () {
        cancelAnimFrame(loopId);
        isCapturing = false;
    };
    this.onCalculated = function (callback) {
        calculatedCallbacks.push(callback);
    };
    this.getWidth = function () { return width; };
    this.getHeight = function () { return height; };
}

},{"./flowCalculator":13}],17:[function(require,module,exports){
/*global navigator, window */

var VideoFlow = require('./videoFlow');
module.exports = WebCamFlow;

/**
 * A high level interface to capture optical flow from the web camera.
 * @param defaultVideoTag {DOMElement} optional reference to <video> tag
 *   where web camera output should be rendered. If parameter is not
 *   present a new invisible <video> tag is created.
 * @param zoneSize {int} optional size of a flow zone in pixels. 8 by default
 * @param cameraFacing {string} optional direction camera is facing (either
 * 'user' or 'environment') used to give preference to a particular mobile
 * camera. If matching camera is not found, any available one will be used.
 *
 * Usage example:
 *  var flow = new WebCamFlow();
 *
 *  // Every time when optical flow is calculated
 *  // call the passed in callback:
 *  flow.onCalculated(function (direction) {
 *      // direction is an object which describes current flow:
 *      // direction.u, direction.v {floats} general flow vector
 *      // direction.zones {Array} is a collection of flowZones.
 *      //  Each flow zone describes optical flow direction inside of it.
 *  });
 *  // Starts capturing the flow from webcamera:
 *  flow.startCapture();
 *  // once you are done capturing call
 *  flow.stopCapture();
 */
function WebCamFlow(defaultVideoTag, zoneSize, cameraFacing) {
    var videoTag,
        isCapturing,
        localStream,
        calculatedCallbacks = [],
        flowCalculatedCallback,
        videoFlow,
        onWebCamFail = function onWebCamFail(e) {
            if(e.code === 1){
                window.alert('You have denied access to your camera. I cannot do anything.');
            } else {
                window.alert('getUserMedia() is not supported in your browser.');
            }
        },
        gotFlow = function(direction) {
            calculatedCallbacks.forEach(function (callback) {
                callback(direction);
            });
        },
        initCapture = function() {
        if (!videoFlow) {
            videoTag = defaultVideoTag || window.document.createElement('video');
            videoTag.setAttribute('autoplay', true);
            videoFlow = new VideoFlow(videoTag, zoneSize);
        }


        

        if (window.MediaStreamTrack.getSources) {
            window.MediaStreamTrack.getSources(function(sourceInfos) {
                for (var i = 0; i < sourceInfos.length; i++) {
                    if (sourceInfos[i].kind === 'video'){
                        selectedVideoSource = sourceInfos[i].id;
                        // if camera facing requested direction is found, stop search
                        if (sourceInfos[i].facing === cameraFacing) {
                            break;
                        }
                    }
                }

                desiredDevice = { optional: [{sourceId: selectedVideoSource}] };

                navigator.getUserMedia({ video: desiredDevice }, function(stream) {
                    isCapturing = true;
                    localStream = stream;
                    videoTag.src = window.URL.createObjectURL(stream);
                    if (stream) {
                        videoFlow.startCapture(videoTag);
                        videoFlow.onCalculated(gotFlow);
                    }
                }, onWebCamFail);
            });
        } else if(navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(
                function(sourceInfos){
                    for (var i = 0; i < sourceInfos.length; i++) {
                        if(sourceInfos[i].kind == "videoinput"){
                            selectedVideoSource = sourceInfos[i].deviceId;
                        }
                    }
                    
                    desiredDevice = { optional: [{sourceId: selectedVideoSource}] };

                    navigator.getUserMedia({ video: desiredDevice }, function(stream) {
                        isCapturing = true;
                        localStream = stream;
                        videoTag.src = window.URL.createObjectURL(stream);
                        if (stream) {
                            videoFlow.startCapture(videoTag);
                            videoFlow.onCalculated(gotFlow);
                        }
                    }, onWebCamFail);
                }
            );
        }



    };

    if (!navigator.getUserMedia) {
        navigator.getUserMedia = navigator.getUserMedia ||
                                 navigator.webkitGetUserMedia ||
                                 navigator.mozGetUserMedia ||
                                 navigator.msGetUserMedia;
    }

    // our public API
    this.startCapture = function () {
        if (!isCapturing) {
            initCapture();
        }
    };
    this.onCalculated = function (callback) {
        calculatedCallbacks.push(callback);
    };
    this.stopCapture = function() {
        isCapturing = false;
        if (videoFlow) { videoFlow.stopCapture(); }
        if (videoTag) { videoTag.pause(); }
        if (localStream) { localStream.stop(); }
    };
}

},{"./videoFlow":16}]},{},[8]);
