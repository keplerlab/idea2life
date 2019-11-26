

# **Idea2Life**: Tool for fast webapps prototyping

## Resources 
* Homepage and Reference: https://idea2life.readthedocs.io/

## Description
Prototyping a web application is more about ideas than mere sketching wireframes. The biggest barrier to effective prototyping is time and cost. idea2Life is an AI powered rapid prototyping to lower the barrier of prototyping.

With idea2Life, you can create fully functional static websites by just clicking a picture.

##  How to install

#### Using Docker

1. Download and Install Docker Desktop for Mac using this
   link [docker-desktop](https://www.docker.com/products/docker-desktop).
   and for linux using this link
   [docker-desktop on linux](https://docs.docker.com/install/linux/docker-ce/ubuntu/)

2.  Clone repo using this link
    [idea2Life repo](https://github.com/keplerlab/idea2life.git)

3.  Change your directory to your cloned repo.

4.  Download the [model file](https://drive.google.com/file/d/1bE0alaHVfnEjzqhj3EYMzB2RQOscDYdO/view?usp=sharing)
    inside `ai/models`.

5. Open terminal and run following commands 
```
cd <path-to-repo> //you need to be in your repo folder
docker-compose build
```

####   How to run the dockers

1. Open terminal and run the following commands
```
cd <path-to-repo> //you need to be in your repo folder
docker-compose up 
```

####   How to stop the dockers

1. Open terminal and run the following commands
```
cd <path-to-repo> //you need to be in your repo folder
docker-compose down 
```

### Install from source

Please refer to this guide : [Install and use idea2Life from source (without docker)]( https://idea2life.readthedocs.io/en/latest/developer_guides/install_idea2life_without_docker.html )



## How to use Library

Refer to Getting started section in idea2life Reference 
   from [getting_started#how-to-use-idea2life]( https://idea2life.readthedocs.io/en/latest/getting_started.html#how-to-use-idea2life )

## Attributions
1) We have used **darknet** Yolo framework for training and detection of template. https://pjreddie.com/darknet/yolo/
2) For calling darknet object detection api in python we have used **pyyolo** framework. https://github.com/digitalbrain79/pyyolo
3) For editing generated pages using idea2life we are using **tinymce** Javascript library. https://github.com/tinymce/tinymce 
