/*jslint sloppy: true */

/**
 * Controls a handle via optical flow detection from the webcam.
 */
/* export */
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