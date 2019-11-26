var CONFIG = require('./config.js');
var main = require('./main.js');
var express = require('express');
var path = require('path');

var generatorRouter = express.Router();

generatorRouter.post("/create_html", function(req, res){

    var data = {
        xml: req.body.xml,
        filename: req.body.filename
    };

    main.createHTMLFromXML(data, function(result){

        res.send(JSON.stringify(result));
    });

});


// will return the home page for the ui based on the theme selected
generatorRouter.get("/ui/home", function(req, res){

    res.render(path.join(__dirname, CONFIG.GENERATOR_CONFIG.views_dir, CONFIG.GENERATOR_CONFIG.themes_dir, 
        CONFIG.GENERATOR_CONFIG.current_theme, CONFIG.GENERATOR_CONFIG.themes_main), {
        base_path: CONFIG.GENERATOR_CONFIG.theme_static_url + CONFIG.GENERATOR_CONFIG.current_theme + "/",
        add_ui_control_component: true,
        add_notification_component: true,
        add_modal: true,
        add_loader: true,
        debug: false
    });
});

generatorRouter.get("/ui/home/debug", function(req, res){
    res.render(path.join(__dirname, CONFIG.GENERATOR_CONFIG.views_dir, CONFIG.GENERATOR_CONFIG.themes_dir, 
        CONFIG.GENERATOR_CONFIG.current_theme, CONFIG.GENERATOR_CONFIG.themes_main), {
        base_path: CONFIG.GENERATOR_CONFIG.theme_static_url + CONFIG.GENERATOR_CONFIG.current_theme + "/",
        add_ui_control_component: true,
        add_notification_component: true,
        add_modal: true,
        add_loader: true,
        debug: true
    });
});


module.exports = generatorRouter;