var CONFIG = require('./config.js');
const COMPONENTS = require('./components');
var fs = require('fs');
var TreeModel = require('tree-model'),
    tree = new TreeModel(),
    root = tree.parse({type: 'root', id: "R_", 
        boundingBox : {left: null, right: null, bottom: null, top: null} ,
        documentWidth: null,
        documentHeight: null,
        elements: [], children: []});

const ROW = "R", COL = "C";


function initializeTree(elementsArr,width, height){

    tree = new TreeModel(),
    root = tree.parse({type: 'root', id: "R_", 
        boundingBox: { left: null, bottom: null, top: null, right: null} ,
        documentWidth: width,
        documentHeight: height,
        elements: [], children: []});

    root.elements = elementsArr;

}

function createRowCluster(elementsArr){

    var index = 0;

    var clusters = [];


    // sort elementsArr based on top position
    var sortedTop = elementsArr.sort(function(a, b) { return a.top - b.top;});

    function findNextOverlappingElement(currentElement, elementWithMaxBottom){

        // console.log(" current element with max bottom ", elementWithMaxBottom);

        var startingIndex = sortedTop.indexOf(currentElement);
        var newArr = sortedTop.slice(startingIndex + 1, sortedTop.length);

        // console.log(" Searching in array ", newArr);
        var overlappingElements = newArr.filter(function(element) { return element.top >= currentElement.top && element.top < elementWithMaxBottom.bottom });

        if (overlappingElements.length) {

            // check if this new overlapping lement has bottom greater than the currentElement
            var nextOverlppaingElement = overlappingElements[0];
            var newMaxBottomElement = elementWithMaxBottom;

            if (nextOverlppaingElement.bottom > elementWithMaxBottom.bottom){
                newMaxBottomElement = nextOverlppaingElement;
            }

            // since newElementsArray is sorted the first element will be the next overlapping element
            return [nextOverlppaingElement, newMaxBottomElement];
        }
        else {
            return [null, elementWithMaxBottom];
        }
    }

    var clusterNumber = 0;

    while (index < elementsArr.length){

        var cluster = [];
        clusterNumber += 1;
        var elementWithMaxBottom = null;

        // console.log("Creating row cluster number ", clusterNumber);

        var nextelementWithinHeight = sortedTop[index];
        var elementWithMaxBottom = sortedTop[index];

        while (nextelementWithinHeight != null){
            cluster.push(nextelementWithinHeight);
            var currentElement = nextelementWithinHeight;

            // console.log(" running for item ", currentElement);
            var data = findNextOverlappingElement(currentElement, elementWithMaxBottom);

            // console.log(" Next overlapping results are  ", data);
            nextelementWithinHeight = data[0];
            elementWithMaxBottom = data[1];
        }

        // sort the cluster based on left position so that grid is created in right order
        var sortedCluster = cluster.sort(function(a, b) { return a.left - b.left;});

        clusters.push(sortedCluster);

        index += cluster.length;

    }

    // console.log(" Got row clusters ", clusters);

    return clusters;

}


function createColumnCluster(elementsArr){
    var clusters = [];

    var index = 0;

    // sort elementsArr based on top position
    var sortedLeft = elementsArr.sort(function(a, b) { return a.left - b.left;});

    function findNextOverlappingElement(currentElement, elementWithMaxRight){

        var startingIndex = sortedLeft.indexOf(currentElement);
        var newArr = sortedLeft.slice(startingIndex + 1, sortedLeft.length);

        var overlappingElements = newArr.filter(function(element) { return element.left >= currentElement.left && element.left < elementWithMaxRight.right });

        if (overlappingElements.length) {

            // check if this new overlapping lement has bottom greater than the currentElement
            var nextOverlppaingElement = overlappingElements[0];
            var newMaxRightElement = elementWithMaxRight;

            if (nextOverlppaingElement.right > elementWithMaxRight.right){
                newMaxRightElement = nextOverlppaingElement;
            }

            // since newElementsArray is sorted the first element will be the next overlapping element
            return [nextOverlppaingElement, newMaxRightElement];
        }
        else {
            return [null, elementWithMaxRight];
        }
    }
    

    while(index < elementsArr.length){

        var cluster = [];
        var elementWithMaxRight = null;

        var nextelementWithinWidth = sortedLeft[index];
        var elementWithMaxRight = sortedLeft[index];

        while (nextelementWithinWidth != null){
            cluster.push(nextelementWithinWidth);
            var currentElement = nextelementWithinWidth;
            var data = findNextOverlappingElement(currentElement, elementWithMaxRight);

            nextelementWithinWidth = data[0];
            elementWithMaxRight = data[1];
        }

        // sort the cluster based on top position so that grid is created in right order
        var sortedCluster = cluster.sort(function(a, b) { return a.top - b.top;});

        clusters.push(sortedCluster);

        index += cluster.length;
    }

    return clusters;
}

// type signifies the type of cluster formed by the elements in elementsArr
function createClusterTree(type, elementsArr, parentNode){

    var rowIndex = 0;
    var colIndex = 0;

    if (type == ROW) {

        // if there are more than 1 elements in the Array then only clustering is required
        if (elementsArr.length > 1) {

            var data = createColumnCluster(elementsArr);

            // console.log(" got column cluster data ", data);
            data.forEach(function(columnCluster){

                colIndex += 1;

                // console.log(" running for column cluster ", columnCluster);

                // create a Node to be added to the tree
                var currentNode = tree.parse({type: 'column', 
                    css: { width: null, offsetLeft: null},
                    id: parentNode.model.id + "C" + colIndex.toString() , boundingBox: {left: null, right: null, top: null, bottom: null},
                    elements: columnCluster, children: []});

                // add the node to the parent
                parentNode.addChild(currentNode);

                // recurse
                createClusterTree(COL, columnCluster, currentNode);
            });
        }
        else {

            // console.log(" Found a column leaf node ", elementsArr);

            // add a node (as a leaf)
            var currentNode = tree.parse({type: 'leaf', 
                id: parentNode.model.id + "L" ,
                css: {width: null, offsetLeft: null},
                boundingBox: {left: null, top: null, right: null, bottom: null},
                elements: elementsArr, children: []});
            parentNode.addChild(currentNode);
        }
    }

    if (type == COL) {

        // if there are more than 1 elements in the Array then only clustering is required
        if (elementsArr.length > 1) {

            var data = createRowCluster(elementsArr);
           
            data.forEach(function(rowCluster){

                rowIndex += 1;

                // create a Node to be added to the tree
                var currentNode = tree.parse({type: 'row', id : parentNode.model.id + "R" + rowIndex.toString() ,
                    css: {width: null, offsetLeft: null},
                    boundingBox: { left: null, top: null, right: null, bottom: null},
                    elements: rowCluster, children: []});

                // add the node to the parent
                parentNode.addChild(currentNode);

                // recurse
                createClusterTree(ROW, rowCluster, currentNode);
            });

        }
        else {

            // add a node (as a leaf)
            var currentNode = tree.parse({type: 'leaf', id:  parentNode.model.id + "L" ,
                boundingBox: { left: null, bottom: null, top: null, right: null},
                css: {width: null, offsetLeft: null},
                elements: elementsArr, children: []});
            parentNode.addChild(currentNode);

        }
    }

};

function addBoundingBoxInfoToTree(){
    if (root.hasChildren()){

        var leftmost = null;
        var rightmost = null;
        var topmost = null;
        var bottommost = null;

        root.walk({strategy: 'pre'}, function(node){

            var leftNode = node.model.elements.sort(function(a, b){ return a.left - b.left;})[0];
            var topNode = node.model.elements.sort(function(a, b){ return a.top - b.top;})[0];
            var rightNode = node.model.elements.sort(function(a, b){ return b.right - a.right;})[0];
            var bottomNode = node.model.elements.sort(function(a, b){ return b.bottom - a.bottom;})[0];

            if (!node.isRoot()){

                if (leftmost == null){
                    leftmost = leftNode.left;
                } else {
                    if (leftNode.left < leftmost){
                        leftmost = leftNode.left;
                    }
                }
    
                if (rightmost == null){
                    rightmost = rightNode.right;
                } else {
                    if (rightNode.right > rightmost){
                        rightmost = rightNode.right;
                    }
                }
    
                if (topmost == null){
                    topmost = topNode.top;
                } else {
                    if (topNode.top < topmost){
                        topmost = topNode.top;
                    }
                }
    
                if (bottommost == null){
                    bottommost = bottomNode.bottom;
                } else {
                    if (bottomNode.bottom > bottommost){
                        bottommost = bottomNode.bottom;
                    }
                }

                node.model.boundingBox.left = leftNode.left;
                node.model.boundingBox.top = topNode.top;
                node.model.boundingBox.right = rightNode.right;
                node.model.boundingBox.bottom = bottomNode.bottom;
            }
        });

        root.model.boundingBox.left = leftmost;
        root.model.boundingBox.right = rightmost;
        root.model.boundingBox.bottom = bottommost;
        root.model.boundingBox.top = topmost; 

    }

    if (CONFIG.LAYOUT_CONFIG.logging){
        console.log(" root bounding box added with values ", root.model.boundingBox);
    }
}

function createXMLfromTree(){

    var XML = "<rows>";
    var traversed_nodes = [];
    var stack = [];

    if (root.hasChildren()){
        root.walk({strategy: 'pre'}, function(node){

            if (!node.isRoot()){

                if (node.model.type == "row"){

                    XML += "<row id='" + node.model.id + "'" + " width='" + node.model.css.width + "' offset='" + node.model.css.offsetLeft +"'>";
                    traversed_nodes.push(node);
                    stack.push(node);

                }

                if (node.model.type == "column") {
                    XML += "<column id='" + node.model.id + "'" + " width='" + node.model.css.width + "' offset='" + node.model.css.offsetLeft +"'>";
                    traversed_nodes.push(node);
                    stack.push(node);
                }

                if (node.model.type == "leaf") {

                    let create_column = false;

                    if (!(node.model.css.width == null) && !(node.model.css.offsetLeft == null)){
                        create_column = true;
                    }
                    
                    // since this is a leaf node, no further depth is added
                    var alternative_classes = COMPONENTS[node.model.elements[0].class]["alt"];
                    if (alternative_classes.length) {

                        if (create_column){
                            XML += "<column width='" + node.model.css.width +"' offset='" + node.model.css.offsetLeft +"'>";
                        }
                        XML += "<component class='"+ node.model.elements[0].class + "," + alternative_classes.join(",") +"'>";
                    }
                    else {

                        if (create_column){
                            XML += "<column width='" + node.model.css.width +"' offset='" + node.model.css.offsetLeft +"'>";
                        }

                        XML += "<component class='"+ node.model.elements[0].class +"'>";
                    }
                    
                    traversed_nodes.push(node);
                    stack.push(node);

                    var last_node_all_children_traversed = true;

                    while (last_node_all_children_traversed) {

                        // console.log(" stack ", stack.map(function(node){ return node.model.id}));
                        // console.log(" traversed ", traversed_nodes.map(function(node){ return node.model.id}));

                        // run only when stack is not empty
                        if (stack.length) {

                            // the previous node from this leaf node
                            var last_node_traversed = stack[stack.length - 1];
                            var traversed_node_ids = traversed_nodes.map(function(traversed_node){ return traversed_node.model.id});

                            var last_node_traversed_childrens = last_node_traversed.model.children;

                            for (var childNodeIndex=0; childNodeIndex < last_node_traversed_childrens.length ;childNodeIndex ++){

                                var child_id = last_node_traversed_childrens[childNodeIndex].id;


                                if (traversed_node_ids.indexOf(child_id) == -1){
                                    last_node_all_children_traversed = false;
                                    break;
                                }
                            }

                            // if all children have been traversed
                            if (last_node_all_children_traversed) {

                                //remove the last node
                                last_node_traversed = stack.pop();

                                if (last_node_traversed.model.type == "row"){
                                    XML += "</row>";
                                }

                                if (last_node_traversed.model.type == "column"){
                                    XML += "</column>";
                                }

                                if (last_node_traversed.model.type == "leaf"){
                                    XML += "</component>";

                                    if (create_column) {
                                        XML += "</column>";
                                    }
                                    
                                }

                            }

                        }
                        // there is nothing to process
                        else {
                            last_node_all_children_traversed = false;
                        }

                    }

                }
            }
        });
    }

    XML += "</rows>";

    if (CONFIG.LAYOUT_CONFIG.logging){
        console.log("XML data is ", XML);
    }

    return XML;
};

function saveXML(res, filename, XML){

    // write XML data to file and save it
    fs.writeFile(__dirname + CONFIG.LAYOUT_CONFIG.dirPath + filename+ ".xml", XML, function(err){
        if (err){

            if (CONFIG.LAYOUT_CONFIG.logging){
                console.log(" Error creating XML file ", err);
            }
           
            res.send(JSON.stringify({status: false, msg: 'Could not save XML data in layout service.', category: 'error',data: null,
            title:'Layout Service:'}));
        }
        else {
            res.send(JSON.stringify({status: true, data: XML, msg: '', category:'success', title:'Layout Service:'}));
        }
    });
}

// core layout function
function layoutCore(res, elementsArr, width, height, filename){

    // initialize the tree
    initializeTree(elementsArr,width, height);

    try {
        var initialType = COL;
        createClusterTree(initialType, elementsArr, root);
    }
    catch (err) {

        if (CONFIG.LAYOUT_CONFIG.logging){
            console.log(" Could not create layout tree: ",err);
        }

        var data = {
            status: false,
            data: err,
            msg: "Elements drawn are either overlapping or very close to each other and cannot be distinguished.",
            category: 'error',
            title: 'Layout Service:'
        };
        
        res.send(JSON.stringify(data));
    }

    // add boundingBox Info
    addBoundingBoxInfoToTree();

    // create XMLFromTree should come here
    var XML = createXMLfromTree();

    // save XML
    saveXML(res, filename, XML);

}

module.exports.layoutCore = layoutCore;