/*global settings, Geometry */
/*jslint sloppy: true */

/* import 'intersect.js' */
/* import 'settings.js' */

/* export */
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