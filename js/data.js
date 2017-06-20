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

        var squares = Data.baseLevel.dataWidth - 1 + Data.nextLevel.dataWidth - 1; // TODO: use less triangles in base level

        // Base level
        var triangles = squares * squares * 2;
        detailedGeometry = new THREE.BufferGeometry();
        if (!Data.nextLevel.indices) {
            Data.nextLevel.indices = new Uint32Array( triangles * 3 );
            for ( var i = 0; i < Data.nextLevel.indices.length; i ++ ) {
                Data.nextLevel.indices[ i ] = i;
            }
        }
        if (!Data.nextLevel.positions)
            Data.nextLevel.positions = new Float32Array( triangles * 3 * 3 );
        if (!Data.nextLevel.normals)
            Data.nextLevel.normals = new Int16Array( triangles * 3 * 3 );
        if (!Data.nextLevel.uvs)
            Data.nextLevel.uvs = new Float32Array( triangles * 3 * 2 );

        var pA = new THREE.Vector3();
        var pB = new THREE.Vector3();
        var pC = new THREE.Vector3();
        var pD = new THREE.Vector3();
        var cb = new THREE.Vector3();
        var ab = new THREE.Vector3();
        var db = new THREE.Vector3();

        var dataWidth = Data.baseLevel.dataWidth;
        var dataDepth = dataWidth;
        var worldWidth = Data.baseLevel.worldWidth;
        var worldDepth = worldWidth;
        var heights = Data.baseLevel.heights;

        var widthScale = worldWidth / dataWidth;
        var depthScale = worldDepth / dataDepth;

        var ipnc = 0;
        var iuv = 0;

        var skipW = 0, sparseFactor = calculateSparseFactor(Data.baseLevel.xOffset, Data.baseLevel.yOffset + Data.baseLevel.worldWidth);

        var nextRowSparseFactor, previousSparseFactor = sparseFactor;

        var rowSparseFactor = Math.max(
            calculateSparseFactor(Data.baseLevel.xOffset, Data.baseLevel.yOffset),
            sparseFactor,
            calculateSparseFactor(Data.baseLevel.xOffset + Data.baseLevel.worldWidth, Data.baseLevel.yOffset),
            calculateSparseFactor(Data.baseLevel.xOffset + Data.baseLevel.worldWidth, Data.baseLevel.yOffset + Data.baseLevel.worldWidth)
        );

        var drawSquare = function (w, d, sparseFactor, debug) {
            var ih = d * dataDepth + w;

            var ax = xOffset + w                                * widthScale;
            var ay = yOffset + (dataDepth - d)                  * depthScale;
            var az =               (heights[ ih ])                  ;//* heightScale;
            var bx = xOffset + w                                * widthScale;
            var by = yOffset + (dataDepth - (d + sparseFactor))            * depthScale;
            var bz = (heights[ ih + (sparseFactor * dataWidth) ])                    ;//* heightScale;
            var cx = xOffset + (w + sparseFactor)                          * widthScale;
            var cy = yOffset + (dataDepth - d)                  * depthScale;
            var cz =               (heights[ ih + sparseFactor ])              ;//* heightScale;
            var dx = xOffset + (w + sparseFactor)                          * widthScale;
            var dy = yOffset + (dataDepth - (d + sparseFactor))            * depthScale;
            var dz =               (heights[ ih + (sparseFactor * dataWidth) + sparseFactor ])  ;//* heightScale;

            if (Data.nextLevel.xOffset + 10 < ax && ax < Data.nextLevel.xOffset + Data.nextLevel.worldWidth - 10 &&
                Data.nextLevel.yOffset + 10 < ay && ay < Data.nextLevel.yOffset + Data.nextLevel.worldWidth - 10 &&
                Data.nextLevel.xOffset + 10 < bx && bx < Data.nextLevel.xOffset + Data.nextLevel.worldWidth - 10 &&
                Data.nextLevel.yOffset + 10 < by && by < Data.nextLevel.yOffset + Data.nextLevel.worldWidth - 10 &&
                Data.nextLevel.xOffset + 10 < cx && cx < Data.nextLevel.xOffset + Data.nextLevel.worldWidth - 10 &&
                Data.nextLevel.yOffset + 10 < cy && cy < Data.nextLevel.yOffset + Data.nextLevel.worldWidth - 10 &&
                Data.nextLevel.xOffset + 10 < dx && dx < Data.nextLevel.xOffset + Data.nextLevel.worldWidth - 10 &&
                Data.nextLevel.yOffset + 10 < dy && dy < Data.nextLevel.yOffset + Data.nextLevel.worldWidth - 10) {

                    return false;
            }

            if (az == 0 && bz == 0 && cz == 0 && dz == 0) {
                // Ignore areas without data
                return true;
            } else if (az > 2865 || bz > 2865 || cz > 2865 || dz > 2865) {
                // Ignore areas with unrealistic heights
                return true;
            }

            // First triangle - mind the triangles orientation
            Data.nextLevel.positions[ ipnc ]     = ax;
            Data.nextLevel.positions[ ipnc + 1 ] = ay;
            Data.nextLevel.positions[ ipnc + 2 ] = az;
            Data.nextLevel.positions[ ipnc + 3 ] = bx;
            Data.nextLevel.positions[ ipnc + 4 ] = by;
            Data.nextLevel.positions[ ipnc + 5 ] = bz;
            Data.nextLevel.positions[ ipnc + 6 ] = cx;
            Data.nextLevel.positions[ ipnc + 7 ] = cy;
            Data.nextLevel.positions[ ipnc + 8 ] = cz;
            // Second triangle
            Data.nextLevel.positions[ ipnc + 9 ]  = bx;
            Data.nextLevel.positions[ ipnc + 10 ] = by;
            Data.nextLevel.positions[ ipnc + 11 ] = bz;
            Data.nextLevel.positions[ ipnc + 12 ] = dx;
            Data.nextLevel.positions[ ipnc + 13 ] = dy;
            Data.nextLevel.positions[ ipnc + 14 ] = dz;
            Data.nextLevel.positions[ ipnc + 15 ] = cx;
            Data.nextLevel.positions[ ipnc + 16 ] = cy;
            Data.nextLevel.positions[ ipnc + 17 ] = cz;

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
            Data.nextLevel.normals[ ipnc ]     = nx0 * 32767;
            Data.nextLevel.normals[ ipnc + 1 ] = ny0 * 32767;
            Data.nextLevel.normals[ ipnc + 2 ] = nz0 * 32767;
            Data.nextLevel.normals[ ipnc + 3 ] = nx0 * 32767;
            Data.nextLevel.normals[ ipnc + 4 ] = ny0 * 32767;
            Data.nextLevel.normals[ ipnc + 5 ] = nz0 * 32767;
            Data.nextLevel.normals[ ipnc + 6 ] = nx0 * 32767;
            Data.nextLevel.normals[ ipnc + 7 ] = ny0 * 32767;
            Data.nextLevel.normals[ ipnc + 8 ] = nz0 * 32767;
            // Second triangle
            db.subVectors( pD, pB );
            cb.subVectors( pC, pB );
            cb.cross( db );
            cb.normalize();
            var nx1 = cb.x;
            var ny1 = cb.y;
            var nz1 = cb.z;
            Data.nextLevel.normals[ ipnc + 9 ]  = nx1 * 32767;
            Data.nextLevel.normals[ ipnc + 10 ] = ny1 * 32767;
            Data.nextLevel.normals[ ipnc + 11 ] = nz1 * 32767;
            Data.nextLevel.normals[ ipnc + 12 ] = nx1 * 32767;
            Data.nextLevel.normals[ ipnc + 13 ] = ny1 * 32767;
            Data.nextLevel.normals[ ipnc + 14 ] = nz1 * 32767;
            Data.nextLevel.normals[ ipnc + 15 ] = nx1 * 32767;
            Data.nextLevel.normals[ ipnc + 16 ] = ny1 * 32767;
            Data.nextLevel.normals[ ipnc + 17 ] = nz1 * 32767;

            // uvs
            // First triangle
            Data.nextLevel.uvs[ iuv ]     = w  / dataWidth;
            Data.nextLevel.uvs[ iuv + 1 ] = d / dataDepth;
            Data.nextLevel.uvs[ iuv + 2 ] = w  / dataWidth;
            Data.nextLevel.uvs[ iuv + 3 ] = (d + 1) / dataDepth;
            Data.nextLevel.uvs[ iuv + 4 ] = (w + 1)  / dataWidth;
            Data.nextLevel.uvs[ iuv + 5 ] = d / dataDepth;
            // Second triangle
            Data.nextLevel.uvs[ iuv + 6 ]  = (w + 1)  / dataWidth;
            Data.nextLevel.uvs[ iuv + 7 ]  = d / dataDepth;
            Data.nextLevel.uvs[ iuv + 8 ]  = w  / dataWidth;
            Data.nextLevel.uvs[ iuv + 9 ]  = (d + 1) / dataDepth;
            Data.nextLevel.uvs[ iuv + 10 ] = (w + 1)  / dataWidth;
            Data.nextLevel.uvs[ iuv + 11 ] = (d + 1) / dataDepth;

            ipnc += 18;
            iuv += 12;

            return true;
        };

        var start = performance.now();
        for (var d = 0; d < dataDepth - (sparseFactor + 1); d += rowSparseFactor) {
            for (var w = 0; w < dataWidth - (sparseFactor + 1); w += sparseFactor) {

                var ax = xOffset + w                                * widthScale;
                var ay = yOffset + (dataDepth - d)                  * depthScale;

                sparseFactor = calculateSparseFactor(ax, ay);


                if (previousSparseFactor != sparseFactor) {
                    // Stiching levels west <-> east
                    for (var i = 0; i < (rowSparseFactor / previousSparseFactor); i++) {
                        drawSquare(w, d + i * previousSparseFactor, previousSparseFactor);
                    }
                } else {
                    // Stiching levels north <-> south
                    nextRowSparseFactor = calculateSparseFactor(ax, ay - d * depthScale);
                    if (nextRowSparseFactor != sparseFactor) {
                        drawSquare(w, d + rowSparseFactor, sparseFactor);
                    }
                }

                var allSquaresWereProcessed = false;
                for (var i = 0; i < (rowSparseFactor / sparseFactor); i++) {
                    allSquaresWereProcessed = drawSquare(w, d + i * sparseFactor, sparseFactor) || allSquaresWereProcessed;
                }
                if (!allSquaresWereProcessed) {
                    // Square was not drawn, because we are in next level area
                    skipW = Math.floor(Data.nextLevel.worldWidth / depthScale);
                    // Make it divisible by sparseFactor
                    skipW -= skipW % sparseFactor;
                    w += skipW - (sparseFactor * 3);
                }
                previousSparseFactor = sparseFactor;
            }
        }

        dataWidth = Data.nextLevel.dataWidth;
        dataDepth = dataWidth;
        worldWidth = Data.nextLevel.worldWidth;
        worldDepth = worldWidth;
        heights = Data.nextLevel.heights;

        widthScale = worldWidth / dataWidth;
        depthScale = worldDepth / dataDepth;

        var xyTmp = [0, 0];

        for (var d = 0; d < dataDepth - 1; d++) {
            for (var w = 0; w < dataWidth - 1; w++) {
                var ih = d * dataDepth + w;

                var ax = Data.nextLevel.xOffset + w                                * widthScale;
                var ay = Data.nextLevel.yOffset + (dataDepth - d)                  * depthScale;
                var az =               (heights[ ih ])                  ;//* heightScale;
                var bx = Data.nextLevel.xOffset + w                                * widthScale;
                var by = Data.nextLevel.yOffset + (dataDepth - (d + 1))            * depthScale;
                var bz = (heights[ ih + dataWidth ])                    ;//* heightScale;
                var cx = Data.nextLevel.xOffset + (w + 1)                          * widthScale;
                var cy = Data.nextLevel.yOffset + (dataDepth - d)                  * depthScale;
                var cz =               (heights[ ih + 1 ])              ;//* heightScale;
                var dx = Data.nextLevel.xOffset + (w + 1)                          * widthScale;
                var dy = Data.nextLevel.yOffset + (dataDepth - (d + 1))            * depthScale;
                var dz =               (heights[ ih + dataWidth + 1 ])  ;//* heightScale;

                if (az == 0 && bz == 0 && cz == 0 && dz == 0) {
                    // Ignore areas without data
                    continue;
                } else if (az > 2865 || bz > 2865 || cz > 2865 || dz > 2865) {
                    // Ignore areas with unrealistic heights
                    continue;
                }

                // First triangle - mind the triangles orientation
                Data.nextLevel.positions[ ipnc ]     = ax;
                Data.nextLevel.positions[ ipnc + 1 ] = ay;
                Data.nextLevel.positions[ ipnc + 2 ] = az;
                Data.nextLevel.positions[ ipnc + 3 ] = bx;
                Data.nextLevel.positions[ ipnc + 4 ] = by;
                Data.nextLevel.positions[ ipnc + 5 ] = bz;
                Data.nextLevel.positions[ ipnc + 6 ] = cx;
                Data.nextLevel.positions[ ipnc + 7 ] = cy;
                Data.nextLevel.positions[ ipnc + 8 ] = cz;
                // Second triangle
                Data.nextLevel.positions[ ipnc + 9 ]  = bx;
                Data.nextLevel.positions[ ipnc + 10 ] = by;
                Data.nextLevel.positions[ ipnc + 11 ] = bz;
                Data.nextLevel.positions[ ipnc + 12 ] = dx;
                Data.nextLevel.positions[ ipnc + 13 ] = dy;
                Data.nextLevel.positions[ ipnc + 14 ] = dz;
                Data.nextLevel.positions[ ipnc + 15 ] = cx;
                Data.nextLevel.positions[ ipnc + 16 ] = cy;
                Data.nextLevel.positions[ ipnc + 17 ] = cz;

                // flat face Data.nextLevel.normals
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
                Data.nextLevel.normals[ ipnc ]     = nx0 * 32767;
                Data.nextLevel.normals[ ipnc + 1 ] = ny0 * 32767;
                Data.nextLevel.normals[ ipnc + 2 ] = nz0 * 32767;
                Data.nextLevel.normals[ ipnc + 3 ] = nx0 * 32767;
                Data.nextLevel.normals[ ipnc + 4 ] = ny0 * 32767;
                Data.nextLevel.normals[ ipnc + 5 ] = nz0 * 32767;
                Data.nextLevel.normals[ ipnc + 6 ] = nx0 * 32767;
                Data.nextLevel.normals[ ipnc + 7 ] = ny0 * 32767;
                Data.nextLevel.normals[ ipnc + 8 ] = nz0 * 32767;
                // Second triangle
                db.subVectors( pD, pB );
                cb.subVectors( pC, pB );
                cb.cross( db );
                cb.normalize();
                var nx1 = cb.x;
                var ny1 = cb.y;
                var nz1 = cb.z;
                Data.nextLevel.normals[ ipnc + 9 ]  = nx1 * 32767;
                Data.nextLevel.normals[ ipnc + 10 ] = ny1 * 32767;
                Data.nextLevel.normals[ ipnc + 11 ] = nz1 * 32767;
                Data.nextLevel.normals[ ipnc + 12 ] = nx1 * 32767;
                Data.nextLevel.normals[ ipnc + 13 ] = ny1 * 32767;
                Data.nextLevel.normals[ ipnc + 14 ] = nz1 * 32767;
                Data.nextLevel.normals[ ipnc + 15 ] = nx1 * 32767;
                Data.nextLevel.normals[ ipnc + 16 ] = ny1 * 32767;
                Data.nextLevel.normals[ ipnc + 17 ] = nz1 * 32767;

                // uvs
                // First triangle
                xyTmp = calculateGlobalUV(ax, ay);
                Data.nextLevel.uvs[ iuv ]     = xyTmp[0];
                Data.nextLevel.uvs[ iuv + 1 ] = xyTmp[1];
                xyTmp = calculateGlobalUV(bx, by);
                Data.nextLevel.uvs[ iuv + 2 ] = xyTmp[0];
                Data.nextLevel.uvs[ iuv + 3 ] = xyTmp[1];
                xyTmp = calculateGlobalUV(cx, cy);
                Data.nextLevel.uvs[ iuv + 4 ] = xyTmp[0];
                Data.nextLevel.uvs[ iuv + 5 ] = xyTmp[1];
                // Second triangle
                xyTmp = calculateGlobalUV(bx, by);
                Data.nextLevel.uvs[ iuv + 6 ]  = xyTmp[0];
                Data.nextLevel.uvs[ iuv + 7 ]  = xyTmp[1];
                xyTmp = calculateGlobalUV(dx, dy);
                Data.nextLevel.uvs[ iuv + 8 ]  = xyTmp[0];
                Data.nextLevel.uvs[ iuv + 9 ]  = xyTmp[1];
                xyTmp = calculateGlobalUV(cx, cy);
                Data.nextLevel.uvs[ iuv + 10 ] = xyTmp[0];
                Data.nextLevel.uvs[ iuv + 11 ] = xyTmp[1];

                ipnc += 18;
                iuv += 12;
            }
        }
        console.log('detailed mesh: ', performance.now() - start);

        detailedGeometry.setIndex( new THREE.BufferAttribute( Data.nextLevel.indices, 1 ) );
        detailedGeometry.addAttribute( 'position', new THREE.BufferAttribute( Data.nextLevel.positions, 3 ) );
        detailedGeometry.addAttribute( 'normal', new THREE.BufferAttribute( Data.nextLevel.normals, 3, true ) );
        detailedGeometry.addAttribute( 'uv', new THREE.BufferAttribute( Data.nextLevel.uvs, 2, true ) );

        //detailedGeometry.computeBoundingSphere();

        scene.remove(baseMesh);
        if (detailedMesh != null) {
            scene.remove(detailedMesh);
        }
        detailedMesh = new THREE.Mesh( detailedGeometry, material );
        scene.add( detailedMesh );

        Data.img = null;

        Data.loadingInProgress = false;
        console.log('LOD update stop');
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
            halfWidth: null
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