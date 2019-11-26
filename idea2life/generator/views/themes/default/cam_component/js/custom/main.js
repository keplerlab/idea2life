var video = null;
var can_snap = true;
var saved_clicked_once = false;

// check for webcam support
function hasGetUserMedia() {
    return !!(navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia);
}


// This function streams webcam stream on the video element
function streamCameraFeed(){

    var constraints = {
        video: {},
        audio: false
    };

    video = document.querySelector('video');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

        navigator.mediaDevices.getUserMedia(constraints).then((stream) =>{

            video.srcObject = stream;
            video.play();

        }).then(function(){

            navigator.mediaDevices.enumerateDevices().then(function(devices){

                console.log(" got devices ", devices);
    
                var camDevices = devices.filter(function(device){return device.kind == "videoinput";});
                console.log(" got camera devices ", camDevices);
    
                if (camDevices.length >  1){
                    
                    console.log(" more than 2 devices found, using the rear camera");
                    
                    constraints.video = {
                        facingMode: { exact: "environment"}
                    };
                }
                else if (camDevices.length == 1){
                    constraints.video = true;
                }
                else {
                    console.log("No cam devices found.");
                }
    
            }).then(function(){
    
                navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    
                    video.srcObject = stream;
                    video.play();
                });
            });    
        });
    }
}

function sendImageToServer(base64Image){

    showloader();

    console.log(" got image ", base64Image);

    var data = {};
    var image = base64Image.split(",");
    data.img = image[1];
    data.header = image[0];
    data.type = data.header.split(";")[0].split("/")[1];

    // will ask for content only, if false, will ask for the filename
    data.send_content = true;

    $.ajax({
        beforeSend: function (xhrObj) {
            xhrObj.setRequestHeader("Content-Type", "application/json");
            xhrObj.setRequestHeader("Accept", "application/json");
        },
        type: "POST",
        url: '/ui/processImage/',
        data: JSON.stringify(data),
        //dataType: "json",
        success: function (result) {

            hideloader();

            var output = JSON.parse(result);
            console.log(" received result ", output);

            // There is some error
            if (!output.status){
                console.log("ERROR", output.errorMsg);
                
                try {
                    raiseToast(output);
                }
                catch(err){
                    console.log(" Could not raise toast for errors: ", err);
                }
                
            }

            else {

                showOutputHTML();

                if (!saved_clicked_once){
                    raiseToast({
                        msg: "Save the page by clicking on the save icon. The page will be deleted otherwise.",
                        category: 'success',
                        title: 'UI:',
                        data: null
                    });
                }

                var html = output.content;
                // console.log(" HTML to render is ", html);
                $('#main').html(html);
                setFilename(output.filename);
                
            }

            // can snap now
            can_snap = true;

        }
    });
}


function renameFile(oldname, newname){
    var data = {
        oldname: oldname,
        newname: newname
    };
    
    $.ajax({
        beforeSend: function (xhrObj) {
            xhrObj.setRequestHeader("Content-Type", "application/json");
            xhrObj.setRequestHeader("Accept", "application/json");
        },
        type: "POST",
        url: '/ui/rename_page/',
        data: JSON.stringify(data),
        //dataType: "json",
        success: function (result) {

            var output = JSON.parse(result);

            // a notification for the status
            raiseToast(output);
        }
    });
}



function snapPictureFromFeed(){
    var canvas = document.querySelector('#canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    image_data = canvas.toDataURL('image/png');

    sendImageToServer(image_data);
}

function hideWebcamContainer(){
    $('.webcam-container').hide();
}

function showWebcamContainer(){
    $('.webcam-container').show();
}

function hideCanvas(){
    $('#canvas').hide();
}

function showCanvas(){
    $('#canvas').show();
}

function hideOutputHTML(){
    $('#main').hide();
}

function showOutputHTML(){
    $('#main').show();
}

function hideVideoContainer(){
    $('#recorder').hide();
}

function showVideoContainer(){
    $('#recorder').show();
}

function hideArrowDown(){
    $('#icon-hide-camera').hide();
}

function showArrowDown(){
    $('#icon-hide-camera').show();
}

function hideArrowUp(){
    $('#icon-show-camera').hide();
}

function showArrowUp(){
    $('#icon-show-camera').show();
}

function setFilename(filename){

    // set filename here
    $('#main').attr("filename", filename);
}

function hideOnJSload(){
    hideCanvas();
    hideArrowUp();

    initializeLoader();
}

function registerEvents(){

    $('#icon-save').click(function(){

        saved_clicked_once = true;

        // show modal here
        $('#myModal').modal();    

    });

    $('#icon-hide-camera').click(function(){

        if ($('#canvas').is(':visible')){
            hideCanvas();
        }

        if ($('#recorder').is(':visible')){
            hideVideoContainer();
        }

        hideArrowDown();
        showArrowUp();
    });

    $('#icon-show-camera').click(function(){

        showVideoContainer();

        hideArrowUp();
        showArrowDown();
    });

    $('#icon-load-camera').click(function(){

        if ($('#canvas').is(':visible')){
            hideCanvas();
        }

        showVideoContainer();
        video.play();

    });

    $('#icon-snap').click(function(){
        video.pause();
        snapPictureFromFeed();
    });

    $('.modal-footer').find('#pagename-modal-submit').click(function(){

        var filename = $('#main').attr('filename');

        // console.log(" filename is ", $('#main').attr('filename'));
        var newname = $('.modal-body input').val();

        if (filename == undefined){
            raiseToast({status: false, msg: 'No file to save.', category: 'error', data: null, title: 'UI Module:'});
            return 0;
        }

        if (newname == undefined){
            raiseToast({status: false, msg: 'Name cant be empty. Please enter a new name.', category: 'error', data: null, title: 'UI Module:'});
            return 0;
        }

        // get the filename from main div
        if (!((filename == undefined) || (newname == undefined))){

            // send request to server with new filename
            renameFile(filename, newname);
        }
    });

    $('#myModal').on('hidden.bs.modal', function() {
        $(this).find('input').val('');
    });
}


// pre-setup phase checks all the requirements 
(function preSetup(){

    $(document).ready(function(){
        if (hasGetUserMedia()) {
            console.log(" getUserMedia is supported");
          } else {
            alert('getUserMedia() is not supported by your browser');
            
        }

        // hide elements on JS load
        hideOnJSload();

        // start the video capture on the video
        streamCameraFeed();

        // register the events
        registerEvents();

    });
}
)();  
    
