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

function init() {

    World.initializeScene();

    World.initializeRenderer();

    Controls.initializeCamera(
        World.offset.x + (0.43 * World.size.x),//World.center.x,//0,//
        World.offset.y + (0.33 * World.size.y),//World.center.y,//0,//
        World.size.y * 0.6
    );

    Controls.initializeControls();

    //

    // Controls.signalRequestStart();
    Texture.loader.load(
        'data/2/374_31.png',
        function (initialHeightMap) {
            Texture.loader.load(
                Texture.generateUrl([World.offset.x,World.offset.y], [(World.offset.x + World.size.x),(World.offset.y+World.size.y)], [2048, 2048]),
                function (ortoFotoTexture) {
                    var createTile = function ( x, y, scale, edgeMorph ) {
                        var terrainMaterial = createTerrainMaterial(
                            initialHeightMap,
                            World.center,
                            World.cameraOffset,
                            new THREE.Vector2( x, y ),
                            scale,
                            resolution,
                            edgeMorph
                        );
                        var plane = new THREE.Mesh( tileGeometry, terrainMaterial );

                        // Disable frustum culling to prevent the mesh from dissappearing at certain angles
                        // See: https://stackoverflow.com/questions/21184061/mesh-suddenly-disappears-in-three-js-clipping
                        plane.frustumCulled = false;

                        World.terrain.add( plane );
                    };
                    var createRoughTile = function ( x, y, scale ) {

                        var roughTerrainMaterial = createRoughTerrainMaterial(
                            initialHeightMap,
                            World.center,
                            World.roughCameraOffset,
                            new THREE.Vector2( x, y ),
                            scale,
                            resolution
                        );

                        var roughPlane = new THREE.Mesh( roughTileGeometry, roughTerrainMaterial );
                        roughPlane.frustumCulled = false;

                        World.roughTerrain.add( roughPlane );

                        LOD.handleLoadedHeightMap(11, scale, World.center.x + x, World.center.y + y, roughTerrainMaterial.uniforms, 100, 2)(initialHeightMap);                        
                    };

                    var createTerrainMaterial = function( heightMap, globalOffset, cameraOffset, offset, scale, resolution, edgeMorph ) {
                        return new THREE.ShaderMaterial({
                            uniforms: {
                                uEdgeMorph: { value: edgeMorph },
                                uGlobalOffset: { value: globalOffset },
                                uCameraOffset: { value: cameraOffset },
                                uTileOffset: { value: offset },
                                uScale: { value: scale * LOD.TILE_SCALE },
                                uTileHeightMap: { value: heightMap },
                                uTileOrtoFoto: { value: ortoFotoTexture },
                                // Add flags for switching between global and tile textures
                                uGlobalTexturesActive: { value: true },
                                uTileTexturesActive: { value: false }
                            },
                            defines: {
                                TILE_RESOLUTION: resolution,
                                TILE_SCALE: LOD.TILE_SCALE,
                                WORLD_WIDTH: World.size.x,
                            },
                            vertexShader: document.getElementById( 'vertexShader'   ).textContent,
                            fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
                            //wireframe: true
                        });
                    };

                    var createRoughTerrainMaterial = function( heightMap, globalOffset, cameraOffset, offset, scale, resolution ) {
                        return new THREE.ShaderMaterial({
                            uniforms: {
                                uGlobalOffset: { value: globalOffset },
                                uCameraOffset: { value: cameraOffset },
                                uTileOffset: { value: offset },
                                uScale: { value: scale },
                                // Add heightMap and ortofoto for global and tile textures
                                uGlobalHeightMap: { value: heightMap },
                                uGlobalOrtoFoto: { value: ortoFotoTexture },
                                uTileHeightMap: { value: heightMap },
                                uTileOrtoFoto: { value: ortoFotoTexture },
                                // Add flags for switching between global and tile textures
                                uGlobalTexturesActive: { value: true },
                                uTileTexturesActive: { value: false }
                            },
                            defines: {
                                TILE_RESOLUTION: resolution,
                                TILE_SCALE: LOD.TILE_SCALE,
                                WORLD_WIDTH: World.size.x,
                            },
                            vertexShader: document.getElementById( 'roughVertexShader'   ).textContent,
                            fragmentShader: document.getElementById( 'roughFragmentShader' ).textContent,
                            //wireframe: true
                        });
                    };

                    var resolution = 128;
                    var roughResolution = 64;

                    // Offset is used to re-center the terrain, this way we get the greates detail
                    // nearest to the camera. In the future, should calculate required detail level per tile
                    World.cameraOffset = new THREE.Vector2(0, 0);
                    World.roughCameraOffset = new THREE.Vector2(0, 0);

                    // Create geometry that we'll use for each tile, just a standard plane
                    var tileGeometry = new THREE.PlaneGeometry( 1, 1, resolution, resolution );
                    var roughTileGeometry = new THREE.PlaneGeometry( 1, 1, roughResolution, roughResolution );
                    // Place origin at bottom left corner, rather than center
                    var m = new THREE.Matrix4();
                    m.makeTranslation( 0.5, 0.5, 0 );
                    tileGeometry.applyMatrix( m );
                    roughTileGeometry.applyMatrix( m );

                    // Create collection of tiles to fill required space
                    var initialScale = 1000;

                    // Create center layer first
                    //    +---+
                    //    | C |
                    //    +---+
                    createTile(-initialScale/2, -initialScale/2, initialScale, Edge.NONE);

                    // Create a tree of tiles, with smallest in center
                    // Each added layer consists of the following tiles (marked with numbers), with the tiles
                    // in the middle being created in previous layers
                    // and the tiles on the edge being created in next layers
                    // +---+---+---+---+---+---+---+---+---+
                    // |           |           |           |
                    // +           +           +           +
                    // |    ...    |    ...    |    ...    |
                    // +           +           +           +
                    // |           |           |           |
                    // +---+---+---+---+---+---+---+---+---+
                    // |           | 3 | 5 | 8 |           |
                    // +           +---+---+---+           +
                    // |    ...    | 2 |   | 7 |    ...    |
                    // +           +---+---+---+           +
                    // |           | 1 | 4 | 6 |           |
                    // +---+---+---+---+---+---+---+---+---+
                    // |           |           |           |
                    // +           +           +           +
                    // |    ...    |    ...    |    ...    |
                    // +           +           +           +
                    // |           |           |           |
                    // +---+---+---+---+---+---+---+---+---+
                    // var serverSideLevel = 10;
                    for (var scale = initialScale; scale < World.size.x; scale *= 3) {
                        createTile(-scale - scale/2, -scale -  scale/2, scale, Edge.NONE);
                        createTile(-scale - scale/2, -scale/2, scale, Edge.NONE);
                        createTile(-scale - scale/2, scale/2, scale, Edge.NONE); 
    
                        createTile(-scale/2, -scale -  scale/2, scale, Edge.NONE);
                        createTile(-scale/2, scale/2, scale, Edge.NONE); 
    
                        createTile(scale/2, -scale -  scale/2, scale, Edge.NONE);
                        createTile(scale/2, -scale/2, scale, Edge.NONE);
                        createTile(scale/2, scale/2, scale, Edge.NONE);
                    }

                    // Create rough tiles
                    var roughTileScale = 25600;

                    for (var yRough = -(World.size.y/2); yRough <= World.size.y/2; yRough += roughTileScale) {
                        for (xRough = -(World.size.x/2); xRough <= World.size.x/2; xRough += roughTileScale) {
                            // console.log(xRough, yRough);
                            createRoughTile( xRough, yRough, roughTileScale )
                        }
                    }

                    World.terrain.visible = false;
                    World.scene.add(World.terrain);
                    World.scene.add(World.roughTerrain);

                    // axes

                    // var axes = new THREE.AxisHelper( World.size.y );
                    // World.scene.add( axes );

                    container.innerHTML = "";

                    container.appendChild( World.renderer.domElement );

                    stats = new Stats();
                    container.appendChild( stats.dom );

                    //

                    window.addEventListener( 'resize', onWindowResize, false );

                    // Controls.signalRequestEnd();

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
}

function render() {
    Controls.controls.update( clock.getDelta() );

    
    if (!Controls.movementInProgress && !Controls.viewModeIsActive) {
        
        // Check if we have moved enough from last LOD update position
        if (
            Math.abs(LOD.lastLoadingCoordinates.x - Controls.controls.target.x) > LOD.levels[LOD.level].dimension ||
            Math.abs(LOD.lastLoadingCoordinates.y - Controls.controls.target.y) > LOD.levels[LOD.level].dimension
        ) {
            Controls.movingDisabled = false;
            LOD.tooCloseToLastLODUpdate = false;
        }

        // Main terrain movement
        if (!Controls.movingDisabled) {
            Controls.updateTilesLocation(World.terrain);
        }

        // Rough terrain movement - always update its location
        //Controls.updateTilesLocation(World.roughTerrain);

        LOD.throttledUpdate();
    }

    World.renderer.render( World.scene, Controls.camera );
        
}

init();