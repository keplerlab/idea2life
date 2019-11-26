FROM ubuntu:16.04

# Identify the maintainer of an image
LABEL maintainer="mjain28@sapient.com"
ARG DEBIAN_FRONTEND=noninteractive

RUN  apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
	wget \
    git \
    curl \
    software-properties-common \
	make 

RUN  curl -sL https://deb.nodesource.com/setup_12.x | bash - \
    && \
    apt-get install -y nodejs \
    && \
    apt-get clean && \
rm -rf /var/lib/apt/lists/*

#Install MINICONDA
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O Miniconda.sh && \
	/bin/bash Miniconda.sh -b -p /opt/conda && \
	rm Miniconda.sh

ENV PATH /opt/conda/bin:$PATH

RUN conda install opencv flask

RUN pip install sphinx sphinx-js sphinx-rtd-theme
RUN npm install -g jsdoc

ARG DOWNLOAD_DIR=/download/
ARG PROJECT_DIR=/home/ai/
ARG HOME_DIR=/home/

RUN mkdir ${DOWNLOAD_DIR}

# clone pyyolo and darknet
RUN mkdir ${DOWNLOAD_DIR}/lib \
	&& \
    cd ${DOWNLOAD_DIR}/lib \
    && \
    git clone --recursive https://github.com/keplerlab/pyyolo.git

#COMPILE DARKNET and PYYOLO
RUN cd ${DOWNLOAD_DIR}/lib/pyyolo \
    &&  \
    make -j8  \
    &&  \
    rm -rf build \
    &&  \
    python setup.py build 

COPY . ${PROJECT_DIR}

RUN rm -rf ${PROJECT_DIR}/lib
RUN mv ${DOWNLOAD_DIR}/lib ${PROJECT_DIR}

#Install PYYOLO
RUN cd ${PROJECT_DIR}/lib/pyyolo \
    &&  \
    python setup.py install    
 
RUN cd ${PROJECT_DIR}/ \
    && \
    cp cfg/yolo-obj.cfg lib/pyyolo/darknet/cfg/ \
    && \
    cp data/obj.names lib/pyyolo/darknet/data/


WORKDIR ${PROJECT_DIR}
ENV FLASK_APP server/app.py
ENV FLASK_RUN_HOST 0.0.0.0
CMD ["flask", "run"]