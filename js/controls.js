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

            // Only change target coordinates if they are inside the World.size dimensions, centered at the camera
            if ((xc - World.size.x/2) < xt && xt < (xc + World.size.x/2) && (yc - World.size.y/2) < yt && yt < (yc + World.size.y/2)) {
                Controls.controls.target.x = xt;
                Controls.controls.target.y = yt;
                Controls.controls.target.z = 0;
            }
        }
    };

    var initializeCamera = function (x, y, z) {
        Controls.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, World.size.y + World.size.y/2 );

        Controls.camera.position.x = x;
        Controls.camera.position.y = y;
        Controls.camera.position.z = z;

        Controls.camera.up.set( 0, 0, 1 );
    };

    var initializeControls = function () {
        Controls.controls = new THREE.OrbitControls( Controls.camera, World.renderer.domElement );
        // Controls.controls.enableDamping = true;
        // Controls.controls.dampingFactor = 1.0;
        Controls.controls.enableZoom = true;

        Controls.controls.target = new THREE.Vector3( Controls.camera.position.x, Controls.camera.position.y + 0.0001, 0 );
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
        movementInProgress: false,

        camera: null,
        controls: null,

        signalRequestStart: signalRequestStart,
        signalRequestEnd: signalRequestEnd,

        initializeControls: initializeControls,
        initializeCamera: initializeCamera,
        init: function () {
            document.body.addEventListener( 'mousedown', function () { Controls.movementInProgress = true; }, false );
            document.body.addEventListener( 'mouseup', function () { Controls.movementInProgress = false; }, false );

            document.body.addEventListener( 'mouseup', projectTargetToPlane, false );

            document.addEventListener('keydown', onKeyDown, false);
            document.addEventListener('keyup', onKeyUp, false);
        }
    };
})();

Controls.init();