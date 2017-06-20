
'use strict';

if ( ! Detector.webgl ) {

    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";
}

var container = document.getElementById( 'container' ),
    stats;

var camera, controls, scene, renderer, rayCaster, targetOnScreen;

var triangles, baseMesh, detailedMesh, detailedGeometry, material, texture, intersection, worldData;

var xOffset = 374000, yOffset = 31000;
var worldWidth = 256000, worldDepth = 256000,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2,
worldDataWidth, worldDataDepth;

var clock;