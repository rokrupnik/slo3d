clock = new THREE.Clock();

function init(heights, dataWidth, dataDepth, hmin, hmax) {
    Data.img = null;

    // worldDataWidth = dataWidth;
    // worldDataDepth = dataDepth;

    World.initializeScene();

    World.initializeRenderer();

    Controls.initializeCamera(
        xOffset + (0.43 * worldWidth),
        yOffset + (0.33 * worldDepth) - 1,
        worldHalfDepth
    );

    Controls.initializeControls();

    //

    Controls.signalRequestStart();
    Texture.loader.load(
        'data/2/374_31.png',
        function (bumpTexture) {
            Texture.loader.load(
                Texture.generateUrl(World.d96tm2d48gk([xOffset,yOffset]), World.d96tm2d48gk([xOffset + worldWidth,yOffset+worldDepth]), [2048, 2048], 'jpg'),
                function (ortofotoTexture) {
                    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;
                    // magnitude of normal displacement

                    var bumpScale   = 0.01;

                    // use "this." to create global object
                    this.customUniforms = {
                        bumpTexture:	{ type: "t", value: bumpTexture },
                        ortofotoTexture:	{ type: "t", value: ortofotoTexture },
                        bumpScale:	    { type: "f", value: bumpScale }
                    };

                    // create custom material from the shader code above
                    //   that is within specially labelled script tags
                    var customMaterial = new THREE.ShaderMaterial(
                    {
                        uniforms: customUniforms,
                        vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
                        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
                    }   );

                    var planeGeo = new THREE.PlaneGeometry( worldWidth, worldDepth, 512, 512 );
                    // Place origin at bottom left corner, rather than center
                    var m = new THREE.Matrix4();
                    m.makeTranslation( worldHalfWidth, worldHalfDepth, 0 );
                    planeGeo.applyMatrix( m );

                    var plane = new THREE.Mesh(	planeGeo, customMaterial );
                    //plane.rotation.x = -Math.PI / 2;
                    plane.position.x = xOffset;
                    plane.position.y = yOffset;
                    World.scene.add( plane );

                    // axes

                    // var axes = new THREE.AxisHelper( worldDepth );
                    // World.scene.add( axes );

                    container.innerHTML = "";

                    container.appendChild( World.renderer.domElement );

                    stats = new Stats();
                    container.appendChild( stats.dom );

                    //

                    window.addEventListener( 'resize', onWindowResize, false );

                    Controls.signalRequestEnd();

                    animate();
                }
            );
        }
    );
}

function onWindowResize() {

    Controls.camera.aspect = window.innerWidth / window.innerHeight;
    Controls.camera.updateProjectionMatrix();

    World.renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

    //LOD.update();

}

// var raycastCounter = 0;
function render() {
    // World.targetOnScreen.x = 0;
    // World.targetOnScreen.y = 0;

    // World.rayCaster.setFromCamera(World.targetOnScreen, Controls.camera);

    Controls.controls.update( clock.getDelta() );

    // World.scene.updateMatrixWorld();
    // World.scene.traverse( function ( object ) {

    //     if ( object instanceof THREE.LOD ) {

    //         object.update( Controls.camera );

    //         // if (raycastCounter == 0) {
    //         //     var intersects  = World.rayCaster.intersectObject(object);
    //         //     if (intersects.length > 0)
    //         //         console.log(object.id, intersects[0]);
    //         // }

    //     }

    // } );

    // raycastCounter = (raycastCounter + 1) % 20;

    World.renderer.render( World.scene, Controls.camera );

}

init();