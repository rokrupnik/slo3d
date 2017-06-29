var Controls = (function () {
    'use strict';


    /**
     *  Target projection to z=0 plane when we stop panning
     */
    var projectTargetToPlane = function () {
        var xc = Controls.camera.position.x,
            yc = Controls.camera.position.y,
            zc = Controls.camera.position.z,
            xt = Controls.controls.target.x,
            yt = Controls.controls.target.y,
            zt = Controls.controls.target.z,
            kz = (-zc) / (zt - zc);

        Controls.controls.target.x = kz * (xt - xc) + xc;
        Controls.controls.target.y = kz * (yt - yc) + yc;
        Controls.controls.target.z = 0;
    };

    var initializeControls = function () {
        Controls.controls = new THREE.OrbitControls( Controls.camera, World.renderer.domElement );
        // Controls.controls.enableDamping = true;
        // Controls.controls.dampingFactor = 1.0;
        Controls.controls.enableZoom = true;

        Controls.controls.target = new THREE.Vector3( xOffset + (0.43 * worldWidth), yOffset + (0.33 * worldDepth), 0 );
    };

    var initializeCamera = function (x, y, z) {
        Controls.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 200000 );

        Controls.camera.position.x = x;
        Controls.camera.position.y = y;
        Controls.camera.position.z = z;

        Controls.camera.up.set( 0, 0, 1 );
    };

    return {
        camera: null,
        controls: null,

        initializeControls: initializeControls,
        initializeCamera: initializeCamera,
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