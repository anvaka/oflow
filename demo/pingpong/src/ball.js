/*jslint sloppy: true */

/* export Ball */
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