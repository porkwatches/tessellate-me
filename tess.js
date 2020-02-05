function tess () {
  'use strict'

  // get the interact variable from the parent window
//  var interact = window.parent.interact

  var sns = 'http://www.w3.org/2000/svg'
  var xns = 'http://www.w3.org/1999/xlink'
  var root = document.getElementsByTagName("svg")[0]
  var selectedPatternType = root.id
  var rootMatrix

  var edges = {
    tess: [
      ,"hor"
      ,"vert"
    ],
    template: [
      ,"hor"
      ,"vert"
    ],
    hex: [
      ,"path0"
      ,"path1"
      ,"path2"
    ]
  }

  var edgeContainer = {}
  for (var patternType in edges){
    // TODO: get rid of outer loop instead of skipping?
    if (patternType != selectedPatternType) continue

    edgeContainer[patternType] = {}
    for (var i in edges[patternType]){
      var edgeKey = edges[patternType][i]
      edgeContainer[patternType][edgeKey] = {
        path: document.getElementById(edgeKey),
        pathPoints: pathToArray(document.getElementById(edgeKey)),
      }
      initPoints(edgeKey, edgeContainer[patternType][edgeKey])
    }
  }

  function pathToArray(path){
  // split "M 100,100 125,104 150,100"
  // into [[100, 100], [124, 104], [150, 100]] (array of arrays of number)
    var pathPoints = path.getAttribute("d").split(' ').slice(1).map(x => x.split(','))
    pathPoints = pathPoints.map(str_point => str_point.map(str_n => parseFloat(str_n)))
    return pathPoints;
  };

  function arrayToPath(points){
  // inverse of pathToArray
    var pathString = "M"
	for (var i = 0, len = points.length; i < len; i++) {
      pathString += " "
      pathString += points[i][0] // cast to string explicitly?
      pathString += ","
      pathString += points[i][1]
    }
    return pathString;
  };

  function initPoints(edgeKey, edge){
    for (var i = 1, len = edge.pathPoints.length; i < len - 1; i++) {
      var handle = document.createElementNS(sns, 'use')

      var newPoint = root.createSVGPoint()
      handle.setAttributeNS(xns, 'href', '#point-handle')
      handle.setAttribute('class', 'point-handle')

      handle.x.baseVal.value = newPoint.x = edge.pathPoints[i][0]
      handle.y.baseVal.value = newPoint.y = edge.pathPoints[i][1]

      handle.setAttribute('edge-key', edgeKey)
      handle.setAttribute('data-index', i)

      root.appendChild(handle)
    }
  };


  function applyTransforms (event) {
    // rootMatrix changes when the window is resized;
    // remains the same otherwise (even when dragging handles around) 
    rootMatrix = root.getScreenCTM()
  }


  interact(root, { context: document }).on('down', applyTransforms)

  interact('.point-handle', { context: document })
    .draggable({
      onstart: function (event) {
        root.setAttribute('class', 'dragging')
      },
      onmove: function (event) {
        // on each move tick
        // changes x and y of point-handle element (or maybe the polygon's point?)
        // (however x and y don't change in the document)
        // event is dragmove (?)
        // event.target is a point-handle element

        var edgeKey = event.target.getAttribute('edge-key')
        var edge = edgeContainer[selectedPatternType][edgeKey]
        var i = event.target.getAttribute('data-index') | 0
        var point = pathToArray(edge.path)[i]
        var newPath

        point[0] += event.dx / rootMatrix.a
        point[1] += event.dy / rootMatrix.d

        event.target.x.baseVal.value = point[0]
        event.target.y.baseVal.value = point[1]

        edge.pathPoints[i][0] = point[0]
        edge.pathPoints[i][1] = point[1]

        newPath = arrayToPath(edge.pathPoints)
        edge.path.setAttribute("d", newPath)
      },
      onend: function (event) {
        root.setAttribute('class', '')
      },
      restrict: { restriction: document.rootElement }
    })
    .styleCursor(false)

  document.addEventListener('dragstart', function (event) {
    event.preventDefault()
  })
}

document.addEventListener('DOMContentLoaded', tess)