"""
.. module:: server.app
    :platform: OS X and Linux
    :synopsis: Main flask application for template detection and debug
"""

import sys
import os
import json
import requests
import string
from pathlib import Path
import glob
import platform

from flask import Flask, render_template, request, jsonify, send_file, render_template

# Add module insert path from parent folder of app.py
path_run_folder = str(os.path.realpath(Path(__file__).parent)).split("/")
sys.path.insert(0, "/" + str(os.path.join(*path_run_folder[:-1])))

# import template detection module
from template_detect.template_detect import TemplateDetect

import server.helper as helper

# Initialize Flask application
app = Flask(__name__)
app.config["IMAGES_FOLDER"] = os.path.join("/", *path_run_folder, "static", "images")

# Suppress print inside pyyolo object detection code

# Disable c/c++ code print statements if debug mode is off in flask app
if app.config["DEBUG"] == False:
    helper.redirect_stderr()
    helper.redirect_stdout()

# Initialize Template detector code
templateDetector = TemplateDetect()

# Create custom exception class for raising input validation errors
class ValidationError(Exception):
    """This is custom exception class for raising exception in case of validation
    errors in flask request.

    :param Exception: Inherit from base class Exception
    :type Exception: Exception

    """

    def __init__(self, message_string):
        """ Initialize exception message string with input message string

        :param object: base class inheritance
        :type object: class:`Object`
        :param message_string: input message string
        :type message_string: json string
        """
        self.message_string = message_string

    def __str__(self):
        """ Special class , if print function is called on class it will return
        message string and hence will print message

        :param object: base class inheritance
        :type object: class:`Object`
        """
        return repr(self.message_string)


def validate_json(input_json):
    """ Validate input json and return image, Raise ValidationError Excpetion
    if any errors in parsing.

    :param input_json: input json
    :type input_json: json
    :return: base 64 image
    :rtype: image_base64
    :raise ValidationError: raise exception of type ValidationError if any validation errors
    """

    response = dict(apiVersion=2.1, context="blank")
    error_response = response.copy()
    error_response["error"] = dict(code="", message="e")

    if "apiVersion" not in input_json:
        print("api version not found")

        error_response["error"]["code"] = 301
        error_response["error"]["message"] = "api version not received"
        raise (ValidationError(jsonify(error_response)))

    if "context" not in input_json:
        print("context field in reqest not found")
        error_response["error"]["code"] = 409
        error_response["error"]["message"] = "Context not found"
        raise (ValidationError(jsonify(error_response)))

    apiVersion = input_json["apiVersion"]
    context = input_json["context"]

    if apiVersion != "2.1":
        print("Invalid api version")
        error_response["error"]["code"] = 301
        error_response["error"][
            "message"
        ] = "Invalid api version request \
            received"
        raise (ValidationError(jsonify(error_response)))

    if "error" in input_json:
        error_details = input_json["error"]
        error_code = error_details["code"]
        error_msg = error_details["message"]
        print("Received error in request", error_code, " and Message ", error_msg)
        error_response["error"]["code"] = 410
        error_response["error"][
            "message"
        ] = "Invalid request, Received error in request body"
        raise (ValidationError(jsonify(error_response)))

    if "data" not in input_json:
        print("data field in reqest not found")
        error_response["error"]["code"] = 411
        error_response["error"][
            "message"
        ] = "data not found: data field in reqest not found"
        raise (ValidationError(jsonify(error_response)))

    data_payload = input_json["data"]

    if "imgType" not in data_payload or data_payload["imgType"] != "base64":
        print("Unsupported data field in request, data_payload: ", data_payload)
        error_response["error"]["code"] = 412
        error_response["error"]["message"] = "Unsupported imgType or data"
        raise (ValidationError(jsonify(error_response)))

    if "img" not in data_payload:
        print("image field in data not found")
        error_response["error"]["code"] = 413
        error_response["error"]["message"] = "image field in data not found"
        raise (ValidationError(jsonify(error_response)))

    image_base64 = data_payload["img"]
    return image_base64


def parse_json(req):
    """ Parse input request and return json

    :param req: input req
    :type req: req
    :return: output json
    :rtype: json
    """
    json_output = request.json
    return json_output


@app.route("/svc", methods=["POST"])
def detect_templates_form_image():
    """ Main flask endpoint used for calling ai template detection service
    Exposed using as a service and consumed by ui module.

    :param endpoint: "Flask endpoint where application is hosted"
    :type endpoint: string /svc
    :param methods: POST
    :type methods: POST or GET

    """
    print("\n\nIn /svc POST for ai service \n\n")

    if request.method == "POST":
        # Parse input request into json
        input_json = parse_json(request)

        # make response json in advance
        response = dict(apiVersion=2.1, context="blank")
        error_response = response.copy()
        error_response["error"] = dict(code="", message="e")

        # Validate input json and get image
        try:
            image_base64 = validate_json(input_json)
        except ValidationError as error:
            print("Validation error: ", error)
            return error.message_string

        # Run template detect on input base64 image

        try:
            components_detection_list, input_image_width, input_image_height = templateDetector.predict(
                image_base64, app.config["IMAGES_FOLDER"]
            )
        except __import__("binascii").Error as err:
            print("\n\nError in converting base64 image to image\n")
            error_response["error"]["code"] = 414
            error_response["error"][
                "message"
            ] = "Error in converting base64 image to image"
            return jsonify(error_response)

        if len(components_detection_list) <= 0:
            print("Detection error, No Template found")
            error_response["error"]["code"] = 415
            error_response["error"][
                "message"
            ] = "Detection error, No template detected in image"
            return jsonify(error_response)

        # Iterate over each detected components , compare it to all other components
        # to check for overalp, For each detected component if their is a possibility of
        # further template sub detections
        for i, item in enumerate(components_detection_list):
            for j in range(i + 1, len(components_detection_list), 1):
                templateDetector.check_N_fix_overlap(item, components_detection_list[j])

            # Sub detection of specialized templates from main template
            # e.g. Detect BigParagraph from paragraph, Detect horizontal image from image class etc.
            item = templateDetector.templates_sub_detection(item)

        # create and send response string
        response["data"] = dict(
            results=(components_detection_list),
            width=str(input_image_width),
            height=str(input_image_height),
        )
        returnJSON = jsonify(response)
        print("Successful response with response content : ", returnJSON)

        return returnJSON


@app.route("/debug", methods=["GET"])
def debug():
    """ Call this flask endpoint in your browser if you want to view 
    Debug view for detected Images ai Object detector

        :param endpoint: "Flask endpoint where application is hosted"
        :type endpoint: string /debug
        :param methods: GET
        :type methods: POST or GET
    """
    top_10_files = helper.return_top_10_files(app.config["IMAGES_FOLDER"])
    return render_template("debug.html", data=top_10_files)
