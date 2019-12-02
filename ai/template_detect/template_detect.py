"""
.. module:: template_detect.template_detect
    :platform: OS X and Linux
    :synopsis: This module has functions related templates detection
"""

import pyyolo
import numpy as np
import sys
import cv2
import os
import json
import requests
import string
from pathlib import Path

import config
import template_detect.utils as utils


# TODO add abstraction for referring bounding box co-ordinates e.g. LEFT = "left"


class TemplateDetect(object):
    """ class for performing template detection on
        input base64 image, This class uses pyyolo api for calling
        darknet object detector and used for detection of templates from
        given image
    """

    def __init__(self):
        """ Initialize pyyolo and darknet for object detection .

        :param object: base class inheritance
        :type object: class:`Object`

        """
        C = config.Config()
        x = str(os.path.realpath(Path(__file__).parent)).split("/")

        weightfile_templates = os.path.join("/", *x[:-1], C.WEIGHTFILE_TEMPLATES)
        self.thresh = C.THRESH
        self.hier_thresh = C.HIER_THRESH

        # initialize pyyolo
        darknet_path = os.path.join("/", *x[:-1], C.DARKNET_PATH)
        datacfg = os.path.join("/", *x[:-1], C.DATACFG)
        cfgfile = os.path.join("/", *x[:-1], C.CFGFILE)
        pyyolo.init(darknet_path, datacfg, cfgfile, weightfile_templates)

    def _bb_intersection_over_union(self, itemA, itemB):
        """Internal function for calculating iou for between two
        detection bounding box

        :param object: base class inheritance
        :type object: class:`Object`
        :param itemA: box A co-ordinates in dictionary
        :type itemA: Box A for overlap checking and correction
        :param itemB: box B co-ordinates in dictionary
        :type itemB: Box B for overlap checking and correction
        :return: overlap iou (intersection over union value)
        :rtype: float

        """
        # determine the (x, y)-coordinates of the intersection rectangle
        boxA = [itemA["left"], itemA["top"], itemA["right"], itemA["bottom"]]
        boxB = [itemB["left"], itemB["top"], itemB["right"], itemB["bottom"]]

        # print(boxA)
        # print(boxB)

        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        # compute the area of intersection rectangle
        interArea = max(0, xB - xA + 1) * max(0, yB - yA + 1)

        # compute the area of both the prediction and ground-truth
        # rectangles
        boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
        boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)

        # compute the intersection over union by taking the intersection
        # area and dividing it by the sum of prediction + ground-truth
        # areas - the interesection area
        iou = interArea / float(boxAArea + boxBArea - interArea)

        # return the intersection over union value
        return iou

    def templates_sub_detection(self, item):
        """function for detection of extra sub templates like BigParagraph
        from existing elements like paragraph.
        TODO: Add more explanation paragraph becomes bigprargraph etc. 
        :param object: base class inheritance
        :type object: class:`Object`
        :param item: box co-ordinates in dictionary
        :type item: Box for overlap checking and correction
        :param itemB: box B co-ordinates in dictionary
        :type itemB: Box B for overlap checking and correction
        :return: Edited box co-ordinates 
        :rtype: python dictionary

        """

        class_name = item["class"]

        # Detect BigParagraph from normal Paragraph
        # TODO: Document manual number = 3
        # TODO: Refactor repeated code into new function Update components
        if class_name == "Paragraph":
            left = item["left"]
            top = item["top"]
            bottom = item["bottom"]
            right = item["right"]
            width = right - left
            height = bottom - top
            if width > 3 * height:
                item["class"] = "BigParagraph"

        elif class_name == "Image":
            left = item["left"]
            top = item["top"]
            bottom = item["bottom"]
            right = item["right"]
            width = right - left
            height = bottom - top
            if width >= 1.5 * height:
                item["class"] = "ImageHorizontal"
            elif height >= 1.5 * width:
                item["class"] = "ImageVertical"

        elif class_name == "Video":
            left = item["left"]
            top = item["top"]
            bottom = item["bottom"]
            right = item["right"]
            width = right - left
            height = bottom - top
            if width >= 1.5 * height:
                item["class"] = "VideoHorizontal"
            elif height >= 1.5 * width:
                item["class"] = "VideoVertical"

        return item

    def check_N_fix_overlap(self, itemA, itemB):
        """Public function for fixing overlap  between two
        detected bounding box, It firsts calculates intersection
        between two boxes and corrects them by moving one until no
        overlap. 
        TODO: Refactor this function

        :param object: base class inheritance
        :type object: class:`Object`
        :param itemA: box A co-ordinates in dictionary
        :type itemA: Box A for overlap checking and correction
        :param itemB: box B co-ordinates in dictionary
        :type itemB: Box B for overlap checking and correction
        :return: true if overlap fixing done successfully otherwise false
        :rtype: bool

        """
        # If one rectangle is on left side of other
        if itemA["left"] > itemB["right"] or itemB["left"] > itemA["right"]:
            return False

        # If one rectangle is above other
        if itemA["top"] > itemB["bottom"] or itemB["top"] > itemA["bottom"]:
            return False

        widthDiff = 0
        heightDiff = 0
        margin = 2
        if itemA["left"] < itemB["left"]:
            if itemA["right"] < itemB["right"]:
                widthDiff = itemA["right"] - itemB["left"] + margin
            else:
                print("warning: possible iou overlap")
        else:
            if itemB["right"] < itemA["right"]:
                widthDiff = itemB["right"] - itemA["left"] + margin
            else:
                print("warning: possible iou overlap")

        if itemA["top"] < itemB["top"]:
            if itemA["bottom"] < itemB["bottom"]:
                heightDiff = itemA["bottom"] - itemB["top"] + margin
            else:
                print("warning: possible iou overlap")
        else:
            if itemB["bottom"] < itemA["bottom"]:
                heightDiff = itemB["bottom"] - itemA["top"] + margin
            else:
                print("warning: possible iou overlap")

        if (
            widthDiff > 0 and heightDiff > 0 and widthDiff < heightDiff
        ) or heightDiff == 0:
            if itemA["left"] < itemB["left"]:
                if itemA["right"] < itemB["right"]:
                    itemB["left"] = itemB["left"] + widthDiff + margin
                else:
                    print("warning: possible iou overlap")
            else:
                if itemB["right"] < itemA["right"]:
                    itemA["left"] = itemA["left"] + widthDiff + margin
                else:
                    print("warning: possible iou overlap")
        elif (
            widthDiff > 0 and heightDiff > 0 and widthDiff >= heightDiff
        ) or widthDiff == 0:
            if itemA["top"] < itemB["top"]:
                if itemA["bottom"] < itemB["bottom"]:
                    itemB["top"] = itemB["top"] + heightDiff + margin
                else:
                    print("warning: possible iou overlap")
            else:
                if itemB["bottom"] < itemA["bottom"]:
                    itemA["top"] = itemA["top"] + heightDiff + margin
                else:
                    print("warning: possible iou overlap")
        return True

    def _save_file_on_disk(self, image, out_dir):
        """Private function saving image to output directory folder on
        disk

        :param object: base class inheritance
        :type object: class:`Object`
        :param image: input image file
        :type image: input_image binary
        :param out_dir: directory path where files needs to be saved
        :type out_dir: str
        """
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)

        input_file_name = os.path.join(out_dir, utils.generate_filename() + ".png")

        with open(input_file_name, "wb") as f:
            f.write(image)
            return input_file_name

    def predict(self, image_base64, out_dir):
        """Public function for performing template detection on 
        input base64 image, This function uses pyyolo api for calling
        darknet object detector and returns detected templates in python
        dictionary

        :param object: base class inheritance
        :type object: class:`Object`
        :param image_base64: input image file
        :type image_base64: base64 string format
        :param out_dir: directory where image will be saved for debug
        :type out_dir: string
        :return: outputs , w , h (dictionary containing bounding box of detected templates, input image width input image height)
        :rtype: dictionary, int , int
        """
        # Save base64 string as image
        image = utils.base64_to_image(image_base64)
        input_image_name = self._save_file_on_disk(image, out_dir)

        # Load image
        input_image = cv2.imread(input_image_name)

        # Preprocess image
        img = input_image.transpose(2, 0, 1)
        c, h, w = img.shape[0], img.shape[1], img.shape[2]
        data = img.ravel() / 255.0
        data = np.ascontiguousarray(data, dtype=np.float32)

        # Detect elements
        components_detection_list = pyyolo.detect(
            w, h, c, data, self.thresh, self.hier_thresh
        )

        # Draw bboxes
        output_image = utils.draw_bboxes(input_image, components_detection_list)

        # Save output image
        output_image_name = (
            os.path.splitext(os.path.basename(input_image_name))[0] + "_out.png"
        )
        output_image_name = os.path.join(out_dir, output_image_name)
        cv2.imwrite(output_image_name, output_image)
        print("Results saved as", output_image_name)

        return components_detection_list, w, h

    def __del__(self):
        """ Class destructor used for Clean up pyyolo object detector
        """

        print("Cleaning up")
        pyyolo.cleanup()
