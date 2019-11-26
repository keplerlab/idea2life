var CONFIG = require('./config.js');
var express = require('express');
var path = require('path');
var core = require('./main.js');

var layoutRouter = express.Router();

layoutRouter.post("/generate", function(req, res) {

    var data = req.body;

    core.layoutCore(res, data.aiData, data.imageWidth, data.imageHeight, data.filename);
});


module.exports = layoutRouter;