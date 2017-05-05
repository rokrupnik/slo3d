clock = new THREE.Clock();

function init(heights, dataWidth, dataDepth, hmin, hmax) {
    worldDataWidth = dataWidth;
    worldDataDepth = dataDepth;

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );

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
    var colors = new Uint8Array( triangles * 3 * 3 );
    var color = new THREE.Color();
    //var n = 800, n2 = n/2;  // triangles spread in the cube
    //var d = 12, d2 = d/2;   // individual triangle size
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

    var rmin = 0, rmax = 255;
    var gmin = 0, gmax = 255;
    var bmin = 0, bmax = 255;

    var start = performance.now();
    for (var d = 0, ipnc = 0; d < dataDepth - 1; d++) {
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

            // colors
            // (k*low.red + (1-k)*hi.red,
            // k*low.green + (1-k)*hi.green,
            // k*low.blue + (1-k)*hi.blue)
            // where k = (height-minHeight) / (maxHeight-minHeight).
            var ak = (az - hmin) / (hmax - hmin);
            var bk = (bz - hmin) / (hmax - hmin);
            var ck = (cz - hmin) / (hmax - hmin);
            var dk = (dz - hmin) / (hmax - hmin);
            // First triangle
            colors[ ipnc ]     = ((1 - ak) * rmin) + (ak * rmax);
            colors[ ipnc + 1 ] = ((1 - ak) * gmin) + (ak * gmax);
            colors[ ipnc + 2 ] = ((1 - ak) * bmin) + (ak * bmax);
            colors[ ipnc + 3 ] = ((1 - bk) * rmin) + (bk * rmax);
            colors[ ipnc + 4 ] = ((1 - bk) * gmin) + (bk * gmax);
            colors[ ipnc + 5 ] = ((1 - bk) * bmin) + (bk * bmax);
            colors[ ipnc + 6 ] = ((1 - ck) * rmin) + (ck * rmax);
            colors[ ipnc + 7 ] = ((1 - ck) * gmin) + (ck * gmax);
            colors[ ipnc + 8 ] = ((1 - ck) * bmin) + (ck * bmax);
            // Second triangle
            colors[ ipnc + 9 ]  = ((1 - ck) * rmin) + (ck * rmax);
            colors[ ipnc + 10 ] = ((1 - ck) * gmin) + (ck * gmax);
            colors[ ipnc + 11 ] = ((1 - ck) * bmin) + (ck * bmax);
            colors[ ipnc + 12 ] = ((1 - bk) * rmin) + (bk * rmax);
            colors[ ipnc + 13 ] = ((1 - bk) * gmin) + (bk * gmax);
            colors[ ipnc + 14 ] = ((1 - bk) * bmin) + (bk * bmax);
            colors[ ipnc + 15 ] = ((1 - dk) * rmin) + (dk * rmax);
            colors[ ipnc + 16 ] = ((1 - dk) * gmin) + (dk * gmax);
            colors[ ipnc + 17 ] = ((1 - dk) * bmin) + (dk * bmax);

            ipnc += 18;
        }
    }

    console.log('basic mesh', performance.now() - start);

    geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3, true ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3, true ) );

    // Reset memory
    indices = null;
    positions = null;
    normals = null;
    colors = null;

    //geometry.computeBoundingSphere();

    material = new THREE.MeshLambertMaterial( {
        //color: 0xaaaaaa, specular: 0xffffff, shininess: 250, side: THREE.DoubleSide ,
        vertexColors: THREE.VertexColors, shading: THREE.SmoothShading
    } );
    baseMesh = new THREE.Mesh( geometry, material );
    scene.add( baseMesh );

    // axes

    // var axes = new THREE.AxisHelper( worldDepth );
    // scene.add( axes );

    //

    container.innerHTML = "";

    container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    controls.handleResize();

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