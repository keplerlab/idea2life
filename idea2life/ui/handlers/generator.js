/**
 * This is an example of how to document routes.
 * @module handlers_generator
 */

var CONFIG = require('./../../config.js');
var request = require('request');

/**
 * Send a post request to generator service which .
 * @param res - response object.
 * @param data - object containing XML data and filename e.g {xml: xmldata, filename: unixtimestamp}.
 * @param callback - callback function (to be called when data is available from the generator service).
 * @throws {object} If any error is encountered, the erorr received is of the format
 *  { data: erroData, category: 'error', msg: 'Error Message', title: 'Service/ Module Name'}
 */
function sendXMLToGeneratorService(res, data, callback){

    console.log(" sending Layout Data to generator service at ", CONFIG.server.host_base_url + ":"  + CONFIG.server.port+CONFIG.internal_services.generator.url + "/create_html");

    var requestData = {
        xml: data.xml,
        filename: data.filename
    };
    request({
        method: 'POST',
        url: CONFIG.server.host_base_url +":" + CONFIG.server.port + CONFIG.internal_services.generator.url + "/create_html",
        json: requestData,
        agentOptions: {
            rejectUnauthorized: false
        },
        timeout: 15 * 1000
    }, (err, response, body) => {
        
        if (err) {

            if (CONFIG.logging){
                console.log("ERROR in sending request to Generator service: ", err);
            }
            
            res.send(JSON.stringify({status: false, msg: 'Could not send request to Generator service', data: err, category: 'error', 
            title:'UI Module:'}));
        }
        else {
            // html data is send back to server
            callback(body);
        }
    });

}


module.exports.sendXMLToGeneratorService = sendXMLToGeneratorService;