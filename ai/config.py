class Config:
    def __init__(self):
        self.DARKNET_PATH = "lib/pyyolo/darknet"
        self.DATACFG = "data/obj.data"
        self.CFGFILE = "cfg/yolo-obj.cfg"
        self.WEIGHTFILE_SKETCH = "models/yolo-obj_final_sketch.weights"
        self.WEIGHTFILE_TEMPLATES = "models/yolo-obj_45000.weights"
        self.CLASSESFILE = "data/predefined_classes.txt"

        self.THRESH = 0.45
        self.HIER_THRESH = 0.5

        self.OUT_DIR = "server/static/images"
        self.ASSET_DIR = "assets"

        # Snap to grid
        self.gheight = 200
        self.gwidth = 200

        # Color code
        self.cc_default = (0, 255, 0)
        self.cc_blue = (255, 0, 0)
        self.cc_green = (0, 255, 0)
        self.cc_red = (0, 0, 255)
        self.color_scheme = {
            "red": self.cc_red,
            "green": self.cc_green,
            "blue": self.cc_blue,
            "default": self.cc_default,
        }
