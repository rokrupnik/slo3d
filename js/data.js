var Data = (function () {
    'use strict';

    var onInitialDataLoad = function () {
        var heights = getHeights(Data.img);

        Data.baseLevel = {
            heights: heights,
            dataWidth: Data.img.width,
            xOffset: xOffset,
            yOffset: yOffset,
            level: 6,
            worldWidth: LOD.getLevelDimension(6)
        };

        init(heights, Data.img.width, Data.img.height, Data.hmin, Data.hmax);
        animate();

        Data.img = null;
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

        var squares = Data.baseLevel.dataWidth - 1 + Data.nextLevel.dataWidth - 1;

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
        if (!Data.nextLevel.colors)
            Data.nextLevel.colors = new Uint8Array( triangles * 3 * 3 );

        var color = new THREE.Color();
        //var n = 800, n2 = n/2;  // triangles spread in the cube
        //var d = 12, d2 = d/2;   // individual triangle size
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

        var rmin = 0, rmax = 255;
        var gmin = 0, gmax = 255;
        var bmin = 0, bmax = 255;

        var ipnc = 0;

        var skipW = 0, sparseFactor = calculateSparseFactor(Data.baseLevel.xOffset, Data.baseLevel.yOffset + Data.baseLevel.worldWidth);

        var rowSparseFactor = Math.max(
            calculateSparseFactor(Data.baseLevel.xOffset, Data.baseLevel.yOffset),
            sparseFactor,
            calculateSparseFactor(Data.baseLevel.xOffset + Data.baseLevel.worldWidth, Data.baseLevel.yOffset),
            calculateSparseFactor(Data.baseLevel.xOffset + Data.baseLevel.worldWidth, Data.baseLevel.yOffset + Data.baseLevel.worldWidth)
        );

        console.log(Data.baseLevel.xOffset, Data.baseLevel.yOffset, Data.nextLevel.xOffset, Data.nextLevel.yOffset, Data.nextLevel.halfWidth, Data.nextLevel.center, sparseFactor, rowSparseFactor);

        var drawSquare = function (w, d) {
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

            if (Data.nextLevel.xOffset < ax && ax < Data.nextLevel.xOffset + Data.nextLevel.worldWidth &&
                Data.nextLevel.yOffset < ay && ay < Data.nextLevel.yOffset + Data.nextLevel.worldWidth &&
                Data.nextLevel.xOffset < bx && bx < Data.nextLevel.xOffset + Data.nextLevel.worldWidth &&
                Data.nextLevel.yOffset < by && by < Data.nextLevel.yOffset + Data.nextLevel.worldWidth &&
                Data.nextLevel.xOffset < cx && cx < Data.nextLevel.xOffset + Data.nextLevel.worldWidth &&
                Data.nextLevel.yOffset < cy && cy < Data.nextLevel.yOffset + Data.nextLevel.worldWidth &&
                Data.nextLevel.xOffset < dx && dx < Data.nextLevel.xOffset + Data.nextLevel.worldWidth &&
                Data.nextLevel.yOffset < dy && dy < Data.nextLevel.yOffset + Data.nextLevel.worldWidth) {

                    return false;
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

            // colors
            // (k*low.red + (1-k)*hi.red,
            // k*low.green + (1-k)*hi.green,
            // k*low.blue + (1-k)*hi.blue)
            // where k = (height-minHeight) / (maxHeight-minHeight).
            var ak = (az - hmin) / (hmax - hmin);
            var bk = (bz - hmin) / (hmax - hmin);
            var ck = (cz - hmin) / (hmax - hmin);
            var dk = (dz - hmin) / (hmax - hmin);
            // First triangle
            Data.nextLevel.colors[ ipnc ]     = ((1 - ak) * rmin) + (ak * rmax);
            Data.nextLevel.colors[ ipnc + 1 ] = ((1 - ak) * gmin) + (ak * gmax);
            Data.nextLevel.colors[ ipnc + 2 ] = ((1 - ak) * bmin) + (ak * bmax);
            Data.nextLevel.colors[ ipnc + 3 ] = ((1 - bk) * rmin) + (bk * rmax);
            Data.nextLevel.colors[ ipnc + 4 ] = ((1 - bk) * gmin) + (bk * gmax);
            Data.nextLevel.colors[ ipnc + 5 ] = ((1 - bk) * bmin) + (bk * bmax);
            Data.nextLevel.colors[ ipnc + 6 ] = ((1 - ck) * rmin) + (ck * rmax);
            Data.nextLevel.colors[ ipnc + 7 ] = ((1 - ck) * gmin) + (ck * gmax);
            Data.nextLevel.colors[ ipnc + 8 ] = ((1 - ck) * bmin) + (ck * bmax);
            // Second triangle
            Data.nextLevel.colors[ ipnc + 9 ]  = ((1 - ck) * rmin) + (ck * rmax);
            Data.nextLevel.colors[ ipnc + 10 ] = ((1 - ck) * gmin) + (ck * gmax);
            Data.nextLevel.colors[ ipnc + 11 ] = ((1 - ck) * bmin) + (ck * bmax);
            Data.nextLevel.colors[ ipnc + 12 ] = ((1 - bk) * rmin) + (bk * rmax);
            Data.nextLevel.colors[ ipnc + 13 ] = ((1 - bk) * gmin) + (bk * gmax);
            Data.nextLevel.colors[ ipnc + 14 ] = ((1 - bk) * bmin) + (bk * bmax);
            Data.nextLevel.colors[ ipnc + 15 ] = ((1 - dk) * rmin) + (dk * rmax);
            Data.nextLevel.colors[ ipnc + 16 ] = ((1 - dk) * gmin) + (dk * gmax);
            Data.nextLevel.colors[ ipnc + 17 ] = ((1 - dk) * bmin) + (dk * bmax);

            ipnc += 18;

            return true;
        };

        var start = performance.now();
        for (var d = 0; d < dataDepth - (sparseFactor + 1); d += rowSparseFactor) {
            for (var w = 0; w < dataWidth - (sparseFactor + 1); w += sparseFactor) {

                var ax = xOffset + w                                * widthScale;
                var ay = yOffset + (dataDepth - d)                  * depthScale;

                sparseFactor = calculateSparseFactor(ax, ay);

                for (var i = 0; i < (rowSparseFactor / sparseFactor); i++) {
                    var squareWasDrawn = drawSquare(w, d + i * sparseFactor);
                    if (i === 0 && !squareWasDrawn) {
                        // Square was not drawn, because we are in next level area
                        skipW = Math.floor(Data.nextLevel.worldWidth / depthScale);
                        // Make it divisible by sparseFactor
                        skipW -= skipW % sparseFactor;
                        w += skipW - (sparseFactor * 3);

                        break;
                    }
                }
            }
        }

        dataWidth = Data.nextLevel.dataWidth;
        dataDepth = dataWidth;
        worldWidth = Data.nextLevel.worldWidth;
        worldDepth = worldWidth;
        heights = Data.nextLevel.heights;

        widthScale = worldWidth / dataWidth;
        depthScale = worldDepth / dataDepth;

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

                // Data.nextLevel.colors
                // (k*low.red + (1-k)*hi.red,
                // k*low.green + (1-k)*hi.green,
                // k*low.blue + (1-k)*hi.blue)
                // where k = (height-minHeight) / (maxHeight-minHeight).
                var ak = (az - hmin) / (hmax - hmin);
                var bk = (bz - hmin) / (hmax - hmin);
                var ck = (cz - hmin) / (hmax - hmin);
                var dk = (dz - hmin) / (hmax - hmin);
                // First triangle
                Data.nextLevel.colors[ ipnc ]     = ((1 - ak) * rmin) + (ak * rmax);
                Data.nextLevel.colors[ ipnc + 1 ] = ((1 - ak) * gmin) + (ak * gmax);
                Data.nextLevel.colors[ ipnc + 2 ] = ((1 - ak) * bmin) + (ak * bmax);
                Data.nextLevel.colors[ ipnc + 3 ] = ((1 - bk) * rmin) + (bk * rmax);
                Data.nextLevel.colors[ ipnc + 4 ] = ((1 - bk) * gmin) + (bk * gmax);
                Data.nextLevel.colors[ ipnc + 5 ] = ((1 - bk) * bmin) + (bk * bmax);
                Data.nextLevel.colors[ ipnc + 6 ] = ((1 - ck) * rmin) + (ck * rmax);
                Data.nextLevel.colors[ ipnc + 7 ] = ((1 - ck) * gmin) + (ck * gmax);
                Data.nextLevel.colors[ ipnc + 8 ] = ((1 - ck) * bmin) + (ck * bmax);
                // Second triangle
                Data.nextLevel.colors[ ipnc + 9 ]  = ((1 - ck) * rmin) + (ck * rmax);
                Data.nextLevel.colors[ ipnc + 10 ] = ((1 - ck) * gmin) + (ck * gmax);
                Data.nextLevel.colors[ ipnc + 11 ] = ((1 - ck) * bmin) + (ck * bmax);
                Data.nextLevel.colors[ ipnc + 12 ] = ((1 - bk) * rmin) + (bk * rmax);
                Data.nextLevel.colors[ ipnc + 13 ] = ((1 - bk) * gmin) + (bk * gmax);
                Data.nextLevel.colors[ ipnc + 14 ] = ((1 - bk) * bmin) + (bk * bmax);
                Data.nextLevel.colors[ ipnc + 15 ] = ((1 - dk) * rmin) + (dk * rmax);
                Data.nextLevel.colors[ ipnc + 16 ] = ((1 - dk) * gmin) + (dk * gmax);
                Data.nextLevel.colors[ ipnc + 17 ] = ((1 - dk) * bmin) + (dk * bmax);

                ipnc += 18;
            }
        }
        console.log('detailed mesh: ', performance.now() - start);

        detailedGeometry.setIndex( new THREE.BufferAttribute( Data.nextLevel.indices, 1 ) );
        detailedGeometry.addAttribute( 'position', new THREE.BufferAttribute( Data.nextLevel.positions, 3 ) );
        detailedGeometry.addAttribute( 'normal', new THREE.BufferAttribute( Data.nextLevel.normals, 3, true ) );
        detailedGeometry.addAttribute( 'color', new THREE.BufferAttribute( Data.nextLevel.colors, 3, true ) );

        //detailedGeometry.computeBoundingSphere();

        // var material = new THREE.MeshLambertMaterial( {
        //     //color: 0xaaaaaa, specular: 0xffffff, shininess: 250, side: THREE.DoubleSide ,
        //     vertexColors: THREE.VertexColors//, shading: THREE.FlatShading
        // } );

        detailedMesh = new THREE.Mesh( detailedGeometry, material );
        scene.add( detailedMesh );
        scene.remove(baseMesh);

        //init(processedImage.heights, Data.img.width, Data.img.height, processedImage.hmin, processedImage.hmax);

        Data.img = null;

        LOD.updateInProgress = false;
        console.log('LOD update stop');
    };

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
        return Math.pow(2, Math.floor((distance - 0.001) / Data.nextLevel.halfWidth));
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
        Data.img = new Image();
        Data.img.addEventListener("load", onDataLoad);
        Data.img.src = 'data/' + level + '/' + Math.floor(x / 1000) + '_' + Math.floor(y / 1000) + '.png';
    };

    return {
        initialHeightMap: "data/6/412_98.png",
        img: null,
        hmin: 3000.0,
        hmax: -1,
        baseLevel: null,
        nextLevel: {
            indices: null,
            positions: null,
            normals: null,
            colors: null,
            center: {
                x: null,
                y: null
            },
            halfWidth: null
        },

        loadData: loadData,

        init: function () {
            Data.img = new Image();
            Data.img.addEventListener("load", onInitialDataLoad);
            Data.img.src = Data.initialHeightMap;
        }
    };

})();

Data.init();