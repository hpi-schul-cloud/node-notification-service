# Check if its included in a Makefile(.*)
ifneq ($(notdir $(firstword $(MAKEFILE_LIST))),Makefile)
$(error ERROR: This file has to be included in Makefile)
endif

.PHONY: --deploy-test
--deploy-test: SSH_OPTIONS ?=
--deploy-test: SSH_IDENTITY_FILENAME ?=
ifneq ($(SSH_IDENTITY_FILENAME),)
--deploy-test: SSH_OPTIONS += -i $(SSH_IDENTITY_FILENAME)
endif
--deploy-test: SSH_LOGIN_NAME ?=
ifneq ($(SSH_LOGIN_NAME),)
--deploy-test: SSH_OPTIONS += -l $(SSH_LOGIN_NAME)
endif
--deploy-test: DEPLOY_SSH_OPTIONS += \
	-o StrictHostKeyChecking=no \
	-o UserKnownHostsFile=/dev/null
--deploy-test: DEPLOY_SSH_HOSTNAME = test.schul-cloud.org
--deploy-test: DEPLOY_SSH_COMMAND += /usr/bin/docker service update \
	--image $(DOCKER_IMAGE_NAME):$(DOCKER_VERSION_TAG) \
	--force \
	test-schul-cloud_messenger_sync
--deploy-test:
	# Check Docker Hub for existing image tag
	if curl -L -s -f https://registry.hub.docker.com/v2/repositories/$(DOCKER_IMAGE_NAME)/tags/$(DOCKER_VERSION_TAG) > /dev/null; then \
		ssh $(DEPLOY_SSH_OPTIONS) $(DEPLOY_SSH_HOSTNAME) $(DEPLOY_SSH_COMMAND); \
	fi

.PHONY: --deploy-staging
--deploy-staging:
	$(info TODO: Implement recipes for --deploy-staging)

.PHONY: deploy
ifeq ($(GIT_BRANCH),develop)
deploy:: --deploy-test
endif
ifeq ($(patsubst release%,release,$(GIT_BRANCH)),release)
deploy:: --deploy-staging
endif
ifeq ($(patsubst hotfix%,hotfix,$(GIT_BRANCH)),hotfix)
deploy:: --deploy-staging
endif
