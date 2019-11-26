#!/bin/bash

if [[ $# -eq 0 ]] ; then
    echo 'Provide name of weights file.'
    exit 0
fi

./darknet detector recall data/obj.data yolo-obj.cfg $1
