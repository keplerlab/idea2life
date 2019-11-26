"""
    Convert ailab dataset.json to PASCAL VOC formatted xml
"""

import os
import pandas as pd

import lxml.etree
import lxml.builder

import argparse

parser = argparse.ArgumentParser(description='Convert AILab JSON to PASCAL VOC xml.')
parser.add_argument('-i', '--input', required=True, help='Path to AILab JSON file.')
parser.add_argument('-o', '--outdir', required=True, help='Output directory.')
parser.add_argument('--imagesdir', required=True, help='Images folder.')

args = vars(parser.parse_args())
finput = args['input']
outdir = args['outdir']
imagesdir = args['imagesdir']

# Create output folder if not exists
if not os.path.exists(outdir):
    os.makedirs(outdir)

# Read the JSON into dataframe
dataframe = pd.read_json(finput)

# Build the xml tree
E = lxml.builder.ElementMaker()

ROOT = E.annotation
FOLDER = E.folder
FILENAME = E.filename
PATH = E.path
SOURCE = E.source
DATABASE = E.database
SIZE = E.size
WIDTH = E.width
HEIGHT = E.height
DEPTH = E.depth
SEGMENTED = E.segmented
OBJECT = E.object
NAME = E.name
POSE = E.pose
TRUNCATED = E.truncated
DIFFICULT = E.difficult
BNDBOX = E.bndbox
XMIN = E.xmin
YMIN = E.ymin
XMAX = E.xmax
YMAX = E.ymax

for index, row in dataframe.iterrows():
    objects = row['regions']

    xmltree = ROOT(
        FOLDER(os.path.basename(imagesdir)),
        FILENAME(row['id']+'.png'),
        PATH(os.path.abspath(os.path.join(imagesdir, row['id']+'.png'))),
        SOURCE(
            DATABASE('Unknown')
        ),
        SIZE(
            WIDTH(str(row['width'])),
            HEIGHT(str(row['height'])),
            DEPTH('3')
        ),
        SEGMENTED('0')
    )

    for objId in range(len(objects)):
        name = objects[objId]['tagName']
        xmin = round(row['width'] * objects[objId]['left'])
        ymin = round(row['height'] * objects[objId]['top'])
        xmax = round(row['width'] * (objects[objId]['left'] + objects[objId]['width']))
        ymax = round(row['height'] * (objects[objId]['top'] + objects[objId]['height']))

        xmltree.append(
            OBJECT(
                NAME(name),
                POSE('Unspecified'),
                TRUNCATED('0'),
                DIFFICULT('0'),
                BNDBOX(
                    XMIN(str(xmin)),
                    YMIN(str(ymin)),
                    XMAX(str(xmax)),
                    YMAX(str(ymax))
                )
            )
        )

    fn = os.path.join(outdir, row['id']+'.xml')
    with open(fn, 'wb') as f:
        f.write(lxml.etree.tostring(xmltree))
