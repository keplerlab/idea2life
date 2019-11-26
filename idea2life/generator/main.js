const CONFIG = require('./config');
var parseString = require('xml2js').parseString;
var util = require('util');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
var mkdirp = require('mkdirp');
var path = require('path');
var ejs = require('ejs');
var fs = require('fs');

// fse does support fs methods but we are not replacing fs to avoid breaking our existing functionality
const fse = require('fs-extra');

var parentNodeId = null;
const GRIDSIZE = 12;

var copyComponentStatic = function(filename, componentName, callback){

    var filename = filename.toString();

    var itemsProcessed = 0;

    CONFIG.GENERATOR_CONFIG.components_static.forEach(function(folderName){

        if (CONFIG.GENERATOR_CONFIG.logging){
            console.log("Copying contents", path.join(__dirname, CONFIG.GENERATOR_CONFIG.views_dir, CONFIG.GENERATOR_CONFIG.themes_dir, 
                CONFIG.GENERATOR_CONFIG.current_theme, CONFIG.GENERATOR_CONFIG.component_dir, componentName, folderName));
        }
       
        //check if directory exist in component
        if (fs.existsSync(path.join(__dirname, CONFIG.GENERATOR_CONFIG.views_dir, CONFIG.GENERATOR_CONFIG.themes_dir, 
            CONFIG.GENERATOR_CONFIG.current_theme, CONFIG.GENERATOR_CONFIG.component_dir, componentName, folderName))){

                // copy contents
                fse.copy(path.join(__dirname, CONFIG.GENERATOR_CONFIG.views_dir, CONFIG.GENERATOR_CONFIG.themes_dir, 
                    CONFIG.GENERATOR_CONFIG.current_theme, CONFIG.GENERATOR_CONFIG.component_dir, componentName, folderName), 
                    path.join(CONFIG.GENERATOR_CONFIG.userDataDirPath, filename, folderName), function(err) {
                        
                        itemsProcessed += 1;
                        if (err){

                            if (CONFIG.GENERATOR_CONFIG.logging){
                                console.log(" Error when copying folder ", folderName, "for component ", componentName);
                            }
                        }

                        // if all items are done, then callback
                        if(itemsProcessed === CONFIG.GENERATOR_CONFIG.components_static.length) {
                            callback();
                        }

                });    
        }
        else {
            itemsProcessed += 1;

            // if all items are done, then callback
            if(itemsProcessed === CONFIG.GENERATOR_CONFIG.components_static.length) {
                callback();
            }
        }

    });
};

var writeDOMToPageIndex = function(data, html_file_path, dom){
    var html = dom.serialize();
    var document = dom.window.document;

    async function writePageIndex(){

        let promise = new Promise((resolve, reject) => {
            fs.writeFile(html_file_path, html, function(err){
                if (err){

                    if (CONFIG.GENERATOR_CONFIG.logging){
                        console.log(" Error creating HTML file ", err);
                    }
                    
                    reject({status: false, msg: 'Could create index file for the page.', 
                        category: 'error', title: 'Generator Service:', data: err});
                }
                else {
        
                    if (CONFIG.GENERATOR_CONFIG.logging){
                        console.log(" HTML file created at ", html_file_path);
                    }
                    
                    var container_content = document.getElementById("main").innerHTML;
        
                    resolve({
                        status: true, 
                        data: null, 
                        msg: '',
                        content: container_content, 
                        filename: data.filename.toString()
                    });
                }

            });
        });

        let result = await promise;

        return result;
    }

    return writePageIndex();
}

function createRowDiv(document, attr){

    var rowDiv = document.createElement("div");
    rowDiv.setAttribute("class", "row");

    // give a default 5% top margin
    rowDiv.setAttribute("style", "margin-top:" + "5" + "%" + ";");

    rowDiv.setAttribute("id", attr.id);

    return rowDiv;

}

function createColumnDiv(document, attr, numberOfColumns){

    var colDiv = document.createElement("div");

    var colSize = GRIDSIZE / numberOfColumns;

    colDiv.setAttribute("class", "col-md-" + colSize.toString());

    return colDiv;

}

var createHTMLFromLayoutJSON = function(data, html_file_path, callback){


    // create an index file inside the folder
    JSDOM.fromFile(html_file_path).then(dom => {

        var document = dom.window.document;

        parseString(data.xml, {attrkey: 'attr'} ,function(err, json){

            if (err){
                var d = {
                    msg : 'Could not parse XML',
                    status: false,
                    title: 'Generator Service',
                    data: null,
                    category: 'error'
                };
                callback(d);
                return;
            }

            const ROW = "row";
            const ROWS = "rows";
            const COLUMN = "column";
            const ATTR = "attr";
            const CLASS = "class";
            const COMPONENT = "component";

            parentNodeId = "main";
    
            if (CONFIG.GENERATOR_CONFIG.logging){
                console.log("xml2json", util.inspect(json, false, null));
            }

            var layoutJSON = json[ROWS];

            // check if only single component in json
            if (layoutJSON.hasOwnProperty(COMPONENT)){
                var parentHTMLNode = document.getElementById(parentNodeId);

                var attr = layoutJSON[COMPONENT][0][ATTR];
                var component = attr[CLASS].split(",")[0];

                // create a row
                var rowDiv = document.createElement("div");
                rowDiv.setAttribute("class", "row");

                // hardcoding since we know only single row exists
                rowDiv.setAttribute("id", "R1");

                copyComponentStatic(data.filename, component, function(){

                    // get rendered ejs from component library using class name
                    ejs.renderFile(path.join(__dirname, CONFIG.GENERATOR_CONFIG.views_dir, CONFIG.GENERATOR_CONFIG.themes_dir, 
                        CONFIG.GENERATOR_CONFIG.current_theme, CONFIG.GENERATOR_CONFIG.component_dir,
                        component, CONFIG.GENERATOR_CONFIG.component_main + ".ejs"), 
                        {
                            base_path: CONFIG.GENERATOR_CONFIG.page_static_url + data.filename.toString() + "/",
                            add_ui_control_component: false,
                            add_notification_component: false,
                            debug: false,
                            add_modal: false,
                            add_loader: false
                        }, function(err, d){
                            if (err){

                                if (CONFIG.GENERATOR_CONFIG.logging){
                                    console.log(" Could not render component ", component, " : ",err);
                                }
                                
                                callback({
                                    msg: 'Could not render component ' + component,
                                    title: 'Generator Service:',
                                    status: false,
                                    category: 'error',
                                    data: err
                                });

                            }
                            else{

                                // plug in the innerHTML
                                rowDiv.innerHTML = d;

                                // give a default 5% top margin
                                rowDiv.setAttribute("style", "margin-top:" + "5" + "%" + ";");

                                parentHTMLNode.appendChild(rowDiv);

                                var promise = writeDOMToPageIndex(data, html_file_path, dom);
                                promise.then(callback);
                            
                            }
                    });

                });

            }

            if (layoutJSON.hasOwnProperty(ROW)){

                var currentAsyncCounter = 0;
                var totalAsyncCounter = 0;

                function traverseChildren(keyName, elements, parentDiv){

                    elements.forEach(function(el){

                        if (keyName == ROW){
                            var rowDiv = createRowDiv(document, el[ATTR]);

                            // append to parent
                            parentDiv.appendChild(rowDiv);

                            if (el.hasOwnProperty(COLUMN)){
                                traverseChildren(COLUMN, el[COLUMN], rowDiv);
                            } else{
                                traverseChildren(COMPONENT, el[COMPONENT], rowDiv);
                            }
                        

                        }
                        else if (keyName == COLUMN){
                            var coldDiv = createColumnDiv(document, el[ATTR], elements.length);

                             // append to parent
                             parentDiv.appendChild(coldDiv);

                             if (el.hasOwnProperty(ROW)){
                                traverseChildren(ROW, el[ROW], coldDiv);
                             }
                             else{
                                traverseChildren(COMPONENT, el[COMPONENT], coldDiv);
                             }

                        }
                        else {

                            var component = el[ATTR][CLASS].split(",")[0];

                            totalAsyncCounter += 1;
                            copyComponentStatic(data.filename, component, function(){

                                // get rendered ejs from component library using class name
                                ejs.renderFile(path.join(__dirname, CONFIG.GENERATOR_CONFIG.views_dir, CONFIG.GENERATOR_CONFIG.themes_dir, 
                                    CONFIG.GENERATOR_CONFIG.current_theme, CONFIG.GENERATOR_CONFIG.component_dir,
                                    component, CONFIG.GENERATOR_CONFIG.component_main + ".ejs"), 
                                    {
                                        base_path: CONFIG.GENERATOR_CONFIG.page_static_url + data.filename.toString() + "/",
                                        add_ui_control_component: false,
                                        add_notification_component: false,
                                        debug: false,
                                        add_modal: false,
                                        add_loader: false
                                    }, function(err, d){

                                        currentAsyncCounter += 1;
                                        if (err){
            
                                            if (CONFIG.GENERATOR_CONFIG.logging){
                                                console.log(" Could not render component ", component, " : ",err);
                                            }
                                            
                                            callback({
                                                msg: " Could not render component " + component,
                                                status: false,
                                                data: err,
                                                title:'Generator Service',
                                                category: 'error'
                                            });
            
                                        }
                                        else{
            
                                            parentDiv.innerHTML = d;

                                            if (totalAsyncCounter == currentAsyncCounter){
                                                var promise = writeDOMToPageIndex(data, html_file_path, dom);

                                                promise.then(callback);

                                            }
                                        
                                        }
                                });
            
                            });

                        }

                    });
                }

                var parentHTMLNode = document.getElementById(parentNodeId);
                traverseChildren(ROW, layoutJSON[ROW], parentHTMLNode);

            }
            
        });

    });

};

var renderThemeWithPageStatic = function(data, callback){

    var filename = data.filename.toString();

    ejs.renderFile(path.join(__dirname, CONFIG.GENERATOR_CONFIG.views_dir, CONFIG.GENERATOR_CONFIG.themes_dir, 
        CONFIG.GENERATOR_CONFIG.current_theme, CONFIG.GENERATOR_CONFIG.themes_main + ".ejs"), 
        {
            base_path: CONFIG.GENERATOR_CONFIG.page_static_url + filename + "/",
            add_ui_control_component: false,
            add_notification_component: false,
            debug: false,
            add_modal: false,
            add_loader: false,
        }, function(err, data){
            if (err){

                if (CONFIG.GENERATOR_CONFIG.logging){
                    console.log(" could not render theme ", CONFIG.GENERATOR_CONFIG.current_theme, " : ", err);
                }
                
                callback({
                    msg: "Could not render theme " + CONFIG.GENERATOR_CONFIG.current_theme,
                    status: false,
                    data: err,
                    category: 'error',
                    title: 'Generator Service:'
                });
            }
            else{
                var html_file_path = path.join(CONFIG.GENERATOR_CONFIG.userDataDirPath, filename, CONFIG.GENERATOR_CONFIG.themes_main + ".html");
                fs.writeFile(html_file_path, data ,function(err){
                    if (err){

                        if (CONFIG.GENERATOR_CONFIG.logging){
                            console.log(" error writing to a file", err);
                        }
                        
                        callback({
                            msg: "Could not write to file " + html_file_path,
                            status: false,
                            data: err,
                            category: 'error',
                            title: 'Generator Service:'
                        });
                    }
                    else{
                        callback({
                            msg: '',
                            status: true,
                            category: 'success',
                            title: 'Generator Service:',
                            data: { html_file_path: html_file_path }
                        });
                    }
                });
            }
    });

};

var createPageFolderStructure = function(data, callback){

    var filename = data.filename.toString();

    // create the folder based on filename
    mkdirp(path.join(CONFIG.GENERATOR_CONFIG.userDataDirPath, filename, CONFIG.GENERATOR_CONFIG.theme_static), function(err){

        if (err) {

            if (CONFIG.GENERATOR_CONFIG.logging){
                console.log(" Could not create directory inside userData ", CONFIG.GENERATOR_CONFIG.theme_static," : " ,err);
            }
            

            callback({
                msg: "Could not create directory inside userData for "+ CONFIG.GENERATOR_CONFIG.theme_static ,
                status: false,
                data: err,
                category:'error',
                title: 'Generator Service:'
            });
        }
        else {
            
            // this will run async
            CONFIG.GENERATOR_CONFIG.components_static.forEach(function(folderName){

                mkdirp(path.join(CONFIG.GENERATOR_CONFIG.userDataDirPath, filename, 
                    folderName), function(err){

                    if (err) {

                        if (CONFIG.GENERATOR_CONFIG.logging){
                            console.log(" Could not create directory for ", folderName," : " ,err);
                        }
            
                        callback({
                            msg: "Could not create directiry for "+ folderName,
                            status: false,
                            data: err,
                            category: 'error',
                            title: 'Generator Service:'
                        });

                        return false;
                    }
                    else{
                        return true;
                    }
                });
            });

            // copy data from theme folder generator/views/themes/themeName/static
            fse.copy(path.join(__dirname, CONFIG.GENERATOR_CONFIG.views_dir, CONFIG.GENERATOR_CONFIG.themes_dir,
                CONFIG.GENERATOR_CONFIG.current_theme, CONFIG.GENERATOR_CONFIG.theme_static), 
                path.join(CONFIG.GENERATOR_CONFIG.userDataDirPath, filename, CONFIG.GENERATOR_CONFIG.theme_static), function(err) {

                if (err) {

                    if (CONFIG.GENERATOR_CONFIG.logging){
                        console.log(" Could not copy data for ", folderName, " : ",err);
                    }
                    
                    callback({
                        msg: "Could not copy directory contents for " + folderName,
                        status: false,
                        data: null,
                        category: 'error',
                        title: 'Generator Service:'
                    });
                }
                else {
                    callback({
                        msg: '',
                        status: true,
                        data: null,
                        category: 'success',
                        title: 'Generator Service:'
                    });
                }
            });
        }

    });

};

var createHTMLFromXML = function(data, callback){
    
    createPageFolderStructure(data, function(results){

        if (results.status){
            renderThemeWithPageStatic(data, function(response){

                if (response.status){
                   createHTMLFromLayoutJSON(data, response.data.html_file_path, callback);
                }
                else{
                    callback(response);
                }
            });
        }
        else {
            callback(results);
        }

    });
};

module.exports.createHTMLFromXML = createHTMLFromXML;