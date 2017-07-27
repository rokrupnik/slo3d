var LOD = (function () {
    'use strict';

    /**
     * Loads new data if camera is in the right position.
     */
    var update = function () {
        if (!LOD.updateInProgress && !Controls.movementInProgress/* && !LOD.loadingInProgress*/) {
            LOD.updateInProgress = true;

            var nextLevel = 0;

            var x = Controls.controls.target.x,//intersection.point.x,//
                y = Controls.controls.target.y,//intersection.point.y;//
                z = Controls.camera.position.z;

            // Detect LOD level
            _.forEachRight(LOD.levels, function (level, levelId) {
                levelId = parseInt(levelId);
                if (z < level.startDistance) {
                    nextLevel = Math.max(nextLevel, levelId);

                    // Update all actived levels
                    updateLevel(levelId, level.dimension, x, y);
                }
            });

            LOD.level = nextLevel;
            LOD.updateInProgress = false;
        }
    };

    var updateLevel = function (levelId, levelDim, x, y) {
        var qtNode = World.searchQtree(x, y, levelDim);

        // If no quad tree node is found, the target is not in this world
        if (qtNode !== null) {
            x = qtNode.x;
            y = qtNode.y;

            if (
                // Only load data if quadtree node coordinates changed
                LOD.levels[levelId].lastQtCoordinates.x !== x ||
                LOD.levels[levelId].lastQtCoordinates.y !== y
            ) {
                console.log('LOD update start: ', levelId);
                LOD.levels[levelId].lastQtCoordinates.x = x;
                LOD.levels[levelId].lastQtCoordinates.y = y;

                if (
                    // Only load data if no data exist at these coordinates
                    ! LOD.levels[levelId] ||
                    ! LOD.levels[levelId].data[x] ||
                    ! LOD.levels[levelId].data[x][y] ||
                    ! LOD.levels[levelId].data[x][y]
                ) {

                    loadHeightMapAndOrtofoto(levelId, levelDim, x, y);
                } else if (
                    // Data is allready loaded
                    // Just check if they are in correct form
                    _.isArray(LOD.levels[levelId].data[x][y]) &&
                    LOD.levels[levelId].data[x][y].length > 1
                ) {
                    sendTexturesToShaders(levelId, levelDim, x, y, LOD.levels[levelId].data[x][y][0], LOD.levels[levelId].data[x][y][1]);
                }
            }
        }
    };

    var loadHeightMapAndOrtofoto = function (levelId, levelDim, x, y) {
        // Start loading heightmap
        Controls.signalRequestStart();
        Texture.loader.load(
            'data/' + levelId + '/' + Math.floor(x / 1000) + '_' + Math.floor(y / 1000) + '.png',
            handleLoadedHeightMap(levelId, levelDim, x, y),
            null,
            function (response) {
                console.error('HeightMap loading failed', levelId, x, y, response);
                // Mark area as checked to prevent further loading
                if(!LOD.levels[levelId].data[x]) {
                    LOD.levels[levelId].data[x] = {};
                }
                LOD.levels[levelId].data[x][y] = true;
                Controls.signalRequestEnd();
            }
        );
    };

    var handleLoadedHeightMap = function (levelId, levelDim, x, y) {
        return function (heightMap) {
            var handleFailedOrtofoto = function (numberOfRetries) {
                if (numberOfRetries > 0) {
                    console.warn('Ortofoto loading failed. Retrying, number of retries left: ', numberOfRetries, levelId, x, y);
                    Texture.loader.load(
                        Texture.generateUrl([x,y], [(x + levelDim),(y + levelDim)], [1024, 1024]),
                        handleLoadedOrtofoto(levelId, levelDim, x, y, heightMap),
                        null,
                        function () {
                            handleFailedOrtofoto(numberOfRetries - 1);
                        }
                    );
                } else {
                    console.error('Ortofoto loading failed.', levelId, x, y);
                    // At least use the loaded heightmap
                    sendTexturesToShaders(levelId, levelDim, x, y, heightMap, null);
                }
            };
            // Start loading ortoFoto
            Texture.loader.load(
                Texture.generateUrl([x,y], [(x + levelDim),(y + levelDim)], [1024, 1024]),
                handleLoadedOrtofoto(levelId, levelDim, x, y, heightMap),
                null,
                function () {
                    handleFailedOrtofoto(LOD.MAX_NUM_OF_RETRIES);
                }
            );
        };
    };

    var handleLoadedOrtofoto = function (levelId, levelDim, x, y, heightMap) {
        return function (ortoFotoTexture) {
            sendTexturesToShaders(levelId, levelDim, x, y, heightMap, ortoFotoTexture);
        };
    };

    var sendTexturesToShaders = function (levelId, levelDim, x, y, heightMap, ortoFotoTexture) {
        // Store reference to plane for later lod use
        if(!LOD.levels[levelId].data[x]) {
            LOD.levels[levelId].data[x] = {};
        }
        LOD.levels[levelId].data[x][y] = [heightMap, ortoFotoTexture];

        // Add reference for new blocks to levelIds array
        var ref = x + '_' + y;
        if (!_.includes(LOD.levels[levelId].dataIds, ref)) {
            LOD.levels[levelId].dataIds.push(ref);
        }

        // Check LOD level data limits
        if (LOD.levels[levelId].dataIds.length > LOD.MAX_NUM_OF_TILES_PER_LEVEL) {
            // console.info('MAX_NUM_OF_TILES_PER_LEVEL reached in level:', levelId);
            ref = LOD.levels[levelId].dataIds.shift();
            ref = ref.split('_');

            x = ref[0];
            y = ref[1];

            delete LOD.levels[levelId].data[x][y];
        }

        // Send textures to shaders
        // For each tile
        _.forEach(World.terrain.children, function (tile) {
            var tileDim = tile.material.uniforms.uScale.value;
            var xTile = World.center.x + World.terrain.position.x + tile.material.uniforms.uTileOffset.value.x + tileDim/2,
                yTile = World.center.y + World.terrain.position.y + tile.material.uniforms.uTileOffset.value.y + tileDim/2;

            // If center of tile intersects loaded data
            if (
                x <= xTile &&
                xTile <= (x + levelDim) &&
                y <= yTile &&
                yTile <= (y + levelDim)
            ) {
                // Send textures to shader and mark level as active
                tile.material.uniforms['uHeightMap' + levelId] = { value: heightMap };
                tile.material.uniforms['uOrtoFoto' + levelId] = { value: ortoFotoTexture };
                tile.material.uniforms['uLevelOffset' + levelId] = { value: LOD.levels[levelId].lastQtCoordinates };
            } else {
                tile.material.uniforms['uLevelOffset' + levelId] = { value: World.terrain.position };
            }
        });

        //LOD.loadingInProgress = false;
        console.log('LOD update stop: ', levelId);

        Controls.signalRequestEnd();
    }

    /**
     * Level dimensions follow this rule:
     * Level 10: 1000
     * Level 9: 2000
     * Level 8: 4000
     * ...
     * @param   {int} level
     * @return  {int} dimension
     */
    var getLevelDimension = function (level) {
        var dim = 1000;
        for (var i = 0; i < (10 - level); i++)
            dim *= 2;
        return Math.max(dim, 8000);
    };

    var distances = [
        0, // 0
        128000, // 1
        64000, // 2
        32000, // 3
        32000, // 4
        16000, // 5
        8000, // 6
        4000, // 7
        2000, // 8
        2000, // 9
        1000 // 10
    ];
    var getLevelEndDistance = function (level) {
        // var dist = 64000;
        // for (var i = 2; i < level; i++)
        //     dist /= 2;

        var dist = distances[level];
        return dist;
    };

    var nearestPow2 = function( aSize ){
        return Math.pow( 2, Math.round( Math.log( aSize ) / Math.log( 2 ) ) );
    };

    function Level (dimension, startDistance) {
        this.dimension = dimension;
        this.startDistance = startDistance;
        this.data = {};
        /**
         * Array for storing references to level data in the form 'x_y', e.g. '374000_31000'.
         * When new data is loaded, reference is stored at the back, and when dataIds.length > dataLimit,
         * we remove unshift the first reference and remove the data there.
         */
        this.dataIds = [];
        this.lastQtCoordinates = new THREE.Vector3();
    }

    return {
        MAX_NUM_OF_RETRIES: 3,
        MAX_NUM_OF_TILES_PER_LEVEL: 100,

        updateInProgress: false,
        loadingInProgress: true,

        levels: {
            '2': new Level(getLevelDimension(2), getLevelEndDistance(1)),
            '4': new Level(getLevelDimension(4), getLevelEndDistance(2)),
            '6': new Level(getLevelDimension(6), getLevelEndDistance(4)),
            '8': new Level(getLevelDimension(8), getLevelEndDistance(6)),
        },
        level: 2,

        throttledUpdate: _.throttle(update, 500),

        getLevelDimension: getLevelDimension,
        getLevelEndDistance: getLevelEndDistance,

        init: function () {
            // Mark area as checked to prevent further loading
            LOD.levels[2].data[World.offset.x] = {};
            LOD.levels[2].data[World.offset.x][World.offset.y] = true;

            LOD.levels[2].lastQtCoordinates.x = World.offset.x;
            LOD.levels[2].lastQtCoordinates.y = World.offset.y;
        }
    };
})();

LOD.init();