var World = (function () {
    'use strict';

    // Coordinates

    // http://gis.arso.gov.si/arcgis/rest/services/DOF25_2014_2015/MapServer/export?bbox=412000.0%2C98000.0%2C428000.0%2C114000.0&bboxSR=3794&layers=&layerDefs=&size=&imageSR=&format=png&transparent=true&dpi=&time=&layerTimeOptions=&dynamicLayers=&gdbVersion=&mapScale=&f=image

    var D48GK = "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=bessel +towgs84=430.8554,121.4779,459.6256,4.3787,4.3716,-11.9863,17.3666 +units=m +no_defs";
    var D96TM = "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

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
        World.renderer.setPixelRatio( window.devicePixelRatio );
        World.renderer.setSize( window.innerWidth, window.innerHeight );
    };

    return {
        bbox: null,
        scene: null,
        renderer: null,
        targetOnScreen: new THREE.Vector2(),
        rayCaster: new THREE.Raycaster(),
        terrain: new THREE.Group(),
        roughTerrain: new THREE.Group(),

        offset: new THREE.Vector3(374000, 31000, 0),
        cameraOffset: null,
        size: new THREE.Vector3(256000, 256000),
        center: null,

        d96tm2d48gk: d96tm2d48gk,

        initializeScene: initializeScene,
        initializeRenderer: initializeRenderer,
        init: function () {
            World.center = new THREE.Vector3(World.offset.x + World.size.x/2, World.offset.y + World.size.y/2, 0);

            World.bbox = {
                d96tm: {
                    xy0: [World.offset.x, World.offset.y],
                    xy1: [World.offset.x + World.size.x, World.offset.y + World.size.y]
                },
                d48gk: {
                    xy0: [0, 0],
                    xy1: [0, 0]
                }
            };

            World.bbox.d48gk.xy0 = proj4(D96TM, D48GK, World.bbox.d96tm.xy0);
            World.bbox.d48gk.xy1 = proj4(D96TM, D48GK, World.bbox.d96tm.xy1);
        }
    };
})();

World.init();