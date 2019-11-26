#!/bin/bash

if [[ $# -eq 0 ]] ; then
    echo 'Provide AILab JSON file name.'
    exit 0
fi

cat $1 | grep "tagName" | cut -d ":" -f 2 | tr -d '", ' | sort | uniq > predefined_classes.txt

echo 'Lables saved in: predefined_classes.txt'
