/*global Scene, Game, EventLoop, ComputerController, WebCamController, whenReady*/
/* import 'utils.js' */
/* import 'scene.js' */
/* import 'game.js' */
/* import 'eventLoop.js' */
/* import 'controllers/computerController.js' */
/* import 'controllers/webcamController.js' */
/* import 'controllers/keyboardController.js' */

var UP_ARROW = 38, DOWN_ARROW = 40, KEY_W = 87, KEY_S = 83,
    scene = new Scene(document.getElementById('scene')),
    game = new Game(scene),
    eventLoop = new EventLoop(),
    leftController = new ComputerController(game.ball),
// rightController = new KeyboardController(UP_ARROW, DOWN_ARROW),
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
