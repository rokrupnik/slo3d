var Texture = (function () {
    'use strict';

    /**
     * Generates an url for ortofoto map service.
     * @param {Array} xy0
     * @param {Array} xy1
     * @param {Array} imgSize E.g.: [2048, 2048]
     * @param {string} format png|jpg
     */
    var generateUrl = function (xy0, xy1, imgSize, format, reprojectionNotNeeded) {
        if (!format) {
            format = 'jpg';
        }
        if (!reprojectionNotNeeded) {
            xy0 = World.d96tm2d48gk(xy0);
            xy1 = World.d96tm2d48gk(xy1);
        }

        return 'http://gis.arso.gov.si/arcgis/rest/services/DOF25_2014_2015/MapServer/export?bbox=' + xy0[0] + '%2C' + xy0[1] + '%2C' + xy1[0] + '%2C' + xy1[1] + '&bboxSR=102060&layers=&layerDefs=&size=' + imgSize[0] + '%2C' + imgSize[1] + '&imageSR=&format=' + format + '&transparent=true&dpi=&time=&layerTimeOptions=&dynamicLayers=&gdbVersion=&mapScale=&f=image';
    }

    return {
        loader: null,
        generateUrl: generateUrl,

        init: function () {
            Texture.loader = new THREE.TextureLoader();
            Texture.loader.setCrossOrigin('anonymous');
        }
    };
})();

Texture.init();
