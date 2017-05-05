var Controls = (function () {
    'use strict';


    /**
     *  Target projection to z=0 plane when we stop panning
     */
    var projectTargetToPlane = function () {
        var xc = camera.position.x,
            yc = camera.position.y,
            zc = camera.position.z,
            xt = controls.target.x,
            yt = controls.target.y,
            zt = controls.target.z,
            kz = (-zc) / (zt - zc);

        controls.target.x = kz * (xt - xc) + xc;
        controls.target.y = kz * (yt - yc) + yc;
        controls.target.z = 0;
    };

    return {
        init: function () {
            document.body.addEventListener( 'mouseup', Controls.projectTargetToPlane, false );
        }
    };
})();

Controls.init();


// Movement restrictions

// var onmousewheel = function(event) {
//     var delta = event.detail ? event.detail*(-120) : event.wheelDelta;

//     // When zooming under 3000 meters, check if we are too close to terrain and disable zoom if we are
//     if (delta > 0) {
//         if (camera.position.z < 2900 && controls.enableZoom) {
//             var heightBelowCamera = Map.getHeightAtPosition(camera.position.x, camera.position.y);

//             // if (intersection.distance < 1000) {
//             //     controls.enableZoom = false;
//             // }
//         }
//     } else {
//         // Enable zoom if zooming out
//         if (!controls.enableZoom)
//             controls.enableZoom = true;
//     }

// };

// document.addEventListener( 'mousewheel', onmousewheel, false );
// document.addEventListener( 'DOMMouseScroll', onmousewheel, false ); // firefox