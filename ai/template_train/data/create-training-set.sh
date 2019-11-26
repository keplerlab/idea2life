#!/bin/bash
ls -1 obj/*.jpg | awk '$0="data/"$0' > train.txt
