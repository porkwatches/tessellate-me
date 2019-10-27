document.addEventListener('DOMContentLoaded', function () {
  'use strict'

  // get the interact variable from the parent window
//  var interact = window.parent.interact

  var sns = 'http://www.w3.org/2000/svg'
  var xns = 'http://www.w3.org/1999/xlink'
  var root = document.getElementById('star-demo')
  var path = document.getElementById('path1')

  var rootMatrix
  var originalPoints = []
  var transformedPoints = []

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

  var pathPoints = pathToArray(path)
  console.log(arrayToPath(pathPoints))

  
  for (var i = 1, len = pathPoints.length; i < len - 1; i++) {
    var handle = document.createElementNS(sns, 'use')

    var newPoint = root.createSVGPoint()
	console.log(handle)

	console.log(i)
    handle.setAttributeNS(xns, 'href', '#point-handle')
    handle.setAttribute('class', 'point-handle')

    handle.x.baseVal.value = newPoint.x = pathPoints[i][0]
    handle.y.baseVal.value = newPoint.y = pathPoints[i][1]

    handle.setAttribute('data-index', i)

    originalPoints.push(newPoint)
    console.log(newPoint)

    root.appendChild(handle)
  }


  function applyTransforms (event) {
    // rootMatrix changes when the window is resized;
    // remains the same otherwise (even when dragging handles around) 
    console.log("CALLING applyTransforms")
    rootMatrix = root.getScreenCTM()

    transformedPoints = originalPoints.map(function (point) {
      return point.matrixTransform(rootMatrix)
    })

    interact('.point-handle', { context: document }).draggable({
      snap: {
        targets: transformedPoints,
        range: 20 * Math.max(rootMatrix.a, rootMatrix.d)
      }
    })

  }


  interact(root, { context: document }).on('down', applyTransforms)

  interact('.point-handle', { context: document })
    .draggable({
      onstart: function (event) {
        console.log("DRAGGIN'")
        root.setAttribute('class', 'dragging')
      },
      onmove: function (event) {
        // on each move tick
        // changes x and y of point-handle element (or maybe the polygon's point?)
        // (however x and y don't change in the document)
        // event is dragmove (?)
        // event.target is a point-handle element

        console.log("MOVIN'")
        console.log(event)
        console.log(event.target)
        var i = event.target.getAttribute('data-index') | 0
        var point = pathToArray(path)[i]

        console.log("MAT:")
        console.log(rootMatrix.a)
        console.log(rootMatrix.d)
        point[0] += event.dx / rootMatrix.a
        point[1] += event.dy / rootMatrix.d

        event.target.x.baseVal.value = point[0]
        event.target.y.baseVal.value = point[1]
        console.log("EVENT TARGET")
        console.log(event.target)

        pathPoints[i][0] = point[0]
        pathPoints[i][1] = point[1]
        var newPath = arrayToPath(pathPoints)
		path.setAttribute("d", newPath)
        var pp = pathToArray(path)
        console.log("NEW PATH")
        console.log(path.getAttribute("d"))

      },
      onend: function (event) {
        console.log("ONEND")
        root.setAttribute('class', '')
      },
      restrict: { restriction: document.rootElement }
    })
    .styleCursor(false)

  document.addEventListener('dragstart', function (event) {
    event.preventDefault()
  })

})
