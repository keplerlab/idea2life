from __future__ import print_function
import xml.etree.ElementTree as ET
import os
import glob
import tqdm
import argparse

parser = argparse.ArgumentParser(description='Convert VOC annotations to Darknet.')
parser.add_argument('--classesfile', metavar='base', type=str, help='Path to classes file.')
parser.add_argument('--inpath',      metavar='base', type=str, help='Input path.')
parser.add_argument('--outpath',     metavar='base', type=str, help='Output path.')

args = parser.parse_args()
classesfile = args.classesfile
inpath      = args.inpath
outpath     = args.outpath

with open(classesfile) as f:
    content = f.readlines()
classes = [c.rstrip('\n') for c in content]

def convert(size, box):
    dw = 1./size[0]
    dh = 1./size[1]
    x = (box[0] + box[1])/2.0
    y = (box[2] + box[3])/2.0
    w = box[1] - box[0]
    h = box[3] - box[2]
    x = x*dw
    w = w*dw
    y = y*dh
    h = h*dh
    return (x,y,w,h)

if not os.path.exists(outpath):
    os.makedirs(outpath)

in_files = glob.glob(os.path.join(inpath, "*.xml"))

for in_file in tqdm.tqdm(in_files):
    tree=ET.parse(in_file)

    root = tree.getroot()
    size = root.find('size')
    w = int(size.find('width').text)
    h = int(size.find('height').text)

    for obj in root.iter('object'):
        difficult = obj.find('difficult').text
        cls = obj.find('name').text
        if cls not in classes or int(difficult) == 1:
            continue
        cls_id = classes.index(cls)
        xmlbox = obj.find('bndbox')
        b = (
            float(xmlbox.find('xmin').text),
            float(xmlbox.find('xmax').text),
            float(xmlbox.find('ymin').text),
            float(xmlbox.find('ymax').text))
        bb = convert((w,h), b)

        out_file = open(os.path.join(outpath, str(os.path.splitext(os.path.basename(in_file))[0]+".txt")), "a+")
        out_file.write(str(cls_id) + " " + " ".join([str(a) for a in bb]) + '\n')
