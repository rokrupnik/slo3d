var World = (function () {
    'use strict';

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
        targetOnScreen.x = 0;
        targetOnScreen.y = 0;

        rayCaster.setFromCamera(targetOnScreen, camera);
        var intersects = rayCaster.intersectObject(baseMesh);

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

    return {
        qt: null,
        searchQtree: searchQtree,
        reset: reset,
        init: function () {
            qt = buildQtree(xOffset, yOffset, worldWidth, worldDepth);//374000, 31000, 256000, 256000);//
        }
    };
})();

World.init();