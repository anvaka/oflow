/*jslint sloppy: true, vars: true */
/*global requestAnimationFrame, cancelAnimationFrame */

/* export */
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