var Data = (function () {
    'use strict';

    var onInitialDataLoad = function () {
        worldData = getHeights(Data.img);

        Data.baseLevel = {
            heights: worldData,
            dataWidth: Data.img.width,
            xOffset: xOffset,
            yOffset: yOffset,
            level: 6,
            worldWidth: worldWidth,
            worldDepth: worldDepth
        };

        Data.loadingInProgress = false;

        init(worldData, Data.img.width, Data.img.height, Data.hmin, Data.hmax);
    };

    var nearestPow2 = function( aSize ){
        return Math.pow( 2, Math.round( Math.log( aSize ) / Math.log( 2 ) ) );
    };

    var onDataLoad = function () {
        var hmin = Data.hmin,
            hmax = Data.hmax;

        var fileNameData = parseImageFileName(Data.img.src);

        Data.nextLevel.heights = getHeights(Data.img);
        Data.nextLevel.dataWidth = Data.img.width;
        Data.nextLevel.xOffset = fileNameData.x;
        Data.nextLevel.yOffset = fileNameData.y;
        Data.nextLevel.level = fileNameData.level;
        Data.nextLevel.worldWidth = LOD.getLevelDimension(fileNameData.level);
        Data.nextLevel.halfWidth = Math.floor(Data.nextLevel.worldWidth / 2);
        Data.nextLevel.center.x = Data.nextLevel.xOffset + Data.nextLevel.halfWidth;
        Data.nextLevel.center.y = Data.nextLevel.yOffset + Data.nextLevel.halfWidth;
        Data.nextLevel.lodDistance = LOD.getLevelDistance(fileNameData.level);

        var dataWidth = Data.nextLevel.dataWidth;
        var dataDepth = dataWidth;
        var worldWidth = Data.nextLevel.worldWidth;
        var worldDepth = worldWidth;

        var heights = Data.nextLevel.heights;

        var widthScale = worldWidth / dataWidth;
        var depthScale = worldDepth / dataDepth;

        var blockWidth = blockDepth = 8000;
        var dataBlockWidth = (blockWidth / widthScale);
        var dataBlockDepth = (blockDepth / depthScale);

        var dataTextureWidth = nearestPow2(dataBlockWidth) * 2;
        var dataTextureDepth = nearestPow2(dataBlockDepth) * 2;

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
            var x0 = Data.nextLevel.xOffset + wBlock * widthScale;
            var y0 = Data.nextLevel.yOffset + (worldDepth - (dBlock * depthScale)) - blockDepth;
            var x1 = x0 + blockWidth;
            var y1 = y0 + blockDepth;

            var dStart = 0, wStart = 0;
            var dStop = dataBlockDepth - 1, wStop = dataBlockWidth - 1;
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
                dStop += 2;
                dSquares += 2;
            }
            if ((wBlock + dataBlockWidth) < dataWidth) {
                wStop += 2;
                wSquares += 2;
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
                    uvs[ iuv ]     = w  / dataBlockWidth ;
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
                    Texture.generateUrl(World.d96tm2d48gk([x0,y0]), World.d96tm2d48gk([x1,y1]), [dataTextureWidth, dataTextureDepth], 'jpg'),
                    (function (x, y, positions, normals, uvs) {
                        return function (texture) {
                            blockLod = lods[x + '_' + y];

                            if (blockLod) {
                                // Create mesh and lod and add them to the scene
                                blockGeometry = new THREE.BufferGeometry();
                                blockGeometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
                                blockGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
                                blockGeometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3, true ) );
                                blockGeometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
                                // blockGeometry = new THREE.PlaneGeometry( blockWidth, blockDepth, dataBlockWidth, dataBlockDepth );

                                texture.flipY = false;
                                blockMaterial = new THREE.MeshLambertMaterial( {
                                    //side: THREE.DoubleSide ,
                                    //vertexColors: THREE.FaceColors,
                                    shading: THREE.FlatShading,
                                    map: texture
                                } );

                                blockMesh = new THREE.Mesh( blockGeometry, blockMaterial );
                                // blockMesh.scale.set( 1.5, 1.5, 1.5 );
                                blockMesh.updateMatrix();
                                blockMesh.matrixAutoUpdate = false;
                                blockLod.addLevel( blockMesh, Data.nextLevel.lodDistance );

                                blockLod.updateMatrix();

                                if (LOD.level > 6) {
                                    loadedLevels.push(blockMesh);
                                }
                            }

                            Controls.signalRequestEnd();
                        };
                    })(x0, y0, positions, normals, uvs)
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

        console.log('detailed mesh: ', performance.now() - start);

        Data.img = null;

        Data.loadingInProgress = false;
        console.log('LOD update stop');

        Controls.signalRequestEnd();
    };

    /**
     * Calculates global UV coordinates which are used for referencing the right part of the material texture.
     * @param {number} x
     * @param {number} y
     */
    var calculateGlobalUV = function (x, y) {
        return [
            (x - Data.baseLevel.xOffset) / Data.baseLevel.worldWidth,
            1 - ((y - Data.baseLevel.yOffset) / Data.baseLevel.worldDepth)
        ];
    }

    var getHeights = function (image) {
        var canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        var context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);

        /** IMAGE DATA EXPLANATION
         * The data property returns a Uint8ClampedArray which can be accessed
         * to look at the raw pixel data; each pixel is represented by four
         * one-byte values (red, green, blue, and alpha, in that order; that is, "RGBA" format).
         * Each color component is represented by an integer between 0 and 255.
         * Each component is assigned a consecutive index within the array,
         * with the top left pixel's red component being at index 0 within the array.
         * Pixels then proceed from left to right, then downward, throughout the array.
         */
        var imageData = context.getImageData(0, 0, image.width, image.height).data;

        var buffer = 0,
            r = 0, g = 0, b = 0,
            iHeights = 0,
            heights = new Float32Array(image.width * image.height);

        for (var i = 0; i < imageData.length; i += 4) {
            r = (imageData[i] << 16);
            g = (imageData[i+1] << 8);
            b = (imageData[i+2]);
            buffer = r | g | b;
            //imageData[i+4] -> alpha value

            buffer /= 100;

            heights[iHeights] = buffer;

            if (buffer < Data.hmin)
                Data.hmin = buffer;
            if (buffer > Data.hmax)
                Data.hmax = buffer;

            iHeights += 1;
        }

        canvas = null;
        context = null;
        imageData = null;

        return heights;
    };

    /**
     * Calculates sparse factor depending on the distance of current x and y
     * from the center of next level area.
     * @param {number} x
     * @param {number} y
     */
    var calculateSparseFactor = function (x, y) {
        var distance = Math.max(Math.abs(Data.nextLevel.center.x - x), Math.abs(Data.nextLevel.center.y - y));

        // Subtract epsilon to avoid getting values for out of the main area
        var sparseFactor = Math.pow(2, Math.floor((distance - 0.001) / Data.nextLevel.halfWidth));

        // SparseFactor cannot be smaller than 2
        return Math.max(sparseFactor, 2);
    };

    /**
     * Parses image file name to retrieve starting x and y coordinates and level for a block of data.
     * EG. for filename '.../8/426_98.png' you get level:8, x: 426000 and y: 98000.
     * @param {string} fileName
     */
    var parseImageFileName = function (fileName) {
        if (fileName.indexOf('/') < 0) {
            throw new TypeError('Incorrect image file name');
        }
        var fileNameParts = fileName.split('/');
        var level = fileNameParts[fileNameParts.length - 2];
        var xy = fileNameParts[fileNameParts.length - 1];

        // Remove '.png'
        xy = xy.split('.')[0];

        xy = xy.split('_');

        return {
            level: level * 1,
            x: xy[0] * 1000,
            y: xy[1] * 1000
        };
    };

    var loadData = function (level, x, y) {
        Controls.signalRequestStart();

        Data.loadingInProgress = true;
        Data.img = new Image();
        Data.img.addEventListener("load", onDataLoad);
        Data.img.src = 'data/' + level + '/' + Math.floor(x / 1000) + '_' + Math.floor(y / 1000) + '.png';
    };

    return {
        initialHeightMap: "data/2/374_31.png",
        img: null,
        hmin: 3000.0,
        hmax: -1,
        baseLevel: null,
        nextLevel: {
            indices: null,
            positions: null,
            normals: null,
            uvs: null,
            center: {
                x: null,
                y: null
            },
            halfWidth: null,
            lodDistance: null
        },

        loadingInProgress: true,

        loadData: loadData,

        init: function () {
            Data.img = new Image();
            Data.img.addEventListener("load", onInitialDataLoad);
            Data.img.src = Data.initialHeightMap;
        }
    };

})();

Data.init();