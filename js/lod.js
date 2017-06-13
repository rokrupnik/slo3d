var LOD = (function () {
    'use strict';


    /**
     * Loads new data if camera is in the right position.
     */
    var update = function () {
        if (!LOD.updateInProgress) {
            LOD.updateInProgress = true;
            var nextLevel;

            //intersection = World.getViewIntersection();

            if (camera.position.z < 3000)
                nextLevel = 8;
            else
                nextLevel = 6;

            if (nextLevel > LOD.level) {
                console.log('LOD update');

                var x = controls.target.x,//intersection.point.x,
                    y = controls.target.y;//intersection.point.y;

                var levelDim = getLevelDimension(nextLevel);

                var qtNode = World.searchQtree(x, y, levelDim);
                if (qtNode === null) {
                    // Target x and y are out of the world are
                    LOD.updateInProgress = false;
                } else {
                    LOD.level = nextLevel;
                    Data.loadData(LOD.level, qtNode.x, qtNode.y);
                    Texture.loadTexture(LOD.level, qtNode.x, qtNode.y);
                }
            } else if (nextLevel < LOD.level) {
                LOD.level = nextLevel;

                World.reset();

                LOD.updateInProgress = false;
            } else {
                LOD.updateInProgress = false;
            }

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
        return dim;
    };

    return {
        updateInProgress: false,
        level: 6,
        update: update,
        getLevelDimension: getLevelDimension
    };
})();