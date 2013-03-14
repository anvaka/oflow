/*global document, settings */
/*jslint sloppy: true */

/* export */
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