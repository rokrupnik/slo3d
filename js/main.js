clock = new THREE.Clock();
// Tiles that sit next to a tile of a greater scale need to have their edges morphed to avoid
// edges. Mark which edges need morphing using flags. These flags are then read by the vertex
// shader which performs the actual morph
var Edge = {
    NONE: 0,
    TOP: 1,
    LEFT: 2,
    BOTTOM: 4,
    RIGHT: 8
};

function init(heights, dataWidth, dataDepth, hmin, hmax) {
    Data.img = null;

    // worldDataWidth = dataWidth;
    // worldDataDepth = dataDepth;

    World.initializeScene();

    World.initializeRenderer();

    Controls.initializeCamera(
        0,//xOffset + worldHalfWidth,//xOffset + (0.43 * worldWidth),//
        0,//yOffset + worldHalfDepth,//yOffset + (0.33 * worldDepth),//
        50000//worldDepth + worldHalfDepth
    );

    Controls.initializeControls();

    //

    Controls.signalRequestStart();
    Texture.loader.load(
        'data/2/374_31.png',
        function (bumpTexture) {
            Texture.loader.load(
                Texture.generateUrl(World.d96tm2d48gk([xOffset,yOffset]), World.d96tm2d48gk([(xOffset + worldWidth),(yOffset+worldDepth)]), [2048, 2048], 'jpg'),
                function (ortofotoTexture) {

                    var createTile = function ( x, y, scale, edgeMorph ) {
                        var terrainMaterial = createTerrainMaterial( bumpTexture,
                                                                        globalOffset,
                                                                        new THREE.Vector2( x, y ),
                                                                        scale,
                                                                        resolution,
                                                                        edgeMorph );
                        var plane = new THREE.Mesh( tileGeometry, terrainMaterial );
                        World.scene.add( plane );
                    };

                    var createTerrainMaterial = function( heightData, globalOffset, offset, scale, resolution, edgeMorph ) {
                        // Is it bad to change this for every tile?
                        //terrainVert.define( "TILE_RESOLUTION", resolution.toFixed(1) );
                        return new THREE.ShaderMaterial( {//THREE.MeshLambertMaterial({//
                            uniforms: {
                                uEdgeMorph: { type: "i", value: edgeMorph },
                                uGlobalOffset: { type: "v3", value: globalOffset },
                                uHeightData: { type: "t", value: heightData },
                                //uGrass: { type: "t", value: texture.grass },
                                uOrtoFoto: { type: "t", value: ortofotoTexture },
                                //uSnow: { type: "t", value: texture.snow },
                                uTileOffset: { type: "v2", value: offset },
                                uScale: { type: "f", value: scale }
                            },
                            vertexShader: document.getElementById( 'vertexShader'   ).textContent,
                            fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
                            //transparent: true
                            //wireframe: true
                        } );
                    };

                    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;

                    var levels = 9;
                    var resolution = 32;

                    // Offset is used to re-center the terrain, this way we get the greates detail
                    // nearest to the camera. In the future, should calculate required detail level per tile
                    var globalOffset = new THREE.Vector3( 0, 0, 0); //xOffset + worldHalfWidth, yOffset + worldHalfDepth, 0 );//

                    // Create geometry that we'll use for each tile, just a standard plane
                    var tileGeometry = new THREE.PlaneGeometry( 1, 1, resolution, resolution );
                    // Place origin at bottom left corner, rather than center
                    var m = new THREE.Matrix4();
                    m.makeTranslation( 0.5, 0.5, 0 );
                    tileGeometry.applyMatrix( m );

                    // Create collection of tiles to fill required space
                    var initialScale = worldWidth / Math.pow( 2, levels );

                    // Create center layer first
                    //    +---+---+
                    //    | O | O |
                    //    +---+---+
                    //    | O | O |
                    //    +---+---+
                    createTile(-initialScale, -initialScale, initialScale, Edge.NONE);
                    createTile(-initialScale, 0, initialScale, Edge.NONE);
                    createTile(0, 0, initialScale, Edge.NONE);
                    createTile(0, -initialScale, initialScale, Edge.NONE);

                    // Create "quadtree" of tiles, with smallest in center
                    // Each added layer consists of the following tiles (marked 'A'), with the tiles
                    // in the middle being created in previous layers
                    // +---+---+---+---+
                    // | A | A | A | A |
                    // +---+---+---+---+
                    // | A |   |   | A |
                    // +---+---+---+---+
                    // | A |   |   | A |
                    // +---+---+---+---+
                    // | A | A | A | A |
                    // +---+---+---+---+
                    for (var scale = initialScale; 4 * scale <= worldWidth; scale *= 2) {
                        createTile( -2 * scale, -2 * scale, scale, Edge.BOTTOM | Edge.LEFT );
                        createTile( -2 * scale, -scale, scale, Edge.LEFT );
                        createTile( -2 * scale, 0, scale, Edge.LEFT );
                        createTile( -2 * scale, scale, scale, Edge.TOP | Edge.LEFT );

                        createTile( -scale, -2 * scale, scale, Edge.BOTTOM );
                        // 2 tiles 'missing' here are in previous layer
                        createTile( -scale, scale, scale, Edge.TOP );

                        createTile( 0, -2 * scale, scale, Edge.BOTTOM );
                        // 2 tiles 'missing' here are in previous layer
                        createTile( 0, scale, scale, Edge.TOP );

                        createTile( scale, -2 * scale, scale, Edge.BOTTOM | Edge.RIGHT );
                        createTile( scale, -scale, scale, Edge.RIGHT );
                        createTile( scale, 0, scale, Edge.RIGHT );
                        createTile( scale, scale, scale, Edge.TOP | Edge.RIGHT );

                        // resolution /= 2;
                        // tileGeometry = new THREE.PlaneGeometry( 1, 1, resolution, resolution );
                    }

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
    //console.log(Controls.controls.target, Controls.camera.position);

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