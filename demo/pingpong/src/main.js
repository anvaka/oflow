var Scene = require('./scene.js');
var Game = require('./game.js');
var EventLoop = require('./eventLoop.js');
var ComputerController = require('./controllers/computerController.js');
var WebCamController = require('./controllers/webcamController.js');
var whenReady = require('./utils.js');

var UP_ARROW = 38, DOWN_ARROW = 40, KEY_W = 87, KEY_S = 83,
    scene = new Scene(document.getElementById('scene')),
    game = new Game(scene),
    eventLoop = new EventLoop(),
    leftController = new ComputerController(game.ball),
    rightController = new WebCamController();


eventLoop.onRender(function renderFrame() {
    if (!game.isOver()) {
        leftController.step();
        rightController.step();
        game.step();
    }
});

game.onOver(function() {
    leftController.dismount();
    rightController.dismount();
    eventLoop.stop();
});

leftController.mount(game.leftHandle);
rightController.mount(game.rightHandle);

whenReady(leftController, rightController).run(
    function () {
        eventLoop.start();
    }
);
