
var scalarField;
var first = true;

/* function to convert a list of numbers (in string form) to a 3d array of numbers */
function listToArray3d(pts) {
    pts = pts.trim().split(" ");

    var array = [];
    var idx = 0;
    for (var i = 0; i < pts.length; i++) {
        if (i % 3 == 0) {
            array[idx] = [];
        }

        array[idx][i % 3] = Number(pts[i]);

        if (i % 3 == 2) {
            idx++;
        }
    }

    return array;
}

/* function to convert a 3d array of numbers to a list of numbers (in string form) */
function array3dToList(arr) {
    var pts = "";

    for (var i = 0; i < arr.length * 3; i++) {
        var x = Math.floor(i / 3);
        var y = i % 3;
        pts += arr[x][y].toString();
        pts += " ";
    }

    return pts;
}

/* function to convert a list of numbers (in string form) to a 1D array of numbers */
function listToArray1d(pts) {
    pts = pts.trim().split(" ");

    var array = [];
    for (var i = 0; i < pts.length; i++) {
        array[i] = Number(pts[i]);
    }

    return array;
}

/* function to convert a 1d array of numbers to a list of numbers (in string form) */
function array1dToList(arr) {
    var pts = "";
    for (var i = 0; i < arr.length; i++) {
        pts += arr[i].toString();
        pts += " ";
    }
}   

/* function to translate colormap and intensity indices into intensity color on the figure */
function addColor() {
    // get information from metadata tag:
    var metadata = $("metadata")[0];
    var colormap = listToArray3d($(metadata).attr("color_map"));
    var indices = listToArray1d($(metadata).attr("indices"));

    // get points from first coordinate tag
    var coord = $("coordinate")[0];
    var points = listToArray3d($(coord).attr("point"));

    // add rgb values to color tag
    var rgb = [];
    for (var i = 0; i < indices.length; i++) {
        var idx = indices[i];
        rgb[i] = colormap[idx];
    }

    // update color node with rgb values
    var color = document.createElement("color");
    $(color).attr("color", array3dToList(rgb));

    // add color node to indexed face set
    var faces = $("indexedFaceSet")[0];
    faces.appendChild(color);

    // update shape's indexed face set
    var shape = $("shape")[0];
    shape.removeChild($("indexedFaceSet")[0]);
    shape.appendChild(faces);
}

/* function to calculate the scalar field values at each vertex */
function calculateScalars() {
    // get information from metadata tag:
    var metadata = $("metadata")[0];
    var max_value = Number($(metadata).attr("max_value"));
    var min_value = Number($(metadata).attr("min_value"));
    var indices = listToArray1d($(metadata).attr("indices"));

    // find scale used to normalize color values (there are 256 colors in map by default) 
    var scale = (min_value == max_value) ? 1.0 : 255.0 / (max_value - min_value);

    // calculate scalar value for each index
    var scalars = [];
    for (var i = 0; i < indices.length; i++) {
        scalars[i] = (indices[i] / scale) + min_value;
    }

    return scalars;
}

/* function to warp a shape by a scalar field */
function warpByScalar() {
    if (scalarField.length == 0) {
        return;
    }

    // add warped shapes if not added already
    if (first) {
        var shapes = $("shape");
        var parent = shapes[0].parentElement;

        for (var i = 0; i < shapes.length; i++) {
            // find the points for each shape
            var curr = $(shapes[i]).clone()[0];
            var coord = $(curr).find("coordinate");
            var points = listToArray3d($(coord).attr("point"));

            // change the points according to the scalar field
            for (var j = 0; j < points.length; j++) {
                // FIXME: generalize perpendicular direction
                // change the z-coordinate to be the scalar value
                points[j][2] = scalarField[j];
            }
            $(coord).attr("point", array3dToList(points));

            // add classname to new shape
            $(curr).addClass("warped");

            // add new shape to the parent
            parent.appendChild(curr);
        }

        first = false;
    }

    // adjust the scalar warping by the current scale factor
    var factor = Number($("#slider")[0].value);
    var shapes = $(".warped");
    for (var i = 0; i < shapes.length; i++) {
        var coord = $(shapes[i]).find("coordinate");
        var points = listToArray3d($(coord).attr("point"));

        // change the scalar warping by current scale
        for (var j = 0; j < points.length; j++) {
            points[j][2] = scalarField[j] * factor;
        }
        $(coord).attr("point", array3dToList(points));
    }
}

function toggleSlider() {
    document.getElementById('slider').disabled = !document.getElementById('slider').disabled;

    // FIXME: hiding warped shapes not working
    var shapes = $(".warped");
    for (var i = 0; i < shapes.length; i++) {
        shapes[i].hidden = !shapes[i].hidden;
    }
}

// add color as soon as the document is ready
$(document).ready(function() {
    addColor();
    scalarField = calculateScalars();
    warpByScalar();
});