var sns = 'http://www.w3.org/2000/svg'
var xns = 'http://www.w3.org/1999/xlink'

var paths = { }

function vectorSum(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y,
    }
}

function fillMidpoints(first, last, nMidpoints) {
    var xDiff = last.x - first.x
    var xStep = xDiff / (nMidpoints + 1)
    var yDiff = last.y - first.y
    var yStep = yDiff / (nMidpoints + 1)
    var points = []
    points.push(first)
	for (var i = 1; i <= nMidpoints; i++) {
        var p = {
            x: first.x + xStep * i,
            y: first.y + yStep * i,
        }
        points.push(p)
    }
    points.push(last)
    return points
}

function createSegment(
    document,
    svg,
    p1,
    p2,
    coordCenter,
    nMidpoints,
) {
    p1 = vectorSum(p1, coordCenter)
    p2 = vectorSum(p2, coordCenter)

    var drawCommands = "M"

    var points = fillMidpoints(p1, p2, nMidpoints)
    for (var i = 0, len = points.length; i < len; i++) {
        drawCommands += ` ${points[i].x},${points[i].y}`
    }

    var handle = document.createElementNS(sns, 'path')
    id = "path" + Object.keys(paths).length
    paths[id] = {
        id: id,
        startPoint: p1,
    }
    handle.setAttribute("id", id)
    handle.setAttribute("d", drawCommands)
    handle.setAttribute(
        "style",
        "fill:none;stroke:#000000;stroke-width:2px")
    svg.getElementById("geo").appendChild(handle)
    return paths[id]
}

function calcSquareOffsets(segLength, nRows, nCols, coordCenter) {
    offX = offY = segLength
    offsets = []
    for (var r = -2; r < nRows; r++) {
        colOffsets = []
        for (var c = -2; c < nCols; c++) {
            x = c * offX
            y = r * offY
            p = { x: x, y: y }
            p = vectorSum(p, coordCenter)
            colOffsets.push(p)
        }
        offsets.push(colOffsets)
    }
    return offsets
}

function calcHexOffsets(segLength, nRows, nCols, coordCenter) {
    // Matrix of relative coordinates of centers of each 3-spike
    // in a hex grid (in px)

    offX = 3 / 2 * Math.sqrt(3) * segLength
    offY = 3 / 2 * segLength
    offsets = []
    oddRow = true
    for (var r = -2; r < nRows; r++) {
        colOffsets = []
        for (var c = -2; c < nCols; c++) {
            var xShift = r % 2 ? 1 : 0
            x = (xShift + 2 * c) * offX
            y = r * offY
            p = {x: x, y: y}
            p = vectorSum(p, coordCenter)
            colOffsets.push(p)
        }
        offsets.push(colOffsets)
        oddRow = !oddRow
    }
    return offsets
}

function addClone(document, svg, segment, basePoint, rot, pivot) {
    var handle = document.createElementNS(sns, 'use')
    handle.setAttributeNS(xns, 'href', `#${segment.id}`)
    var transformations = ` rotate(${rot} ${pivot.x} ${pivot.y})`
    transX = basePoint.x - segment.startPoint.x
    transY = basePoint.y - segment.startPoint.y
    transformations += ` translate(${transX},${transY})`
    handle.setAttribute("transform", transformations)
    svg.getElementById("geo").appendChild(handle)
}

function addSquareClone(document, svg, parentSegment, center) {
    addClone(document, svg, parentSegment, center, 0, center)
}

function addSpike(document, svg, parentSegment, center) {
    addClone(document, svg, parentSegment, center, 0, center)
    addClone(document, svg, parentSegment, center, 120, center)
    addClone(document, svg, parentSegment, center, 240, center)
}

function createSquareTemplate(
    document,
    svg,
    edgeLength,
    coordCenter,
    nRows,
    nCols,
    nMidpoints,
) {

    // vertical edge
    var s1 = createSegment(
        document,
        svg,
        {x: 0, y: 0},
        {x: 0, y: edgeLength},
        coordCenter,
        nMidpoints,
    )

    // horizontal edge
    var s2 = createSegment(
        document,
        svg,
        {x: 0, y: 0},
        {x: edgeLength, y: 0},
        coordCenter,
        nMidpoints,
    )

    var offsetMatrix = calcSquareOffsets(
        edgeLength,
        nRows,
        nCols,
        coordCenter,
    )

    var firstPoint = true
    for (var r = 0, nr = offsetMatrix.length; r < nr; r++) {
        for (var p = 0, nc = offsetMatrix[r].length; p < nc; p++) {
            if (firstPoint == true) {
                firstPoint = false
                continue
            }
            var point = offsetMatrix[r][p]
            addSquareClone(document, svg, s1, point)
            addSquareClone(document, svg, s2, point)
        }
    }
}

function createHexTemplate(
    document,
    svg,
    edgeLength,
    coordCenter,
    nRows,
    nCols,
    nMidpoints,
) {
    var hexWidth = edgeLength * Math.sqrt(3)
    var s1 = createSegment(
        document,
        svg,
        {x: 0, y: 0},
        {x: 0, y: -edgeLength},
        coordCenter,
        nMidpoints,
    )

    var s2 = createSegment(
        document,
        svg,
        {x: -hexWidth / 2, y: -3 / 2 * edgeLength},
        {x: -hexWidth, y: -edgeLength},
        coordCenter,
        nMidpoints,
    )

    var s3 = createSegment(
        document,
        svg,
        {x: -hexWidth, y: 0},
        {x: -hexWidth / 2, y: edgeLength / 2},
        coordCenter,
        nMidpoints,
    )

    var offsetMatrix = calcHexOffsets(
        edgeLength,
        nRows,
        nCols,
        coordCenter,
    )

    var firstPoint = true
    for (var r = 0, nr = offsetMatrix.length; r < nr; r++) {
        for (var p = 0, nc = offsetMatrix[r].length; p < nc; p++) {
            var point = offsetMatrix[r][p]
            if (firstPoint == true) {
                firstPoint = false
                addSpike(document, svg, s2, {x: point.x + hexWidth, y: point.y})
                addSpike(document, svg, s3, {x: point.x + 2 * hexWidth, y: point.y})
                continue
            }
            addSpike(document, svg, s1, {x: point.x, y: point.y})
            addSpike(document, svg, s2, {x: point.x + hexWidth, y: point.y})
            addSpike(document, svg, s3, {x: point.x + 2 * hexWidth, y: point.y})
        }
    }
}