var uiCore = require('./main.js');
var express = require('express');
var path = require('path');
var fs = require('fs');
var CONFIG = require('./../config');
const replace = require('replace-in-file');

var uiRouter = express.Router();

/**
 * Checks if the string is alphanumeric or not.
 * @param str - string
 * @returns {Boolean}
 */
function isAlphaNumeric(str) {
    var code, i, len;
  
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    }
    return true;
}

// gets the ui home page from the generator service
uiRouter.get("/", function(req, res) {
    res.redirect(CONFIG.internal_services.generator.url + "/ui/home");

});

// gets the ui home debug page from the generator service
uiRouter.get("/debug", function(req, res){
    res.redirect(CONFIG.internal_services.generator.url + "/ui/home/debug");
});

// post handler for processing image captured from the UI
uiRouter.post('/processImage', function(req, res){
    var name = new Date().getTime();
    var saveImageBase64data = req.body.img;

    // write image file to the system
    fs.writeFile(__dirname + "/public/data/images/" + name + ".png", saveImageBase64data, 'base64', function (err) {
        if (err) {
            console.log(err);
            res.send(JSON.stringify({status: false, error: err, msg: 'Could not save image',
            category: 'error'}));
        }
        else {
            /* uiHandler main function take series of callback to pass data between various services 
               and capture the end result.
            */ 
            uiCore.utilities.main(req, res, saveImageBase64data, name);
        }
    });
});

// ui router to get a page with a particular name (helpful for debug)
uiRouter.get('/getpage', function(req, res){

    var filename = req.query.filename;

    // send the index file for the filename
    res.sendFile(path.join(__dirname, "../", CONFIG.server.path_for_static.userdata + "/" + filename + "/" + CONFIG.appSettings.rendering.main + ".html"));

});

// ui router for renamig a page
uiRouter.post('/rename_page', function(req, res){

    var oldFilename = req.body.oldname;
    var newFilename = req.body.newname;

    // console.log(" renaming page ", oldFilename, " with ", newFilename);

    if (isAlphaNumeric(newFilename)){

        var newnamepath = path.join(__dirname, "../", CONFIG.server.path_for_static.userdata, newFilename);
        var oldnamepath = path.join(__dirname, "../", CONFIG.server.path_for_static.userdata, oldFilename);

        // check if directory already exist in userData
        if (fs.existsSync(newnamepath)) {

            res.send(JSON.stringify({status: false, data: null, category: 'error', title: 'UI Module:',
                msg: 'A page with name ' + newFilename + ' already exists. Please give a unique name'}));
        }
        else {

            // check if oldname exist because it might have been deleted from admin
            if (fs.existsSync(oldnamepath)){

                // rename dir
                fs.rename(oldnamepath, newnamepath, function(err){

                    if (err){
                        res.send(JSON.stringify({status: false, data: null, category: 'error', title: 'UI Module:',
                            msg: 'Could not rename the page.'}));
                    }
                    else {

                        var index_page_path = path.join(newnamepath, CONFIG.appSettings.rendering.main + ".html");

                        // TODO: Replace these string paths with config 
                        var static_path_page_old = new RegExp("/static_page/" + oldFilename +"/", 'g');
                        var static_path_page_new = "/static_page/" + newFilename + "/";

                        // console.log(" replacing static content ", static_path_page_old, " with ", static_path_page_new);

                        // regex string replacement
                        try{
                            const results = replace.sync({
                                files: index_page_path,
                                from: static_path_page_old,
                                to: static_path_page_new,
                            });

                            if (results[0].hasChanged){

                                uiCore.utilities.setLastUserDetails(newFilename, saved=true);
                                res.send(JSON.stringify({status: false, data: null, category: 'success',
                                    title: 'UI Module:',
                                    msg: 'Page has been saved as ' + newFilename}));
                            }
                            else {

                                fs.rename(newnamepath, oldnamepath, function(err){

                                    if (err){
                                        res.send(JSON.stringify({status: false, data: null, category: 'error', title: 'UI Module:',
                                            msg: 'Manually revert back directory name ' + newFilename + ' to ' + oldFilename}));
                                    }
                                });

                                res.send(JSON.stringify({status: false, data: null, category: 'error', 
                                title:'UI Module:',
                                msg: 'Could not rename the page.'}));
                            }

                        }
                        catch(err){
                            console.log(" Could not replace page content for static path: ", err);
                            res.send(JSON.stringify({status: false, data: null, category: 'error', title:'UI Module:',
                                msg: 'Could not rename the page.'}));
                        }
                        
                    }

                });
            }
            else {
                res.send(JSON.stringify({status: false, data: null, category: 'error',
                    msg: 'The page you are trying to rename doesnt exist in the system. Please report the error.'}));
            }

        }
        
    }
    else
    {
        res.send(JSON.stringify({status: false, data: null, category: 'error', title: 'UI Module:',
            msg: 'Only alphanumeric string is allowed for page name.'}));
    }

    
});

module.exports = uiRouter;