var LOD = (function () {
    'use strict';

    /**
     * Loads new data if camera is in the right position.
     */
    var update = function () {
        if (!LOD.updateInProgress && !Controls.movementInProgress) {
            LOD.updateInProgress = true;

            var nextLevel = 2;

            var x = Controls.controls.target.x,//Controls.camera.position.x,//intersection.point.x,//
                y = Controls.controls.target.y,//Controls.camera.position.y,//intersection.point.y;//
                z = Controls.camera.position.z;

            // Detect LOD level
            _.forEachRight(LOD.levels, function (level, levelId) {
                levelId = parseInt(levelId);
                if (z < level.startDistance) {
                    nextLevel = Math.max(nextLevel, levelId);

                    // Update all active levels if:
                    // (they are not updated AND
                    // the location has changed enough) OR
                    // (there was some movement AND
                    // LOD level increased)
                    if (
                        (
                            level.isWaitingForUpdate &&
                            !LOD.tooCloseToLastLODUpdate
                        ) ||
                        (
                            (
                                LOD.lastLoadingCoordinates.x !== Controls.controls.target.x ||
                                LOD.lastLoadingCoordinates.y !== Controls.controls.target.y
                            ) &&
                            nextLevel > LOD.level
                        )
                    ) {
                        updateLevel(levelId, level.dimension, x, y);
                    }                    
                }
            });

            LOD.level = nextLevel;
            LOD.updateInProgress = false;
        }
    };

    var updateLevel = function (levelId, levelDim, x, y) {
        // Allow to move the mesh in the appropriate position
        Controls.updateTilesLocation();

        // Load heightMap and ortoFoto for all tiles, first for tiles in the center
        
        for(var i = 0; i < World.terrain.children.length; i++) {
            if (i < 40) {
                Controls.signalRequestStart();
            }
            loadHeightMapAndOrtofoto(
                LOD.serverSideLevels[World.terrain.children[i].material.uniforms.uScale.value/LOD.OVERLAP],
                World.terrain.children[i].material.uniforms.uScale.value,
                World.terrain.children[i].material.uniforms.uTileOffset.value.x + x,
                World.terrain.children[i].material.uniforms.uTileOffset.value.y + y,
                World.terrain.children[i].material.uniforms,
                i
            );
        }

        // We update only the most detailed level, mark all others as loaded
        _.forEach(LOD.levels, function (level, levelId) {
            level.isWaitingForUpdate = false;
        });

        LOD.lastLoadingCoordinates.x = x;
        LOD.lastLoadingCoordinates.y = y;
        Controls.movingDisabled = true;
        LOD.tooCloseToLastLODUpdate = true;
    };

    var loadHeightMapAndOrtofoto = function (levelId, levelDim, x, y, tileShaderUniforms, i) {
        // Start loading heightmap
        
        Texture.loader.load(
            'http://212.235.189.233:8888/heightmaps?x=' + x + '&y=' + y + '&dim=' + levelDim + '&levelId=' + levelId,
            handleLoadedHeightMap(levelId, levelDim, x, y, tileShaderUniforms, i),
            null,
            function (response) {
                console.error('HeightMap loading failed', levelId, x, y, response);
                if (i < 40) {
                    Controls.signalRequestEnd();
                }
            }
        );
    };

    var handleLoadedHeightMap = function (levelId, levelDim, x, y, tileShaderUniforms, i) {
        var ortoFotoResolution = getLevelOrtofotoResolutions(levelId);
        return function (heightMap) {
            var handleFailedOrtofoto = function (numberOfRetries) {
                if (numberOfRetries > 0) {
                    console.warn('Ortofoto loading failed. Retrying, number of retries left: ', numberOfRetries, levelId, x, y);
                    Texture.loader.load(
                        Texture.generateUrl([x,y], [(x + levelDim),(y + levelDim)], [ortoFotoResolution, ortoFotoResolution]),
                        handleLoadedOrtofoto(levelId, levelDim, x, y, heightMap, tileShaderUniforms, i),
                        null,
                        function () {
                            handleFailedOrtofoto(numberOfRetries - 1);
                        }
                    );
                } else {
                    console.error('Ortofoto loading failed.', levelId, x, y);
                    // At least use the loaded heightmap
                    sendTexturesToShaders(levelId, levelDim, x, y, heightMap, null, tileShaderUniforms);
                }
            };
            // Start loading ortoFoto
            Texture.loader.load(
                Texture.generateUrl([x,y], [(x + levelDim),(y + levelDim)], [ortoFotoResolution, ortoFotoResolution]),
                handleLoadedOrtofoto(levelId, levelDim, x, y, heightMap, tileShaderUniforms, i),
                null,
                function () {
                    handleFailedOrtofoto(LOD.MAX_NUM_OF_RETRIES);
                }
            );
        };
    };

    var handleLoadedOrtofoto = function (levelId, levelDim, x, y, heightMap, tileShaderUniforms, i) {
        return function (ortoFotoTexture) {
            sendTexturesToShaders(levelId, levelDim, x, y, heightMap, ortoFotoTexture, tileShaderUniforms, i);
        };
    };

    var sendTexturesToShaders = function (levelId, levelDim, x, y, heightMap, ortoFotoTexture, tileShaderUniforms, i) {
        // Send textures to shader and signal that tile textures are active now
        tileShaderUniforms.uTileHeightMap.value = heightMap;
        tileShaderUniforms.uTileOrtoFoto.value = ortoFotoTexture;
        tileShaderUniforms.uGlobalTexturesActive.value = false;
        tileShaderUniforms.uTileTexturesActive.value = true;

        //LOD.loadingInProgress = false;

        if (i < 40) {
            Controls.signalRequestEnd();
        }
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
        return Math.max(dim, 4000);
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

    var resolutions = [
        32, // 0
        32, // 1
        32, // 2
        64, // 3
        256, // 4
        256, // 5
        256, // 6
        256, // 7
        512, // 8
        512, // 9
        1024 // 10
    ];
    var getLevelOrtofotoResolutions = function (level) {
        return resolutions[level];
    };

    var nearestPow2 = function( aSize ){
        return Math.pow( 2, Math.round( Math.log( aSize ) / Math.log( 2 ) ) );
    };

    function Level (dimension, startDistance) {
        this.dimension = dimension;
        this.startDistance = startDistance;
        // this.data = {};
        /**
         * Array for storing references to level data in the form 'x_y', e.g. '374000_31000'.
         * When new data is loaded, reference is stored at the back, and when dataIds.length > dataLimit,
         * we remove unshift the first reference and remove the data there.
         */
        // this.dataIds = [];
        // this.lastQtCoordinates = new THREE.Vector3();
        this.isWaitingForUpdate = false;
    }

    return {
        MAX_NUM_OF_RETRIES: 5,
        MAX_NUM_OF_TILES_PER_LEVEL: 100,
        MIN_DISTANCE_TO_RELOAD: 4000,
        OVERLAP: 1.05, // To prevent seams

        updateInProgress: false,
        loadingInProgress: true,
        tooCloseToLastLODUpdate: false,

        lastLoadingCoordinates: new THREE.Vector2(),

        serverSideLevels: {},

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
            // LOD.levels[2].data[World.offset.x] = {};
            // LOD.levels[2].data[World.offset.x][World.offset.y] = true;

            // LOD.levels[2].lastQtCoordinates.x = World.offset.x;
            // LOD.levels[2].lastQtCoordinates.y = World.offset.y;
        }
    };
})();

LOD.init();