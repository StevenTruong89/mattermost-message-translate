# Mattermost Message Translate Plugin Makefile

GO ?= go
NPM ?= npm
PLUGIN_ID ?= com.mattermost.message-translate

.PHONY: all build server webapp clean deploy

all: dist

build: server webapp

dist: build
	@echo Creating bundle
	if not exist dist mkdir dist
	if not exist dist\$(PLUGIN_ID) mkdir dist\$(PLUGIN_ID)
	copy plugin.json dist\$(PLUGIN_ID)\
	if not exist dist\$(PLUGIN_ID)\assets mkdir dist\$(PLUGIN_ID)\assets
	copy assets\icon.svg dist\$(PLUGIN_ID)\assets\
	if not exist dist\$(PLUGIN_ID)\server\dist mkdir dist\$(PLUGIN_ID)\server\dist
	if exist server\dist\plugin-linux-amd64 copy server\dist\plugin-linux-amd64 dist\$(PLUGIN_ID)\server\dist\
	if exist server\dist\plugin-windows-amd64.exe copy server\dist\plugin-windows-amd64.exe dist\$(PLUGIN_ID)\server\dist\
	if not exist dist\$(PLUGIN_ID)\webapp\dist mkdir dist\$(PLUGIN_ID)\webapp\dist
	copy webapp\dist\main.js dist\$(PLUGIN_ID)\webapp\dist\
	@echo Creating bundle with correct permissions
	go run build/package/main.go dist/$(PLUGIN_ID) dist/$(PLUGIN_ID).tar.gz
	@echo Bundle created at dist/$(PLUGIN_ID).tar.gz

server:
	@echo Building server
	if not exist server\dist mkdir server\dist
	cd server && $(GO) env -w GOOS=linux GOARCH=amd64 CGO_ENABLED=0 && $(GO) build -o dist/plugin-linux-amd64 ./main/main.go
	cd server && $(GO) env -w GOOS=windows GOARCH=amd64 CGO_ENABLED=0 && $(GO) build -o dist/plugin-windows-amd64.exe ./main/main.go
	$(GO) env -u GOOS GOARCH CGO_ENABLED

webapp:
	@echo Building webapp
	cd webapp && $(NPM) install --legacy-peer-deps && $(NPM) run build

clean:
	@echo Cleaning
	rm -rf server/dist
	rm -rf webapp/dist
	rm -rf dist

deploy: build
	@echo Deploying (simulated)
	# Here you would typically use mmctl to upload the bundle
