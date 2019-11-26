/**
 * This is an example of how to document routes.
 * @module Server_JS
 */


 var CONFIG = require('./config');
var fs = require('fs');
var path = require('path');
var https = require('https');
var express = require('express');
var fileUpload = require('express-fileupload');
var bodyParser = require('body-parser');

// key and certificate for https
var privateKey = fs.readFileSync('certificates/server.key', 'utf8');
var certificate = fs.readFileSync('certificates/server.cert', 'utf8');
var credentials = { key: privateKey, cert: certificate };

var app = express();
app.use(fileUpload());

app.use(bodyParser.urlencoded({ extended: true, limit: '150mb' }));
app.use(bodyParser.json({ limit: '150mb' }));

// static files should be inside public folder
app.use('/adminassets',express.static(path.join(__dirname , CONFIG.server.path_for_static.adminassets)));
app.use('/static_theme', express.static(path.join(__dirname, CONFIG.server.path_for_static.themes)));
app.use('/static_page', express.static(path.join(__dirname, CONFIG.server.path_for_static.userdata)));
app.use('/scripts', express.static(path.join(__dirname, CONFIG.server.nodeDir)));
app.get("/", function(req, res){

    res.redirect(CONFIG.server.home);
});

app.get("/html", function(req, res){

    res.sendFile(path.join(__dirname, CONFIG.server.path_for_static.userdata, 
        req.query.name, "index.html"));

});

//Set view engine to ejs
app.set("view engine", "ejs"); 

//Tell Express where we keep our index.ejs
app.set("views", CONFIG.server.path_for_views.map(function(path){return __dirname + path;})); 

//Use body-parser
app.use(bodyParser.urlencoded({ extended: false })); 

// The https server
var httpsServer = https.createServer(credentials, app);

/**
 * Dynamically use router.js for the service with 'name' and 'url'.
 * @param name - name
 * @param url - url
 * @throws {EldritchHorrorError|BoredomError} Could not route for service
 * @returns {Number} loaded_service_router: 0..1
 */
function addRouter(name, url){
    try{
        var loaded_service_router = require('./' + name + "/router.js");
        app.use(url, loaded_service_router);
    }
    catch(err){
        console.log("Could not route for service: " + name + ".");
        console.log("Failed with error ", err);
    }
}

/**
 * Auto runs to register internal services defined in config.js.
 * 
 * @function
 * @name registerInternalServices
 */
(function registerInternalServices(){
    
    var internal_services = CONFIG.internal_services;

    var serviceArr = Object.keys(internal_services).map(function(serviceID){
        return {
            name: internal_services[serviceID].name,
            url: internal_services[serviceID].url
        };
    });

    serviceArr.forEach(function(service){
        addRouter(service.name, service.url);
    });
})();

/**
 * Registers routing for UI module. UI module does not works as a separate service
 * and acts as a middle layer between services (internal/external) and idea2Life UI
 * 
 * @function
 * @name registerUI
 */
(function registerUI(){
    var ui = CONFIG.ui;
    addRouter(ui.name, ui.url);
})();

httpsServer.listen(CONFIG.server.port);
console.log("Running HTTPS server on ", CONFIG.server.port);
