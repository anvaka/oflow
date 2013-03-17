oflow.js - optical flow detection in JavaScript
===============================================
I made this little toy just for fun when I was traveling and had really long flight. The library allows you to detect optical flow in a video.

Here is an [optical flow detection demo](http://anvaka.github.com/oflow/demo/raw/index.html) which lets you to control a ball and see movements in each zone of the video.

And this little [Ping Pong game](http://anvaka.github.com/oflow/demo/pingpong/index.html) was also created on a plane. Right bar is controlled by the webcamera. Move your hand slowly up and down, to change the position of the right bar. Just moe your hands slowly do it gradually. Left bar is controlled by computer. 

I didn't have time to do the 'tutorial' or proper error handling, I'm sorry if it wouldn't work for you. Please [let me know](mailto:anvaka@gmail.com).

Usage
-----
Include [/dist/oflow.js](https://github.com/anvaka/oflow/blob/master/dist/oflow.js) into your page.

To detect flow from the webcamera:
```javascript
var flow = new oflow.WebCamFlow();
// Every time when optical flow is calculated
// call the passed in callback:
flow.onCalculated(function (direction) {
    // direction is an object which describes current flow:
    // direction.u, direction.v {floats} general flow vector
    // direction.zones {Array} is a collection of flowZones. 
    // Each flow zone describes optical flow direction inside of it.
    // flowZone : {
    //  x, y // zone center
    //  u, v // vector of flow in the zone
    // }
});
// Starts capturing the flow from webcamera:
flow.startCapture();
// once you are done capturing call
flow.stopCapture();
```
To detect flow from ```<video>``` element:
```javascript
var flow = new oflow.VideoFlow(videoDomElement);
// the remaining API is the same as in the WebCamFlow exapmle above.
```

```videoDomElement``` is required argument.
