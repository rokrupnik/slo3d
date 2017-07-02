
'use strict';

if ( ! Detector.webgl ) {

    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";
}

var container = document.getElementById( 'container' ),
    stats;

var intersection;

var lods = {};
var loadedLevels = [];

var clock;