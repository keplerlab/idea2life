/**
 * This is an example of how to document routes.
 * @module handlers_layout
 */

var CONFIG = require('./../../config.js');
var request = require('request');

/**
 * Send a post request to generator service which .
 * @param res - response object.
 * @param layoutData - object containing AI data e.g {aiData: componentsPixelData, imageWidth: width, imageHeight: height, filename: unixtimestamp}
 * @param callback - callback function called when data from AI service is available
 * @throws {object} If any error is encountered, the erorr received is of the format { data: erroData, category: 'error', msg: 'Error Message', title: 'Service/ Module Name'}
 */
function sendAIDataToLayoutService(res, layoutData, callback){

    console.log(" sending AI Data to layout service at ", CONFIG.server.host_base_url + ":" + CONFIG.server.port+ CONFIG.internal_services.layout.url + "/generate");

    var requestData = {
        aiData : layoutData.componentsData,
        imageWidth: Number(layoutData.imageWidth),
        imageHeight:  Number(layoutData.imageHeight),
        filename: layoutData.filename
    };
    request({
        method: 'POST',
        url: CONFIG.server.host_base_url + ":" + CONFIG.server.port +CONFIG.internal_services.layout.url + "/generate",
        json: requestData,
        agentOptions: {
            rejectUnauthorized: false
        },
        timeout: 15 * 1000
    }, (err, response, body) => {
        
        if (err) {

            if (CONFIG.logging){
                console.log("ERROR in sending request to Layout service", err);
            }
            
            res.send(JSON.stringify({status: false, msg: 'Could not send request to Layout Service.', category: 'error', title:'UI Module', data: null}));
        }
        else {

            var data = body;

            if (CONFIG.logging){
                console.log("Received data from layout service ", data);
            }
            

            if (data.status){
                callback(body.data);
            }

            else{
                res.send(JSON.stringify(data));
            }
            
        }
    });

}


module.exports.sendAIDataToLayoutService = sendAIDataToLayoutService;