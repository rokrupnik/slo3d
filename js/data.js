var Data = (function () {
    'use strict';

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
            halfWidth: null,
            lodDistance: null
        },

        init: function () {
            // Data.img = new Image();
            // Data.img.addEventListener("load", onInitialDataLoad);
            // Data.img.src = Data.initialHeightMap;
        }
    };

})();

Data.init();