var LOD = (function () {
    'use strict';


    /**
     * Loads new data if camera is in the right position.
     */
    var update = function () {
        if (!LOD.updateInProgress && !Data.loadingInProgress) {
            LOD.updateInProgress = true;
            var nextLevel,
                nextLevelIndex = 0;

            /*if (Controls.camera.position.z < getLevelDistance(6)) {
                nextLevel = 8;
                nextLevelIndex = 3;
            } else */
            if (Controls.camera.position.z < getLevelDistance(4)) {
                nextLevel = 6;
                nextLevelIndex = 2;
            } else if (Controls.camera.position.z < getLevelDistance(2)) {
                nextLevel = 4;
                nextLevelIndex = 1;
            } else
                nextLevel = 2;

            if (nextLevel > LOD.level) {
                console.log('LOD update. Level: ', nextLevel);

                // var intStart = performance.now();
                // intersection = World.getViewIntersection();
                // console.log('intersetion calculation: ', performance.now() - intStart);

                var x = Controls.controls.target.x,//intersection.point.x,//
                    y = Controls.controls.target.y;//intersection.point.y;//

                var levelDim = getLevelDimension(nextLevel);

                var qtNode = World.searchQtree(x, y, levelDim);
                if (qtNode === null) {
                    // Target x and y are out of the world
                    LOD.updateInProgress = false;
                } else {
                    LOD.level = nextLevel;
                    // Check if level is allready loaded at this coordinates
                    var testLod = lods[qtNode.x + '_' + qtNode.y];
                    if (testLod && testLod.levels.length <= nextLevelIndex) {
                        Data.loadData(LOD.level, qtNode.x, qtNode.y);
                    }
                }
            } else if (nextLevel < LOD.level) {
                // if (LOD.level == 7) {
                //     // Remove previous, more detailed levels
                //     while (loadedLevels.length > 0) {
                //         var loadedLevel = loadedLevels.pop();

                //         if (loadedLevel) {
                //             console.log(loadedLevel);

                //             World.scene.remove(loadedLevel);
                //             loadedLevel.geometry.dispose();
                //             loadedLevel.material.dispose();
                //             loadedLevel = null;
                //         }
                //     }
                // }

                LOD.level = nextLevel;

                //World.reset();
            }

            LOD.updateInProgress = false;
        }
    };

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
    var getLevelDistance = function (level) {
        // var dist = 64000;
        // for (var i = 2; i < level; i++)
        //     dist /= 2;

        var dist = distances[level];
        return dist;
    };

    return {
        updateInProgress: false,
        level: 2,
        update: update,
        getLevelDimension: getLevelDimension,
        getLevelDistance: getLevelDistance
    };
})();