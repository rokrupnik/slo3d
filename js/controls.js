var Controls = (function () {
    'use strict';

    // For button functionality see PointerLockControls
    var targetBackup = {};
    var viewModeIsActive = false;
    var onKeyDown = function ( event ) { // Enter view mode
        if (event.keyCode == 17) { // Ctrl
            viewModeIsActive = true;

            Controls.controls.target.x = Controls.camera.position.x -
                0.000001 * (Controls.camera.position.x - Controls.controls.target.x);
            Controls.controls.target.y = Controls.camera.position.y -
                0.000001 * (Controls.camera.position.y - Controls.controls.target.y);

            Controls.controls.target.z = Controls.camera.position.z;

            targetBackup.x = Controls.controls.target.x;
            targetBackup.y = Controls.controls.target.y;
            targetBackup.z = Controls.controls.target.z;
        }
    };

    var onKeyUp = function ( event ) { // Exit view mode
        if (event.keyCode == 17) { // Ctrl
            viewModeIsActive = false;

            projectTargetToPlane();
        }
    };

    /**
     *  Target projection to z=0 plane when we stop panning
     */
    var projectTargetToPlane = function (event) {
        var xc = Controls.camera.position.x,
            yc = Controls.camera.position.y,
            zc = Controls.camera.position.z,
            xt = Controls.controls.target.x,
            yt = Controls.controls.target.y,
            zt = Controls.controls.target.z;

        if (viewModeIsActive) { // View mode
            Controls.controls.target.x = targetBackup.x;
            Controls.controls.target.y = targetBackup.y;
        } else if (zt < zc) {
            var kz = (-zc) / (zt - zc);

            xt = kz * (xt - xc) + xc;
            yt = kz * (yt - yc) + yc;

            if (374000 < xt && xt < 630000 && 31000 < yt && yt < 164000) {
                Controls.controls.target.x = xt;
                Controls.controls.target.y = yt;
                Controls.controls.target.z = 0;
            }
        }
    };

    var initializeControls = function () {
        Controls.controls = new THREE.OrbitControls( Controls.camera, World.renderer.domElement );
        // Controls.controls.enableDamping = true;
        // Controls.controls.dampingFactor = 1.0;
        Controls.controls.enableZoom = true;

        Controls.controls.target = new THREE.Vector3( xOffset + (0.43 * worldWidth), yOffset + (0.33 * worldDepth), 0 );
    };

    var initializeCamera = function (x, y, z) {
        Controls.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 2000000 );

        Controls.camera.position.x = x;
        Controls.camera.position.y = y;
        Controls.camera.position.z = z;

        Controls.camera.up.set( 0, 0, 1 );
    };

    var requestCounter = 0;
    var preloader = document.getElementById('preloader');
    var signalRequestStart = function () {
        if (requestCounter == 0) {
            preloader.style.display = 'flex';
        }

        requestCounter += 1;
    }
    var signalRequestEnd = function () {
        requestCounter -= 1;

        if (requestCounter == 0) {
            preloader.style.display = 'none';
            requestCounter = 0;
        }
    }

    return {
        camera: null,
        controls: null,

        signalRequestStart: signalRequestStart,
        signalRequestEnd: signalRequestEnd,

        initializeControls: initializeControls,
        initializeCamera: initializeCamera,
        init: function () {
            document.body.addEventListener( 'mouseup', projectTargetToPlane, false );
            document.addEventListener('keydown', onKeyDown, false);
            document.addEventListener('keyup', onKeyUp, false);
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