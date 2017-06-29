var Texture = (function () {
    'use strict';

    var onInitialTextureLoad = function () {
        Texture.context = Texture.canvas.getContext('2d');
        Texture.context.drawImage(Texture.textureImg, 0, 0, 4096, 4096);

        texture = new THREE.CanvasTexture(Texture.canvas);

        texture.flipY = false;

        Texture.textureImg = null;

        Texture.loadingInProgress = false;

        init(worldData, Data.img.width, Data.img.height, Data.hmin, Data.hmax);
    }

    /**
     * Generates an url for ortofoto map service.
     * @param {Array} xy0
     * @param {Array} xy1
     * @param {Array} imgSize E.g.: [2048, 2048]
     * @param {string} format png|jpg
     */
    var generateUrl = function (xy0, xy1, imgSize, format) {
        return 'http://gis.arso.gov.si/arcgis/rest/services/DOF25_2014_2015/MapServer/export?bbox=' + xy0[0] + '%2C' + xy0[1] + '%2C' + xy1[0] + '%2C' + xy1[1] + '&bboxSR=102060&layers=&layerDefs=&size=' + imgSize[0] + '%2C' + imgSize[1] + '&imageSR=&format=' + format + '&transparent=true&dpi=&time=&layerTimeOptions=&dynamicLayers=&gdbVersion=&mapScale=&f=image';
    }

    /**
     * Callback to handle the next level ortofoto texture, when it loads.
     */
    var onTextureLoad = function () {
        var xPx = Math.floor(((Texture.xyTmp[0] - xOffset) / worldWidth) * 4096),
            yPx = Math.floor((1 - ((Texture.xyTmp[1] + Texture.dimensionTmp - yOffset) / worldDepth)) * 4096),
            widthPx = Math.floor((Texture.dimensionTmp / worldWidth) * 4096),
            depthPx = Math.floor((Texture.dimensionTmp / worldDepth) * 4096);

        Texture.context.drawImage(Texture.textureImg, xPx, yPx, widthPx, depthPx);

        baseMesh.material.map.needsUpdate = true;

        Texture.textureImg = null;

        Texture.loadingInProgress = false;

        console.log('new texture loaded');
    }

    /**
     * Initiates loading of next LOD level ortofoto texture.
     * @param {number} level LOD level of texture to load
     * @param {number} x x component of bottom left coordinate of texture
     * @param {number} y y component of bottom left coordinate of texture
     */
    var loadTexture = function (level, x, y) {
        Texture.loadingInProgress = true;
        Texture.xyTmp = [x, y];

        Texture.dimensionTmp = LOD.getLevelDimension(level);

        Texture.textureImg = new Image();
        Texture.textureImg.addEventListener('load', onTextureLoad);
        Texture.textureImg.crossOrigin = 'anonymous';

        Texture.textureImg.src = generateUrl(World.d96tm2d48gk([x, y]), World.d96tm2d48gk([x + Texture.dimensionTmp, y + Texture.dimensionTmp]), [2048, 2048], 'jpg');
    }

    return {
        loadingInProgress: true,
        loadTexture: loadTexture,
        canvas: null,
        context: null,
        textureImg: null,
        xyTmp: [0,0],
        dimensionTmp: 2000,
        loader: null,
        generateUrl: generateUrl,

        init: function () {
            Texture.loader = new THREE.TextureLoader();
            Texture.loader.setCrossOrigin('anonymous');
            // Texture.canvas = document.createElement('canvas');

            // Texture.canvas.width = 4096;
            // Texture.canvas.height = 4096;

            // Texture.textureImg = new Image();
            // Texture.textureImg.addEventListener('load', onInitialTextureLoad);
            // Texture.textureImg.crossOrigin = 'anonymous';

            // Texture.textureImg.src = generateUrl(World.bbox.d48gk.xy0, World.bbox.d48gk.xy1, [2048, 2048], 'jpg');
        }
    };
})();

Texture.init();
