/**
 * This is an example of how to document routes.
 * @module AdminRouter
 */

const promisify = require('util').promisify;
var express = require('express');
var path = require('path');
var fs = require('fs');
var rimraf = require("rimraf");
var ADMINCONFIG = require('./config');
var CONFIG = require('../config');

var adminRouter = express.Router();

const readdirp = promisify(fs.readdir);
const statp = promisify(fs.stat);

//joining path of directory 
const viewDirectoryPath = path.join(__dirname, ADMINCONFIG.view_folder);
const htmlDirectoryPath = path.join(__dirname, ADMINCONFIG.html_folder);
const componentDirectoryPath = path.join(__dirname, ADMINCONFIG.component_folder);

/**
 * This is a GET request - "/" used to go to the home page
 * 
 * @function 
 * @name "/"
 * 
 */
adminRouter.get("/", function(req, res) {
	res.render(ADMINCONFIG.view.home);
});

adminRouter.get("/errorpage", function(req, res){
	res.render(ADMINCONFIG.page.error);
});

/**
 * This is a GET request - "/view" used to view the entire page list.
 * 
 * @function 
 * @name "/view"
 * 
 */
adminRouter.get("/view", function(req, res, next){
	scan(htmlDirectoryPath, [ADMINCONFIG.defaultpage.ext]).then(data => res.render(ADMINCONFIG.view.listview, {
		pagelist: data,
		pagefeatures: ADMINCONFIG.page,
	 })).catch(next);
});

/**
 * This is a GET request - "/delete" used to view the entire page list.
 * 
 * @function 
 * @name "/delete"
 * 
 * 
 */
adminRouter.get("/delete", function(req, res){
	const fileName = req.query.page;

	if(fileName != ""){
		var filePath = path.join(htmlDirectoryPath, fileName);
		
		rimraf(filePath, function () { 
			res.redirect(ADMINCONFIG.home_url);
		});
	}
});

/**
 * This is a GET request - "/pagehtmlview" used to view a selected page.
 * 
 * @function 
 * @name "/pagehtmlview"
 */
adminRouter.get("/pagehtmlview", function(req, res){
	//apply check for html page only and use post in place of get to send this file name
	const fileName = req.query.page;
	var fPath = path.join(htmlDirectoryPath, fileName, ADMINCONFIG.defaultpage.name + ADMINCONFIG.defaultpage.ext);

	try {
		res.sendFile(fPath, (err) => {
			if (err) {
				res.redirect("/admin/errorpage");
			}
		});
	}
	catch(err){
		console.log(" Could not raise toast for errors: ", err);
		res.redirect("/admin/errorpage");
	}
});

/**
 * This is a GET request - "/pagenames" used to get a selected page name.
 * 
 * @function 
 * @name "/pagenames"
 */
adminRouter.get("/pagenames", function(req, res, next){
	scan(htmlDirectoryPath, [ADMINCONFIG.defaultpage.ext]).then(data => res.send(data)).catch(next);


    // var filelist = getFilesFromDir(htmlDirectoryPath, [ADMINCONFIG.defaultpage.ext]);
    // res.send(filelist);
});

/**
 * This is a GET request - "/pageedit" used to open a page in Editor to make few modifications.
 * 
 * @function 
 * @name "/pageedit"
 */
adminRouter.get("/pageedit", function(req, res){
		//apply check for html page only and use post in place of get to send this file name
		const fileName = req.query.page;
		let filePath = path.join(htmlDirectoryPath, fileName, "/", ADMINCONFIG.defaultpage.name + ADMINCONFIG.defaultpage.ext);
		let content = fs.readFileSync(filePath);

		let useragent = req.get('User-Agent');
		// console.log(useragent.indexOf("iPad") != -1);
		if(useragent.indexOf("Mobile") != -1){
			res.render(ADMINCONFIG.page.edit, { content: content, fileName : fileName, base_path: "/adminnotification/", showDeviceWarning : true});
		}
		else {
			res.render(ADMINCONFIG.page.edit, { content: content, fileName : fileName, base_path: "/adminnotification/", showDeviceWarning : false});
		}
});

/**
 * This is a POST request - "/savepage" used for saving the edited page.
 * 
 * @function 
 * @name "/savepage"
 */
adminRouter.post("/savepage", function(req, res){
		var data = (req.body);
		const fileName = req.query.page;
		
		fs.writeFile(path.join(htmlDirectoryPath, fileName , ADMINCONFIG.defaultpage.name + ADMINCONFIG.defaultpage.ext), data.data, function(err) {
			
			if(err) {
				// return console.log(err);

				res.send({ msg: "Page not saved.", category: 'error', title: 'Edit:', data: null });
			}
			else{
				res.send({ msg: "Page saved successfully.", category: 'success', title: 'Edit:', data: null });
			}
		}); 
});

/**
 * Return a list of files of the specified fileTypes in the provided dir, 
 * with the file path relative to the given dir
 *
 * @param directoryName - path of the directory you want to search the files for
 * @param fileTypes - array of file types you are search files, ex: ['.txt', '.jpg']
 * @throws {Error} Could not route for service
 * @returns {results} This is the page list
 */
async function scan(directoryName = './data', fileTypes = '.html', results = []) {
    let files = await readdirp(directoryName);
    for (let file of files) {
		
        let fullPath = path.join(directoryName, file);
        let stat = await statp(fullPath);
        if (stat.isDirectory()) {
            await scan(fullPath, fileTypes, results);
        } else if(stat.isFile() && fileTypes.indexOf(path.extname(fullPath)) != -1) {
            results.push(fullPath.replace(htmlDirectoryPath, '').split('/')[0]);
        }
    }
    return results;
}

module.exports = adminRouter;