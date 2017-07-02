var World = (function () {
    'use strict';

    // Coordinates

    // http://gis.arso.gov.si/arcgis/rest/services/DOF25_2014_2015/MapServer/export?bbox=412000.0%2C98000.0%2C428000.0%2C114000.0&bboxSR=3794&layers=&layerDefs=&size=&imageSR=&format=png&transparent=true&dpi=&time=&layerTimeOptions=&dynamicLayers=&gdbVersion=&mapScale=&f=image

    var D48GK = "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=bessel +towgs84=430.8554,121.4779,459.6256,4.3787,4.3716,-11.9863,17.3666 +units=m +no_defs";
    var D96TM = "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

    var qt = null;

    /**
     * Get first intersection of terrain and the line from camera to controls target.
     * It is done by raycasting center of screen from camera position.
     *
     * @return {Object} intersection
     */
    var getViewIntersection = function () {
        // target position in normalized device coordinates
        // (-1 to +1) for both components
        World.targetOnScreen.x = 0;
        World.targetOnScreen.y = 0;

        World.rayCaster.setFromCamera(World.targetOnScreen, Controls.camera);
        var intersects = World.rayCaster.intersectObject(World.scene);

        if (intersects.length > 0)
            return intersects[0];
        else
            return null;
    };

    /**
     * Get first intersection of terrain and the line from camera to controls target.
     * It is done by raycasting center of screen from camera position.
     *
     * @return {Object} intersection
     */
    var getHeightAtPosition = function (x, y) {
        // var ix = World.bisectX(x, worldData);
        // var iy = World.bisectY(y, ix, worldData);

        // return worldData[(ix * worldDataWidth) + iy + 2]
    };

    /**
     * UNUSED
     * Find index for x in hay, such that x is closest to needleX.
     * We use bisection for a faster search.
     * @param {float} needleX
     * @param {Array} hay Positions array in the form { x0, y0, z0, ...15 other values..., x0, y1, z1...}.
     * @return {int} ix Index of x, such that x is closest to needleX.
     */
    var bisectX = function (needleX, hay) {
        var il = 0,
            ir = hay.length / 18,
            ix;

        while (il != ir) {
            ix = (il + ir) / 2;

            if (hay[ix * 18] < needleX)
                il = ix;
            else
                ir = ix;
        }

        return ix;
    };

    var buildQtree = function (x, y, w, d) {
        var qt = QuadTree(x, y, w, d, { maxchildren: 4 });

        for (var ix = x; ix < x + w; ix += 1000) {
            for (var iy = y; iy < y + d; iy += 1000) {
                qt.put({ x: ix, y: iy, w: 999.99, h: 999.99 });
            }
        }

        return qt;
    };

    var searchQtree = function (x, y, wh) {
        // For smaller areas than 1kx1k use default get method
        if (wh <= 1000) {
            var correctObj = null;
            qt.get({ x: x, y: y, w: wh, h: wh }, function (obj) {
                if (obj.x <= x && x < obj.x + 1000 &&
                    obj.y <= y && y < obj.y + 1000) {
                    // Save result
                    correctObj = obj;
                    // Finish iteration
                    return false;
                } else {
                    // Continue  iteration
                    return true;
                }
            });
            return correctObj;
        }

        // For larger areas use recursive search on root node
        var root = qt.root;

        // Sanity check if searched location is in the qtree
        if (x < root.x ||
            y < root.y ||
            root.x + root.w < x ||
            root.y + root.h < y) {
            return null;
        }

        var searchQtreeRecursive = function (n, x, y, wh) {
            if (n.w / 2 >= wh) {
                // Select node for recursion
                var w2 = n.w / 2,
                    h2 = n.h / 2;

                // right top
                if (n.n.length > 3 && (n.x + w2) <= x && (n.y + h2) <= y)
                    return searchQtreeRecursive(n.n[3], x, y, wh);
                // left top
                else if (n.n.length > 2 && x < (n.x + w2) && (n.y + h2) <= y)
                    return searchQtreeRecursive(n.n[2], x, y, wh);
                // right bottom
                else if (n.n.length > 1 && (n.x + w2) <= x && y < (n.y + h2))
                    return searchQtreeRecursive(n.n[1], x, y, wh);
                // left bottom
                else if (n.n.length > 0)
                    return searchQtreeRecursive(n.n[0], x, y, wh);
                else
                    throw new ReferenceError('World.searchQtree: recursion error.');

                // If no result was found on the lower levels, return this node.
                //return nr || n;
            } else if (n.w / 2 < wh && wh <= n.w) {
                // Stop recursion
                return n;
            } else {
                throw new ReferenceError('World.searchQtree: recursion finished in a wrong node.\nx: ' + x + ', y: ' + y + ', wh:' + wh);
            }
        };

        return searchQtreeRecursive(root, x, y, wh);
    };

    var reset = function () {
        scene.add(baseMesh);

        scene.remove(detailedMesh);

        detailedGeometry.dispose();
    };

    /**
     * Reprojects a coordinate in D96TM projection to a coordinate in D48GK projection.
     * @param {Array} xy Array with x and y coordinate in D96TM projection. Eg. [x, y]
     * @return {Array}
     */
    var d96tm2d48gk = function(xy) {
        return proj4(D96TM, D48GK, xy);
    };

    var initializeScene = function () {
        World.scene = new THREE.Scene();

        World.scene.add( new THREE.AmbientLight( 0x444444 ) );
        var light1 = new THREE.DirectionalLight( 0xffffff, 1.0 );
        light1.position.set( 1, 0, -1 );
        World.scene.add( light1 );
    };

    var initializeRenderer = function () {
        World.renderer = new THREE.WebGLRenderer();
        World.renderer.setClearColor( 0xbfd1e5 );
        World.renderer.sortObjects = false;
        //World.renderer.autoClear = false;
        World.renderer.setPixelRatio( window.devicePixelRatio );
        World.renderer.setSize( window.innerWidth, window.innerHeight );
    };

    return {
        bbox: {
            d96tm: {
                xy0: [xOffset, yOffset],
                xy1: [xOffset + worldWidth, yOffset + worldDepth]
            },
            d48gk: {
                xy0: [0, 0],
                xy1: [0, 0]
            }
        },
        scene: null,
        renderer: null,
        targetOnScreen: null,
        rayCaster: null,
        qt: null,

        searchQtree: searchQtree,
        reset: reset,
        d96tm2d48gk: d96tm2d48gk,
        getViewIntersection: getViewIntersection,

        initializeScene: initializeScene,
        initializeRenderer: initializeRenderer,
        init: function () {
            World.rayCaster = new THREE.Raycaster();
            World.targetOnScreen = new THREE.Vector2();

            qt = buildQtree(xOffset, yOffset, worldWidth, worldDepth);//374000, 31000, 256000, 256000);//

            World.bbox.d48gk.xy0 = proj4(D96TM, D48GK, World.bbox.d96tm.xy0);
            World.bbox.d48gk.xy1 = proj4(D96TM, D48GK, World.bbox.d96tm.xy1);
        }
    };
})();

World.init();