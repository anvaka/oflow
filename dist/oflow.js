(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        return factory((root.oflow = {}));
    }
}(this, function (exports) {
// import /Users/matt/Documents/Projects/oflow/src/flowZone.js
var FlowZone;
(function (__localScope__) {
  FlowZone = __localScope__.FlowZone;
}(function flowZone_js() {

function FlowZone(x, y, u, v) {
    this.x = x;
    this.y = y;
    this.u = u;
    this.v = v;
}
return { 
 FlowZone : FlowZone
};
}()));
// import /Users/matt/Documents/Projects/oflow/src/flowCalculator.js
var FlowCalculator;
(function (__localScope__) {
  FlowCalculator = __localScope__.FlowCalculator;
}(function flowCalculator_js() {
/*global FlowZone */
/*jslint sloppy: true, vars: true, plusplus: true, white: true */


/**
 * The heart of the optical flow detection. Implements Lucas-Kande method:
 * http://en.wikipedia.org/wiki/Lucas%E2%80%93Kanade_method
 * Current implementation is not extremely tolerant to garbage collector. 
 * This could be imporoved...
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
exports.FlowCalculator = FlowCalculator;
return { 
 FlowCalculator : FlowCalculator
};
}()));
// import /Users/matt/Documents/Projects/oflow/src/canvasFlow.js
var CanvasFlow;
(function (__localScope__) {
  CanvasFlow = __localScope__.CanvasFlow;
}(function canvasFlow_js() {
/*global window, FlowCalculator */


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
 *  // Starts capturing the flow from webcamer:
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
exports.CanvasFlow = CanvasFlow;
return { 
 CanvasFlow : CanvasFlow
};
}()));
// import /Users/matt/Documents/Projects/oflow/src/videoFlow.js
var VideoFlow;
(function (__localScope__) {
  VideoFlow = __localScope__.VideoFlow;
}(function videoFlow_js() {
/*global window, FlowCalculator */


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
 *  // Starts capturing the flow from webcamer:
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
exports.VideoFlow = VideoFlow;
return { 
 VideoFlow : VideoFlow
};
}()));
// import /Users/matt/Documents/Projects/oflow/src/webcamFlow.js
(function webcamFlow_js() {
/*global navigator, window, VideoFlow */


/**
 * A high level interface to capture optical flow from the web camera.
 * @param defaultVideoTag {DOMElement} optional reference to <video> tag
 *   where web camera output should be rendered. If parameter is not
 *   present a new invisible <video> tag is created.
 * @param zoneSize {int} optional size of a flow zone in pixels. 8 by default
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
 *  // Starts capturing the flow from webcamer:
 *  flow.startCapture();
 *  // once you are done capturing call
 *  flow.stopCapture();
 */
 
function WebCamFlow(defaultVideoTag, zoneSize) {
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
            
            navigator.getUserMedia({ video: true }, function(stream) {
                isCapturing = true;
                localStream = stream;
                videoTag.src = window.URL.createObjectURL(stream);
                if (stream) {
                    videoFlow.startCapture(videoTag);
                    videoFlow.onCalculated(gotFlow);
                }
            }, onWebCamFail);
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
exports.WebCamFlow = WebCamFlow;
}());
// import /Users/matt/Documents/Projects/oflow/src/main.js
(function main_js() {




}());}));
