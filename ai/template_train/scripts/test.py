import os, errno
import shutil
from glob import glob

source = 'test'
dest = 'test/out'

images = glob(os.path.join(source, '*.jpg'))

try:
    os.makedirs(dest)
except OSError as e:
    if e.errno != errno.EEXIST:
        raise

if os.path.exists(dest):
    for i in range(0, len(images)):
        commands = [
            './darknet detector -i 1 test data/obj.data yolo-obj.cfg backup/yolo-obj_final.weights',
            images[i]]
        os.system(' '.join(commands))
        shutil.move('predictions.jpg', os.path.join(dest, os.path.basename(images[i])))
