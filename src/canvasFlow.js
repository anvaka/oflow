/*global window, FlowCalculator */
/* import 'flowCalculator.js' */

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
/* export */
/* public export */ 
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