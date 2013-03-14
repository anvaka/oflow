/*jslint sloppy: true */
/*global settings */

/* import 'settings.js' */

/* export */
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