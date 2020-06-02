# Cancel implicit rules on top Makefile
$(CURDIR)/Makefile Makefile: ;

SHELL := /bin/bash

GIT_REMOTE_URL ?= $(shell git remote get-url origin)
GIT_SHA ?= $(shell git rev-parse HEAD)
GIT_BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD | tr -s "[:punct:]" "-" | tr -s "[:upper:]" "[:lower:]")
GIT_CURRENT_VERSION_TAG ?= $(shell git tag --list "[0-9]*" --sort="-version:refname" --points-at HEAD | head -n 1)
GIT_LATEST_VERSION_TAG ?= $(shell git tag --list "[0-9]*" --sort="-version:refname" | head -n 1)

ifeq ($(GIT_BRANCH),HEAD)
ifneq ($(GIT_CURRENT_VERSION_TAG),)
GIT_BRANCH = master
GIT_LATEST_VERSION_TAG = $(GIT_CURRENT_VERSION_TAG)
else
$(error "Missing valid git version tag!")
endif
endif

PROJECT_DIR ?= $(realpath $(dir $(lastword $(MAKEFILE_LIST))))
PROJECT_NAME ?= $(basename $(notdir $(GIT_REMOTE_URL)))

DOCKER_BUILD_OPTIONS ?= --pull --no-cache --force-rm --rm
DOCKER_PUSH_OPTIONS ?=
DOCKER_IMAGE_NAME ?= schulcloud/$(PROJECT_NAME)
DOCKER_VERSION_TAG ?= $(GIT_BRANCH)_v$(GIT_LATEST_VERSION_TAG)_$(GIT_SHA)
ifeq ($(GIT_LATEST_VERSION_TAG),)
DOCKER_VERSION_TAG = $(GIT_BRANCH)_$(GIT_SHA)
endif
DOCKER_SHA_TAG ?= $(GIT_SHA)

.PHONY: build
build: DOCKER_BUILD_OPTIONS += \
	--file "$(PROJECT_DIR)/Dockerfile" \
	--tag $(DOCKER_IMAGE_NAME):$(DOCKER_VERSION_TAG) \
	--tag $(DOCKER_IMAGE_NAME):$(DOCKER_SHA_TAG)
build:
	docker build $(DOCKER_BUILD_OPTIONS) "$(PROJECT_DIR)"

.PHONY: push
push: DOCKER_PUSH_OPTIONS +=
push:
	docker push $(DOCKER_PUSH_OPTIONS) $(DOCKER_IMAGE_NAME):$(DOCKER_VERSION_TAG)
	docker push $(DOCKER_PUSH_OPTIONS) $(DOCKER_IMAGE_NAME):$(DOCKER_SHA_TAG)
