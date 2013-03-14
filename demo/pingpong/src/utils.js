/*global window */
/*jslint plusplus: true, sloppy: true */

/**
 * just a little helper method to wait for multiple objects
 * and fire event when all of them indicated they are ready
 */
/* export */
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