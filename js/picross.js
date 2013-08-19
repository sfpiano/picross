var container, stats;
var camera, scene, renderer;
var projector, raycaster;
var mouse = new THREE.Vector2();
var controls;
var theta = 0;
var radius = 100;
var tOldMesh = null;
var tMouseDown = false;
var tMarkedColor = 0x00ff00;
var tErrorColor = 0xff0000;
var tSelectedColor = 0xff5500;
var tDefaultColor = 0x000000;

var tLevelIndex = 1;
var tWidth = 0, tHeight = 0, tDepth = 0;
var blocks = [];
var tRemainingBlocks = 0;
/*var tWidth = 4, tHeight = 3, tDepth = 2;
var blocks = [
  [
    [0, 1, 1, 0], // Back
    [0, 1, 1, 0],
    [0, 1, 1, 0]  // Top
  ],
  [
    [1, 1, 1, 0], // Front, Bottom
    [0, 1, 1, 0],
    [0, 0, 1, 0]
  ]
];*/

$.getJSON('http://localhost:8888/json/levels.json',
   function(result) {
     var tLevel = result.levels[tLevelIndex];
     tWidth = tLevel.W;
     tHeight = tLevel.H;
     tDepth = tLevel.D;
     blocks = tLevel.B;

     loadLevel();
})
.fail(function(jqxhr, textStatus, error) {
  var err = textStatus + ', ' + error;
  console.log( "Request Failed: " + err);
});

function loadLevel() {
  tRemainingBlocks = (tDepth * tWidth * tHeight);
  for (var i=0; i<tDepth; i++) {
    for (var j=0; j<tHeight; j++) {
      for (var k=0; k<tWidth; k++) {
        tRemainingBlocks -= blocks[i][j][k];
      }
    }
  }

  init();
  animate();
}

function init() {
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );

  scene = new THREE.Scene();

  var light = new THREE.DirectionalLight( 0xffffff);
  light.position.set( 1, 1, 1 ).normalize();
  scene.add( light );
  var light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( -1, -1, -1 ).normalize();
  scene.add( light );

  var blockTex = [
    new THREE.ImageUtils.loadTexture('img/0.png'),
    new THREE.ImageUtils.loadTexture('img/1.png'),
    new THREE.ImageUtils.loadTexture('img/2.png'),
    new THREE.ImageUtils.loadTexture('img/3.png'),
    new THREE.ImageUtils.loadTexture('img/4.png'),
    new THREE.ImageUtils.loadTexture('img/5.png'),
    new THREE.ImageUtils.loadTexture('img/6.png')
  ];

  var kBlockSize = 10;
  for (var k = 0; k < tDepth; k++) {
    for (var i = 0; i < tHeight; i++) {
      for (var j = 0; j < tWidth; j++) {
        var geometry = new THREE.CubeGeometry(kBlockSize, kBlockSize, kBlockSize);
        //var material = new THREE.MeshLambertMaterial( {color: 0x0000ff} );
        //var mesh = new THREE.Mesh( geometry, material );

        var materials = [
          new THREE.MeshLambertMaterial( {map: blockTex[0], color: 0xffffff, side: THREE.FrontSide} ),
          new THREE.MeshLambertMaterial( {map: blockTex[1], color: 0xffffff, side: THREE.FrontSide} ),
          new THREE.MeshLambertMaterial( {map: blockTex[2], color: 0xffffff, side: THREE.FrontSide} ),
          new THREE.MeshLambertMaterial( {map: blockTex[3], color: 0xffffff, side: THREE.FrontSide} ),
          new THREE.MeshLambertMaterial( {map: blockTex[4], color: 0xffffff, side: THREE.FrontSide} ),
          new THREE.MeshLambertMaterial( {map: blockTex[5], color: 0xffffff, side: THREE.FrontSide} ),
          new THREE.MeshLambertMaterial( {map: blockTex[6], color: 0xffffff, side: THREE.FrontSide} )
        ];

        {
          var sum = 0;
          // Right/Left
          for (var tCtr=0; tCtr<tWidth; tCtr++) {
            sum += blocks[k][i][tCtr];
          }
          geometry.faces[0].materialIndex = sum;
          geometry.faces[1].materialIndex = sum;
          sum = 0;

          // Top/Bottom
          for (var tCtr=0; tCtr<tHeight; tCtr++) {
            sum += blocks[k][tCtr][j];
          }
          geometry.faces[2].materialIndex = sum;
          geometry.faces[3].materialIndex = sum;
          sum = 0;

          // Front/Back
          for (var tCtr=0; tCtr<tDepth; tCtr++) {
            sum += blocks[tCtr][i][j];
          }
          geometry.faces[4].materialIndex = sum;
          geometry.faces[5].materialIndex = sum;
        }

        // 2
        //1 0 4 Front, 5 Back
        // 3
        var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

        mesh.position.x = j*kBlockSize;
        mesh.position.y = i*kBlockSize;
        mesh.position.z = k*kBlockSize;
        mesh.translateX(-(tWidth-1)*kBlockSize/2);
        mesh.translateY(-(tHeight-1)*kBlockSize/2);

        mesh.indexI = i;
        mesh.indexJ = j;
        mesh.indexK = k;
        scene.add(mesh);
      }
    }
  }

  container = document.createElement('div');
  document.body.appendChild(container);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  projector = new THREE.Projector();
  raycaster = new THREE.Raycaster();

  camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
  camera.lookAt( scene.position );

  controls = new THREE.TrackballControls(camera);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = false;
  controls.dynamicDampingFactor = 0.3;

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild(stats.domElement); 

  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );

  window.addEventListener( 'resize', onWindowResize, false );
}

function animate() {
  controls.update();
  stats.update();
  render();

  requestAnimationFrame( animate );
}

function checkBlocks(event) {
  if (tOldMesh && tMouseDown) {
    if (event.shiftKey) {
      if (tOldMesh.currentHex != tErrorColor) {
        var tNewColor =
          (tOldMesh.currentHex == tDefaultColor) ? tMarkedColor : tDefaultColor;
        for (var i=0; i<6; i++)
          tOldMesh.material.materials[i].emissive.setHex(tNewColor);
        tOldMesh.currentHex = tNewColor;
      }
    }
    else if (tOldMesh.currentHex == tDefaultColor) {
      if (blocks[tOldMesh.indexK][tOldMesh.indexI][tOldMesh.indexJ] == 0) {
        scene.remove(tOldMesh);
        tOldMesh.geometry.dispose();
        for (var i=0; i<tOldMesh.material.length; i++) {
          tOldMesh.material[i].dispose();
        }
        tOldMesh = null;
        tRemainingBlocks--;

        if (tRemainingBlocks == 0) {
          document.body.style.backgroundColor = "#009900";
        }
      }
      else {
        for (var i=0; i<6; i++)
          tOldMesh.material.materials[i].emissive.setHex(tErrorColor);
        tOldMesh.currentHex = tErrorColor;
      }
    }
  }
}

function onDocumentMouseMove( event ) {
  event.preventDefault();

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onDocumentMouseDown(event) {
  tMouseDown = true;
  checkBlocks(event);
}

function onDocumentMouseUp(event) {
  tMouseDown = false;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  render();
}

function onWindowKeyDown(event) {
}

function onWindowKeyUp(event) {
}

function render() {
  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  projector.unprojectVector( vector, camera );

  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

  var tIntersects = raycaster.intersectObjects( scene.children );
  if (tIntersects.length > 0) {
    if (tOldMesh != tIntersects[0].object) {
      if (tOldMesh) {
        for (var i=0; i<6; i++)
          tOldMesh.material.materials[i].emissive.setHex(tOldMesh.currentHex);
      }
      tOldMesh = tIntersects[0].object;
      tOldMesh.currentHex = tOldMesh.material.materials[0].emissive.getHex();

      for (var i=0; i<6; i++)
        tOldMesh.material.materials[i].emissive.setHex(tSelectedColor);
    }
  }
  else {
    if (tOldMesh) {
      for (var i=0; i<6; i++)
        tOldMesh.material.materials[i].emissive.setHex(tOldMesh.currentHex);
      tOldMesh = null;
    }
  }

  renderer.render( scene, camera );
}
