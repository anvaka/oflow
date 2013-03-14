/*global document, settings */
/*jslint sloppy: true */

/* export */
/**
 * Controls a handle from the keyboard
 */
function KeyboardController(upKey, downKey) {
    var myHandle,
        direction = 0,
        handleKeyDown = function (e) {
            if (e.which === upKey) {
                direction = settings.keyboardControllerSpeed;
            } else if (e.which === downKey) {
                direction = -settings.keyboardControllerSpeed;
            }
        },
        handleKeyUp = function (e) {
            if (e.which === upKey || e.which === downKey) {
                direction = 0;
            }
        };

    this.mount = function (handle) {
        myHandle = handle;
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    };
    this.dismount = function () {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        myHandle = null;
    };
    this.step = function () {
        if (direction) {
            myHandle.move(direction);
        }
    };
}
