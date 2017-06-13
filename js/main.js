clock = new THREE.Clock();

function init(heights, dataWidth, dataDepth, hmin, hmax) {

    // Wait until both heights data and texture finishes loading
    if (Data.loadingInProgress || Texture.loadingInProgress) {
        return;
    }

    Data.img = null;

    worldDataWidth = dataWidth;
    worldDataDepth = dataDepth;

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 200000 );

    scene = new THREE.Scene();//

    //

    scene.add( new THREE.AmbientLight( 0x444444 ) );
    var light1 = new THREE.DirectionalLight( 0xffffff, 1.0 );
    light1.position.set( 1, 0, -1 );
    scene.add( light1 );

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xbfd1e5 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    //

    camera.position.x = xOffset + worldHalfWidth;
    camera.position.y = yOffset + 0;
    camera.position.z = heights[ (dataWidth / 2) * dataWidth + (dataDepth / 2) ] + worldHalfDepth;

    camera.up.set( 0, 0, 1 );

    //

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 1.0;
    controls.enableZoom = true;

    controls.target = new THREE.Vector3( xOffset + worldHalfWidth, yOffset + worldHalfDepth, 0 );

    //

    rayCaster = new THREE.Raycaster();
    targetOnScreen = new THREE.Vector2();

    //

    var triangles = (dataWidth - 1) * (dataDepth - 1) * 2;
    var geometry = new THREE.BufferGeometry();
    var indices = new Uint32Array( triangles * 3 );
    for ( var i = 0; i < indices.length; i ++ ) {
        indices[ i ] = i;
    }
    var positions = new Float32Array( triangles * 3 * 3 );
    var normals = new Int16Array( triangles * 3 * 3 );
    var uvs = new Float32Array( triangles * 3 * 2 );

    var pA = new THREE.Vector3();
    var pB = new THREE.Vector3();
    var pC = new THREE.Vector3();
    var pD = new THREE.Vector3();
    var cb = new THREE.Vector3();
    var ab = new THREE.Vector3();
    var db = new THREE.Vector3();

    var widthScale = worldWidth / dataWidth;
    var depthScale = worldDepth / dataDepth;
    var heightScale = 0.1;

    var start = performance.now();
    for (var d = 0, ipnc = 0, iuv = 0; d < dataDepth - 1; d++) {
        for (var w = 0; w < dataWidth - 1; w++) {
            var ih = d * dataDepth + w;

            var ax = xOffset + w                                * widthScale;
            var ay = yOffset + (dataDepth - d)                  * depthScale;
            var az =               (heights[ ih ])                  ;//* heightScale;
            var bx = xOffset + w                                * widthScale;
            var by = yOffset + (dataDepth - (d + 1))            * depthScale;
            var bz = (heights[ ih + dataWidth ])                    ;//* heightScale;
            var cx = xOffset + (w + 1)                          * widthScale;
            var cy = yOffset + (dataDepth - d)                  * depthScale;
            var cz =               (heights[ ih + 1 ])              ;//* heightScale;
            var dx = xOffset + (w + 1)                          * widthScale;
            var dy = yOffset + (dataDepth - (d + 1))            * depthScale;
            var dz =               (heights[ ih + dataWidth + 1 ])  ;//* heightScale;

            // First triangle - mind the triangles orientation
            positions[ ipnc ]     = ax;
            positions[ ipnc + 1 ] = ay;
            positions[ ipnc + 2 ] = az;
            positions[ ipnc + 3 ] = bx;
            positions[ ipnc + 4 ] = by;
            positions[ ipnc + 5 ] = bz;
            positions[ ipnc + 6 ] = cx;
            positions[ ipnc + 7 ] = cy;
            positions[ ipnc + 8 ] = cz;
            // Second triangle
            positions[ ipnc + 9 ]  = bx;
            positions[ ipnc + 10 ] = by;
            positions[ ipnc + 11 ] = bz;
            positions[ ipnc + 12 ] = dx;
            positions[ ipnc + 13 ] = dy;
            positions[ ipnc + 14 ] = dz;
            positions[ ipnc + 15 ] = cx;
            positions[ ipnc + 16 ] = cy;
            positions[ ipnc + 17 ] = cz;

            // flat face normals
            pA.set( ax, ay, az );
            pB.set( bx, by, bz );
            pC.set( cx, cy, cz );
            pD.set( dx, dy, dz );
            // First triangle
            cb.subVectors( pC, pB );
            ab.subVectors( pA, pB );
            ab.cross( cb );
            ab.normalize();
            var nx0 = ab.x;
            var ny0 = ab.y;
            var nz0 = ab.z;
            normals[ ipnc ]     = nx0 * 32767;
            normals[ ipnc + 1 ] = ny0 * 32767;
            normals[ ipnc + 2 ] = nz0 * 32767;
            normals[ ipnc + 3 ] = nx0 * 32767;
            normals[ ipnc + 4 ] = ny0 * 32767;
            normals[ ipnc + 5 ] = nz0 * 32767;
            normals[ ipnc + 6 ] = nx0 * 32767;
            normals[ ipnc + 7 ] = ny0 * 32767;
            normals[ ipnc + 8 ] = nz0 * 32767;
            // Second triangle
            db.subVectors( pD, pB );
            cb.subVectors( pC, pB );
            cb.cross( db );
            cb.normalize();
            var nx1 = cb.x;
            var ny1 = cb.y;
            var nz1 = cb.z;
            normals[ ipnc + 9 ]  = nx1 * 32767;
            normals[ ipnc + 10 ] = ny1 * 32767;
            normals[ ipnc + 11 ] = nz1 * 32767;
            normals[ ipnc + 12 ] = nx1 * 32767;
            normals[ ipnc + 13 ] = ny1 * 32767;
            normals[ ipnc + 14 ] = nz1 * 32767;
            normals[ ipnc + 15 ] = nx1 * 32767;
            normals[ ipnc + 16 ] = ny1 * 32767;
            normals[ ipnc + 17 ] = nz1 * 32767;

            // uvs
            // First triangle
            uvs[ iuv ]     = w  / dataWidth;
            uvs[ iuv + 1 ] = d / dataDepth;
            uvs[ iuv + 2 ] = w  / dataWidth;
            uvs[ iuv + 3 ] = (d + 1) / dataDepth;
            uvs[ iuv + 4 ] = (w + 1)  / dataWidth;
            uvs[ iuv + 5 ] = d / dataDepth;
            // Second triangle
            uvs[ iuv + 6 ]  = (w + 1)  / dataWidth;
            uvs[ iuv + 7 ]  = d / dataDepth;
            uvs[ iuv + 8 ]  = w  / dataWidth;
            uvs[ iuv + 9 ]  = (d + 1) / dataDepth;
            uvs[ iuv + 10 ] = (w + 1)  / dataWidth;
            uvs[ iuv + 11 ] = (d + 1) / dataDepth;

            ipnc += 18;
            iuv += 12;
        }
    }

    console.log('basic mesh', performance.now() - start);

    geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3, true ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

    // Reset memory
    indices = null;
    positions = null;
    normals = null;
    uvs = null;

    //geometry.computeBoundingSphere();

    // axes

    // var axes = new THREE.AxisHelper( worldDepth );
    // scene.add( axes );

    // material

    material = new THREE.MeshLambertMaterial( {
        //side: THREE.DoubleSide ,
        //vertexColors: THREE.FaceColors,
        shading: THREE.FlatShading,
        map: texture
    } );

    // mesh

    baseMesh = new THREE.Mesh( geometry, material );
    scene.add( baseMesh );

    container.innerHTML = "";

    container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );

    //

    window.addEventListener( 'resize', onWindowResize, false );

    animate();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

    LOD.update();

}

function render() {

    controls.update( clock.getDelta() );
    renderer.render( scene, camera );

}