/*global navigator, window */

var VideoFlow = require('./videoFlow');
module.exports = WebCamFlow;

/**
 * A high level interface to capture optical flow from the web camera.
 * @param defaultVideoTag {DOMElement} optional reference to <video> tag
 *   where web camera output should be rendered. If parameter is not
 *   present a new invisible <video> tag is created.
 * @param zoneSize {int} optional size of a flow zone in pixels. 8 by default
 * @param cameraFacing {string} optional direction camera is facing (either
 * 'user' or 'environment') used to give preference to a particular mobile
 * camera. If matching camera is not found, any available one will be used.
 *
 * Usage example:
 *  var flow = new WebCamFlow();
 *
 *  // Every time when optical flow is calculated
 *  // call the passed in callback:
 *  flow.onCalculated(function (direction) {
 *      // direction is an object which describes current flow:
 *      // direction.u, direction.v {floats} general flow vector
 *      // direction.zones {Array} is a collection of flowZones.
 *      //  Each flow zone describes optical flow direction inside of it.
 *  });
 *  // Starts capturing the flow from webcamera:
 *  flow.startCapture();
 *  // once you are done capturing call
 *  flow.stopCapture();
 */
function WebCamFlow(defaultVideoTag, zoneSize, cameraFacing, onFail) {
    var videoTag,
        isCapturing,
        localStream,
        calculatedCallbacks = [],
        selectedVideoSource,
        desiredDevice,
        videoFlow,
        onWebCamFail = function(e) {
            if(e.name === "NotAllowedError"){
                window.alert('You have denied access to your camera.');
            } else {
                window.alert('getUserMedia() is not supported in your browser.');
            }
            if (onFail) {
                onFail();
            }
        },
        onWebCamSucceed = function(stream) {
            isCapturing = true;
            localStream = stream;
            if ("srcObject" in videoTag) {
                videoTag.srcObject = stream;
            } else {
                videoTag.src = window.URL.createObjectURL(stream);
            }
            if (stream) {
                videoTag.play();
                videoFlow.startCapture(videoTag);
                videoFlow.onCalculated(gotFlow);
            }
        },
        gotFlow = function(direction) {
            calculatedCallbacks.forEach(function (callback) {
                callback(direction);
            });
        },
        initCapture = function() {
        if (!videoFlow) {
            videoTag = defaultVideoTag || window.document.createElement('video');
            videoTag.setAttribute('autoplay', true);
            videoFlow = new VideoFlow(videoTag, zoneSize);
        }

        if (window.MediaStreamTrack.getSources) {
            window.MediaStreamTrack.getSources(function(sourceInfos) {
                for (var i = 0; i < sourceInfos.length; i++) {
                    if (sourceInfos[i].kind === 'video'){
                        selectedVideoSource = sourceInfos[i].id;
                        // if camera facing requested direction is found, stop search
                        if (sourceInfos[i].facing === cameraFacing) {
                            break;
                        }
                    }
                }

                desiredDevice = { optional: [{sourceId: selectedVideoSource}] };
                navigator.mediaDevices.getUserMedia({ video: desiredDevice })
                    .then(onWebCamSucceed)
                    .catch(onWebCamFail);
            });
        } else if(navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(
                function(sourceInfos){
                    for (var i = 0; i < sourceInfos.length; i++) {
                        if(sourceInfos[i].kind == "videoinput"){
                            selectedVideoSource = sourceInfos[i].deviceId;
                        }
                    }
                    
                    desiredDevice = { optional: [{sourceId: selectedVideoSource}] };
                    navigator.mediaDevices.getUserMedia({ video: desiredDevice })
                        .then(onWebCamSucceed)
                        .catch(onWebCamFail);
                }
            );
        }
    }

    // our public API
    this.startCapture = function () {
        if (!isCapturing) {
            initCapture();
        }
    };
    this.onCalculated = function (callback) {
        calculatedCallbacks.push(callback);
    };
    this.stopCapture = function() {
        isCapturing = false;
        if (videoFlow) { videoFlow.stopCapture(); }
        if (videoTag) { videoTag.pause(); }
        if (localStream) { localStream.stop(); }
    };
}
