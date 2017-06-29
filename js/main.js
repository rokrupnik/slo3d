clock = new THREE.Clock();

function init(heights, dataWidth, dataDepth, hmin, hmax) {
    Data.img = null;

    worldDataWidth = dataWidth;
    worldDataDepth = dataDepth;

    World.initializeScene();

    World.initializeRenderer();

    Controls.initializeCamera(
        xOffset + (0.43 * worldWidth),
        yOffset + (0.33 * worldDepth) - 1,
        heights[ (dataWidth / 2) * dataWidth + (dataDepth / 2) ] + 0.66 * worldDepth
    );

    Controls.initializeControls();

    //

    var widthScale = worldWidth / dataWidth;
    var depthScale = worldDepth / dataDepth;
    var blockWidth = blockDepth = 8000;
    var dataBlockWidth = (blockWidth / widthScale);
    var dataBlockDepth = (blockDepth / depthScale);

    var blockMesh = null, blockGeometry = null, blockMaterial = null, blockLod = null;

    var pA = new THREE.Vector3();
    var pB = new THREE.Vector3();
    var pC = new THREE.Vector3();
    var pD = new THREE.Vector3();
    var cb = new THREE.Vector3();
    var ab = new THREE.Vector3();
    var db = new THREE.Vector3();

    var drawBlock = function (wBlock, dBlock) {
        var blockHasData = false, blockHasEmptyPixels = false, blockHasCorruptedPixels = false;
        var x0 = xOffset + wBlock * widthScale;
        var y0 = yOffset + (worldDepth - (dBlock * depthScale)) - blockDepth;
        var x1 = x0 + blockWidth;
        var y1 = y0 + blockDepth;

        var dStart = 0, wStart = 0;
        var dStop = dataBlockDepth, wStop = dataBlockWidth;
        var dSquares = dataBlockDepth, wSquares = dataBlockWidth;

        // Add some more squares on the edges of interior blocks for stiching
        if (dBlock > 0) {
            dStart = -1;
            dSquares += 1;
        }
        if (wBlock > 0) {
            wStart = -1;
            wSquares += 1;
        }

        if ((dBlock + dataBlockDepth) < dataDepth) {
            dStop += 1;
            dSquares += 1;
        }
        if ((wBlock + dataBlockWidth) < dataWidth) {
            wStop += 1;
            wSquares += 1;
        }

        var triangles = (dSquares) * (wSquares) * 2;

        var indices = new Uint32Array( triangles * 3 );
        for ( var i = 0; i < indices.length; i ++ ) {
            indices[ i ] = i;
        }
        var positions = new Float32Array( triangles * 3 * 3 );
        var normals = new Int16Array( triangles * 3 * 3 );
        var uvs = new Float32Array( triangles * 3 * 2 );

        for (var d = dStart, ipnc = 0, iuv = 0; d < dStop; d++) {
            for (var w = wStart; w < wStop; w++) {
                var ih = (d +  dBlock) * dataDepth + (w + wBlock);

                var ax = w                              * widthScale - (blockWidth / 2);
                var ay = (dataBlockDepth - d)           * depthScale - (blockDepth / 2);
                var az = (heights[ ih ]);
                var bx = w                              * widthScale - (blockWidth / 2);
                var by = (dataBlockDepth - (d + 1))     * depthScale - (blockDepth / 2);
                var bz = (heights[ ih + dataWidth ]);
                var cx = (w + 1)                        * widthScale - (blockWidth / 2);
                var cy = (dataBlockDepth - d)           * depthScale - (blockDepth / 2);
                var cz = (heights[ ih + 1 ]);
                var dx = (w + 1)                        * widthScale - (blockWidth / 2);
                var dy = (dataBlockDepth - (d + 1))     * depthScale - (blockDepth / 2);
                var dz = (heights[ ih + dataWidth + 1 ]);

                if (az == 0 && bz == 0 && cz == 0 && dz == 0) {
                    // Ignore areas without data
                    blockHasEmptyPixels = true;
                    continue;
                } else if (az > 2865 || bz > 2865 || cz > 2865 || dz > 2865) {
                    // Ignore areas with unrealistic heights
                    blockHasCorruptedPixels = true;
                    continue;
                } else {
                    blockHasData = true;
                }

                // First triangle - mind the triangles orientation
                positions[ ipnc ]     = ax;
                positions[ ipnc + 1 ] = ay;
                positions[ ipnc + 2 ] = az;
                positions[ ipnc + 3 ] = bx;
                positions[ ipnc + 4 ] = by;
                positions[ ipnc + 5 ] = bz;
                positions[ ipnc + 6 ] = cx;
                positions[ ipnc + 7 ] = cy;
                positions[ ipnc + 8 ] = cz;
                // Second triangle
                positions[ ipnc + 9 ]  = bx;
                positions[ ipnc + 10 ] = by;
                positions[ ipnc + 11 ] = bz;
                positions[ ipnc + 12 ] = dx;
                positions[ ipnc + 13 ] = dy;
                positions[ ipnc + 14 ] = dz;
                positions[ ipnc + 15 ] = cx;
                positions[ ipnc + 16 ] = cy;
                positions[ ipnc + 17 ] = cz;

                // flat face normals
                pA.set( ax, ay, az );
                pB.set( bx, by, bz );
                pC.set( cx, cy, cz );
                pD.set( dx, dy, dz );
                // First triangle
                cb.subVectors( pC, pB );
                ab.subVectors( pA, pB );
                ab.cross( cb );
                ab.normalize();
                var nx0 = ab.x;
                var ny0 = ab.y;
                var nz0 = ab.z;
                normals[ ipnc ]     = nx0 * 32767;
                normals[ ipnc + 1 ] = ny0 * 32767;
                normals[ ipnc + 2 ] = nz0 * 32767;
                normals[ ipnc + 3 ] = nx0 * 32767;
                normals[ ipnc + 4 ] = ny0 * 32767;
                normals[ ipnc + 5 ] = nz0 * 32767;
                normals[ ipnc + 6 ] = nx0 * 32767;
                normals[ ipnc + 7 ] = ny0 * 32767;
                normals[ ipnc + 8 ] = nz0 * 32767;
                // Second triangle
                db.subVectors( pD, pB );
                cb.subVectors( pC, pB );
                cb.cross( db );
                cb.normalize();
                var nx1 = cb.x;
                var ny1 = cb.y;
                var nz1 = cb.z;
                normals[ ipnc + 9 ]  = nx1 * 32767;
                normals[ ipnc + 10 ] = ny1 * 32767;
                normals[ ipnc + 11 ] = nz1 * 32767;
                normals[ ipnc + 12 ] = nx1 * 32767;
                normals[ ipnc + 13 ] = ny1 * 32767;
                normals[ ipnc + 14 ] = nz1 * 32767;
                normals[ ipnc + 15 ] = nx1 * 32767;
                normals[ ipnc + 16 ] = ny1 * 32767;
                normals[ ipnc + 17 ] = nz1 * 32767;

                // uvs
                // First triangle
                uvs[ iuv ]     = w  / dataBlockWidth;
                uvs[ iuv + 1 ] = d / dataBlockDepth;
                uvs[ iuv + 2 ] = w  / dataBlockWidth;
                uvs[ iuv + 3 ] = (d + 1) / dataBlockDepth;
                uvs[ iuv + 4 ] = (w + 1)  / dataBlockWidth;
                uvs[ iuv + 5 ] = d / dataBlockDepth;
                // Second triangle
                uvs[ iuv + 6 ]  = (w + 1)  / dataBlockWidth;
                uvs[ iuv + 7 ]  = d / dataBlockDepth;
                uvs[ iuv + 8 ]  = w  / dataBlockWidth;
                uvs[ iuv + 9 ]  = (d + 1) / dataBlockDepth;
                uvs[ iuv + 10 ] = (w + 1)  / dataBlockWidth;
                uvs[ iuv + 11 ] = (d + 1) / dataBlockDepth;

                ipnc += 18;
                iuv += 12;
            }
        }

        if (blockHasData) {
            Controls.signalRequestStart();
            Texture.loader.load(
                Texture.generateUrl(World.d96tm2d48gk([x0,y0]), World.d96tm2d48gk([x1,y1]), [128, 128], 'jpg'),
                (function (x, y, positions, normals, uvs) {
                    return function (texture) {
                        // Create mesh and lod and add them to the scene
                        blockGeometry = new THREE.BufferGeometry();
                        blockGeometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
                        blockGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
                        blockGeometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3, true ) );
                        blockGeometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
                        //blockGeometry = new THREE.PlaneGeometry( blockWidth, blockDepth, dataBlockWidth, dataBlockDepth );

                        texture.flipY = false;
                        blockMaterial = new THREE.MeshLambertMaterial( {
                            //side: THREE.DoubleSide ,
                            //vertexColors: THREE.FaceColors,
                            shading: THREE.FlatShading,
                            map: texture
                        } );

                        blockLod = new THREE.LOD();

                        blockMesh = new THREE.Mesh( blockGeometry, blockMaterial );
                        // blockMesh.scale.set( 1.5, 1.5, 1.5 );
                        blockMesh.updateMatrix();
                        blockMesh.matrixAutoUpdate = false;
                        blockLod.addLevel( blockMesh, 64000 );

                        blockLod.position.x = x + (blockWidth / 2);
                        blockLod.position.y = y + (blockDepth / 2);
                        blockLod.position.z = 0;
                        blockLod.updateMatrix();
                        blockLod.matrixAutoUpdate = false;

                        World.scene.add( blockLod );
                        lods[x + '_' + y] = blockLod;

                        Controls.signalRequestEnd();
                    };
                })(x0, y0, positions, normals, uvs),
                undefined,
                function () {
                    // Signal request end even if request fails
                    Controls.signalRequestEnd();
                }
            );
        }

        return blockHasData;
    }

    var start = performance.now();

    for (var dBlock = 0; dBlock < dataDepth; dBlock += dataBlockDepth) {
        for (var wBlock = 0; wBlock < dataWidth; wBlock += dataBlockWidth) {
            drawBlock(dBlock, wBlock);
        }
    }

    console.log('basic mesh', performance.now() - start);

    //geometry.computeBoundingSphere();

    // axes

    // var axes = new THREE.AxisHelper( worldDepth );
    // World.scene.add( axes );

    // mesh

    // baseMesh = new THREE.Mesh( geometry, material );
    // World.scene.add( baseMesh );

    container.innerHTML = "";

    container.appendChild( World.renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );

    //

    window.addEventListener( 'resize', onWindowResize, false );

    animate();
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

    LOD.update();

}

// var raycastCounter = 0;
function render() {
    // World.targetOnScreen.x = 0;
    // World.targetOnScreen.y = 0;

    // World.rayCaster.setFromCamera(World.targetOnScreen, Controls.camera);

    Controls.controls.update( clock.getDelta() );

    World.scene.updateMatrixWorld();
    World.scene.traverse( function ( object ) {

        if ( object instanceof THREE.LOD ) {

            object.update( Controls.camera );

            // if (raycastCounter == 0) {
            //     var intersects  = World.rayCaster.intersectObject(object);
            //     if (intersects.length > 0)
            //         console.log(object.id, intersects[0]);
            // }

        }

    } );

    // raycastCounter = (raycastCounter + 1) % 20;

    World.renderer.render( World.scene, Controls.camera );

}