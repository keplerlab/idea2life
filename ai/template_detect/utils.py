"""
.. module:: template_detect.utils
    :platform: OS X and Linux
    :synopsis: This module has commonly used helper functions used by template detector module
"""

import cv2
import os
import base64
import random
import string
import datetime
import numpy as np


def image_resize(image, width=None, height=None, inter=cv2.INTER_AREA):
    """Helper function for resizing input image

    :param image: input image for for image resizeing
    :type image: numpy opencv image
    :param width: required width 
    :type width: int
    :param height: required height 
    :type height: int
    :param inter: Interpolation method
    :type inter: enum from types, cv2.INTER_AREA, cv2.INTER_CUBIC, cv2.INTER_LINEAR
    :return: resized output image
    :rtype: numpy opencv image
    """
    # Initialize the dimensions of the image to be resized and
    # grab the image size
    dim = None
    (h, w) = image.shape[:2]

    # If both the width and height are None, then return the
    # original image
    if width is None and height is None:
        return image

    # Check to see if the width is None
    elif width is None:
        # Calculate the ratio of the height and construct the
        # dimensions
        r = height / float(h)
        dim = (int(w * r), height)

    # Check to see if the height is None
    elif height is None:
        # Calculate the ratio of the width and construct the
        # dimensions
        r = width / float(w)
        dim = (width, int(h * r))

    else:
        dim = (width, height)

    # Resize the image
    resized = cv2.resize(image, dim, interpolation=inter)

    # return the resized image
    return resized


def draw_bboxes(img, outputs):
    """Helper function for drawing detected bounding box on input image

    :param img: input image on which drawing of bounding box is applied
    :type img: numpy opencv image
    :param outputs: list of detected bounding boxes
    :type outputs: list of dict
    :return: output image
    :rtype: numpy opencv image
    """
    for output in outputs:
        left = output["left"]
        right = output["right"]
        top = output["top"]
        bottom = output["bottom"]
        label = output["class"]

        font = cv2.FONT_HERSHEY_SIMPLEX

        cv2.rectangle(img, (left, top), (right, bottom), (0, 255, 0), 3)
        cv2.putText(img, label, (left, top), font, 0.8, (255, 0, 0), 2, cv2.LINE_AA)

    return img


def generate_filename():
    """Helper function genereting unique filenames

    :return: output filename
    :rtype: str
    """
    rand_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    now = datetime.datetime.now().strftime("%d-%m-%Y-%H-%M-%S")

    return now + rand_str


def base64_to_image(str):
    """Helper function for conversion of base64 image to opencv image

    :param str: input image in base64 format
    :type str: str
    :return: output image
    :rtype: numpy opencv image

    """

    str = str.replace("data:image/png;base64,", "")  # Stripping the metadata
    str = str.replace("data:image/jpeg;base64,", "")  # Stripping the metadata
    image = base64.b64decode(str)  # Decoding

    return image


def overlay_transparent(background, overlay, x, y):
    """Helper function Overlay an PNG image on another

    :param background: input image on which overlay of another image is performed
    :type background: numpy opencv image
    :param overlay: overlay image
    :type overlay: numpy opencv image
    :param x: x co-ordinate of overlay image to be applied
    :type x: int
    :param y: y co-ordinate of overlay image to be applied
    :type y: int
    :return: output image
    :rtype: numpy opencv image
    """
    background_width = background.shape[1]
    background_height = background.shape[0]

    if x >= background_width or y >= background_height:
        return background

    h, w = overlay.shape[0], overlay.shape[1]

    if x + w > background_width:
        w = background_width - x
        overlay = overlay[:, :w]

    if y + h > background_height:
        h = background_height - y
        overlay = overlay[:h]

    if overlay.shape[2] < 4:
        overlay = np.concatenate(
            [
                overlay,
                np.ones((overlay.shape[0], overlay.shape[1], 1), dtype=overlay.dtype)
                * 255,
            ],
            axis=2,
        )

    overlay_image = overlay[..., :3]
    mask = overlay[..., 3:] / 255.0

    background[y : y + h, x : x + w] = (1.0 - mask) * background[
        y : y + h, x : x + w
    ] + mask * overlay_image

    return background
