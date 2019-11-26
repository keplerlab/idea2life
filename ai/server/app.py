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


# Initialize Flask application
app = Flask(__name__)
app.config["IMAGES_FOLDER"] = os.path.join("/", *path_run_folder, "static", "images")
print("run folder", app.config["IMAGES_FOLDER"])


# Initialize Template detector code
templateDetector = TemplateDetect()


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
        # TODO :Split into Parse function and validate function
        req = request.json

        response = dict(apiVersion=2.1, context="blank")
        error_response = response.copy()
        error_response["error"] = dict(code="", message="e")

        # print("Error response", error_response)
        # print("Request json received", req)

        # TODO Add validate request separate function:
        if "apiVersion" not in req:
            print("api version not found")
            # TODO: Prepare error response
            error_response["error"]["code"] = 301
            error_response["error"]["message"] = "api version not received"
            return jsonify(error_response)

        if "context" not in req:
            print("context field in reqest not found")
            error_response["error"]["code"] = 409
            error_response["error"]["message"] = "Context not found"
            return jsonify(error_response)

        apiVersion = req["apiVersion"]
        context = req["context"]

        if apiVersion != "2.1":
            print("Invalid api version")
            error_response["error"]["code"] = 301
            error_response["error"][
                "message"
            ] = "Invalid api version request \
                received"
            return jsonify(error_response)

        if "error" in req:
            error_details = req["error"]
            error_code = error_details["code"]
            error_msg = error_details["message"]
            print("Received error in request", error_code, " and Message ", error_msg)
            error_response["error"]["code"] = 410
            error_response["error"][
                "message"
            ] = "Invalid request, Received error in request body"
            return jsonify(error_response)

        if "data" not in req:
            print("data field in reqest not found")
            error_response["error"]["code"] = 411
            error_response["error"][
                "message"
            ] = "data not found: data field in reqest not found"
            return jsonify(error_response)

        data_payload = req["data"]

        if "imgType" not in data_payload or data_payload["imgType"] != "base64":
            print("Unsupported data field in request, data_payload: ", data_payload)
            error_response["error"]["code"] = 412
            error_response["error"]["message"] = "Unsupported imgType or data"
            return jsonify(error_response)

        if "img" not in data_payload:
            print("image field in data not found")
            error_response["error"]["code"] = 413
            error_response["error"]["message"] = "image field in data not found"
            return jsonify(error_response)

        image_base64 = data_payload["img"]

        try:
            # Change name outputs , width, height to : components_detection_list , input_image_width, input_image_height

            outputs, width, height = templateDetector.predict(
                image_base64, app.config["IMAGES_FOLDER"]
            )
        except __import__("binascii").Error as err:
            print("\n\nError in converting base64 image to image\n")
            error_response["error"]["code"] = 414
            error_response["error"][
                "message"
            ] = "Error in converting base64 image to image"
            return jsonify(error_response)

        if len(outputs) <= 0:
            print("Detection error, No Template found")
            error_response["error"]["code"] = 415
            error_response["error"][
                "message"
            ] = "Detection error, No template detected in image"
            return jsonify(error_response)

        # TODO: Explain what this is doing
        for i, item in enumerate(outputs):
            for j in range(i + 1, len(outputs), 1):
                print(templateDetector.check_N_fix_overlap(item, outputs[j]))

            # Sub detection of specialized templates from main template
            # e.g. Detect BigParagraph from paragraph, Detect horizontal image from image class etc.
            item = templateDetector.templates_sub_detection(item)

        response["data"] = dict(results=(outputs), width=str(width), height=str(height))
        returnJSON = jsonify(response)
        print("Successful response with response content : ", returnJSON)

        return returnJSON


def _creation_date(path_to_file):
    """
    Internal function for getting creation date
    Try to get the date that a file was created, falling back to when it was
    last modified if that isn't possible.
    See http://stackoverflow.com/a/39501288/1709587 for explanation.

    :param path_to_file: Get unique file name by getting creation date
    :type path_to_file: string
    :return: get creation date
    :rtype: stat.st_mtime

    """
    if platform.system() == "Windows":
        return os.path.getctime(path_to_file)
    else:
        stat = os.stat(path_to_file)
        try:
            return stat.st_birthtime
        except AttributeError:
            # We're probably on Linux. No easy way to get creation dates here,
            # so we'll settle for when its content was last modified.
            return stat.st_mtime


@app.route("/debug", methods=["GET"])
def debug():
    """ Call this flask endpoint in your browser if you want to view 
    Debug view for detected Images ai Object detector

        :param endpoint: "Flask endpoint where application is hosted"
        :type endpoint: string /debug
        :param methods: GET
        :type methods: POST or GET
    """
    files_list = glob.glob(os.path.join(app.config["IMAGES_FOLDER"], "*"))
    files = sorted(files_list, key=_creation_date, reverse=True)
    files = [os.path.split(_file)[1] for _file in files]
    files = [_ for _ in files if "out" in _]
    data = files[:10]
    # TODO make a function :  files = return top_10_files
    return render_template("debug.html", data=data)
