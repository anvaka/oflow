/*jslint plusplus: true, sloppy: true */

var Handle = require('./handle.js');
var Ball = require('./ball.js');
var settings = require('./settings.js');
var Geometry = require('./intersect.js');

module.exports = Game;

/**
 * Ping Pong game model
 **/
function Game(scene) {
    var isOver = false,
        overCallbacks = [],
        cachedPos = new Geometry.Point(),
        ball = new Ball(scene),

        gameOver = function (side) {
            var i;
            isOver = true;
            for (i = 0; i < overCallbacks.length; ++i) {
                overCallbacks[i](side);
            }
        };

    this.leftHandle = new Handle(true, scene);
    this.rightHandle = new Handle(false, scene);
    this.ball = ball;

    this.step =  function () {
        if (isOver) {
            return;
        }
        ball.move();
        var outSide = ball.isOut();
        if (this.leftHandle.hit(ball)) {
            cachedPos.x = settings.handleWidth;
            cachedPos.y = ball.y;
            ball.setPosition(cachedPos);
            ball.vx = -ball.vx;
        } else if (this.rightHandle.hit(ball)) {
            cachedPos.x = this.rightHandle.x;
            cachedPos.y = ball.y;
            ball.setPosition(cachedPos);
            ball.vx = -ball.vx;
        } else if (outSide) {
            gameOver(outSide);
        }

        scene.render(this.leftHandle, this.rightHandle, ball);
    };
    this.isOver = function () {
        return isOver;
    };
    this.onOver = function (callback) {
        if (typeof callback === 'function') {
            overCallbacks.push(callback);
        }
    };
}
