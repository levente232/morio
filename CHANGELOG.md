# Morio Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- [console] Remove dependency on admin API
- [core] Add support for NAT loopback/hairpinning
- [ui] Fixed incorrect loading of healtcheck chart templates

## [0.7.2] - 2025-02-10

### Changed

- Changed the morionet subnet from /28 to /27

### Fixed

- [client] Fixed issue with extracting vars from template files
- [ui] Fixed the inventory host summary view in dashboard lists
- [ui] Improvements to metrics visualisations

## [0.7.1] - 2025-02-07

### Changed

- [tap] Simplify caching logic, auto-add timestamps
- [ui] Improvements to cache visualisations
- [watcher] Fetch a static file in proxy health check

### Fixed

- [watcher] Fix ID of the core monitor

## [0.7.0] - 2025-02-06

### Changed

- [connector] The Morio connector is now backend by Vector (instead of Logstash)
- [core] We now use `{|` and `|}` as Mustache delimiters to prevent mixups with VRL delimiters
- [client] We now use `{|` and `|}` as Mustache delimiters (for consistency with core)

## [0.6.2] - 2025-02-04

### Added

- Added support for preseeding chart plugins
- [api] Return host name/fqdn when loading inventory data
- [api] Added a new endpoint to read (only) the hostname/fqdn from the inventory
- [ui] Allow overriding certain UI aspects by setting KV keys
- [ui] Add KV management to tools pages
- [ui] Group operating systems on inventory pages
- [ui] Improvement to inventory pages

### Changed

- [ui] Style tweaks
- [ui] Use brand color for dark mode background

### Fixed

- [ui] Add missing inventory/oss icon to main navigation menu
- [tap] Fix an issue with metrics caching expiry
- [dbuilder] Fix incorrect tagging of container image
- [rbuilder] Fix incorrect tagging of container image

## [0.6.1] - 2025-01-28

### Added

- [api] We now return the container tag and release channel from the status endpoint
- [core] We now return the container tag and release channel from the status endpoint
- [ui] Display the release channel on the status page

### Changed

- We now use the same container namespace in dev to prevent namespace squatting

### Fixed

- [tap] Reset npm environment in container to avoid npm issues
- [tap] Missing comma in auto-generated stream processors module loader
- [tap] Add missing dependencies to container image
- [tap] Fix volume mount for processors folder
- [tap] The container will now report the correct name
- [tap] Do not bundle stream processors inside the container image
- [ui] Correctly display type in help messages in LSCL forms
- [ui] Fixed broken links in breadcrumbs [#181](https://github.com/certeu/morio/issues/181)

## [0.6.0] - 2025-01-23

### Added

- Started work on integration tests
- Added the new `ENFORCE_SERVICE_CACHE` feature flag
- [api] Added endpoints to read cache data
- [api] Added endpoints to manage the inventory
- [api] Added endpoints to retrieve flags and dynamic config
- [cache] Added the new cache service (ValKey)
- [connector] Added support for HTTP output
- [connector] Added support for LSCL input, filters, output, and pipelines
- [core] Support preseeding of client modules
- [core] Support preseeding of stream processors
- [core] Handle reseeding of client modules and stream processors
- [core] We now create ACL broker entries for tap service
- [db] Added tables for storing inventory data
- [tap] Added the new tap service for stream processing
- [ui] Added support for filters to the connector setting
- [ui] Added support for specifying input, output, or filter as an LSCL block
- [ui] Added support for writing a connector/logstash pipeline as raw LSCL
- [ui] Added support for HTTP input in connector settings
- [ui] Implemented the `DISABLE_SERVICE_UI` feature flag
- [ui] Added the `force_mrt` query parameter to force the sign in form to show the root token identity provider
- [ui] Added dashboarding (wip)
- [ui] Added inventory views (wip)
- [watcher] Added the `MORIO_IGNORE_CERTIFICATE_EXPIRY` escape hatch

### Changed

- We renamed the `production` release channel to `stable`
- We removed all configuration that was handled differently for unit tests
- Our apt repositories are no longer tied to a specific (Debian) version
- [api] Remove anything done differently for unit tests
- [api] Persist test credentials to disk so tests can be re-run incrementally
- [client] The Morio client is now statically linked to improve portability
- [core] We no longer populate settings with all (disabled) feature flags
- [core] Remove anything done differently for unit tests
- [core] Persist test credentials to disk so tests can be re-run incrementally
- [core] Extended the moriod.env file to allow changing presets
- [shared] `mkdir` is now recursive
- [watcher] Added the cluster UUID to internal monitor IDs

### Fixed

- [api] Handle browser domain mismatch in validation. [#109](https://github.com/certeu/morio/issues/109)
- [api] The `/up` endpoint is now anonymous and returns status 200 [#133](https://github.com/certeu/morio/issues/133)
- [api] RBAC would block access when a token in a cookie was expired, even if a valid Bearer token was provided
- [api] Update test run-script with prefixed container name
- [api] Required length for `api_key` and `api_key_secret` were inverted in the schema
- [broker] Respect broker log level set in preset rather than always use debug
- [ca] Prevent the CA service from restarting at every reload
- [core] Encrypt secrets when provided at initial setup. [#136](https://github.com/certeu/morio/issues/136)
- [core] Improve resilience when preseeding fails
- [core] Support tokens in preseed settings
- [client] Do not show help after restarting agents. [#101](https://github.com/certeu/morio/issues/101)
- [connector] Fixed a regression where the recent move to mTLS for Kafka broke the connector plugin
- [ui] Remove broken link from navigation. [#100](https://github.com/certeu/morio/issues/100)
- [ui] Handle new validation check for browser domain. [#109](https://github.com/certeu/morio/issues/109)
- [ui] Do not assume container images have tags. [#137](https://github.com/certeu/morio/issues/137)
- [watcher] Update internal hostnames with new Docker container prefix

## [0.5.5] - 2024-11-18

### Added

- [api] Added cache endpoints. Currently we support reading these key types: hash, list, set, string, stream, zset
- [client] Added `morio vars list` command

### Changed

- [client] The `morio vars list` and `morio vars export` commands now return vars in alphabetical order

### Fixed

- Fix `build:moriod-repo-deb` runscript after changes to the dbuilder container image in 0.5.4
- [client] Fix name of the configuration file template
- [client] Use client UUID as Kafka client ID
- [client] Drop SASL in favor of mTLS
- [client] Properly handle arrays in client vars
- [client] When exporting vars, parse them to their correct type

## [0.5.4] - 2024-11-15

### Added

- [client] Run morio init on install
- [drbuilder] Added new drbuilder service
- [core] Build both client and repo installer package on initial setup

### Fixed

- [client] Do not attempt to enable services at install
- [client] Handle status subcommand when no arguments are passed
- [dbuilder] Fixed issue in the client package build step that resolved in an invalid APT package
- [dbuilder] Fix issue with the repo installer package build
- [moriod] Detect non-interactive invocation in install script
- [ui] Downloads page now lists the Repository Installer packages
- [web] Handle non-interactive terminal in installer script

## [0.5.3] - 2024-11-13

### Changed

- [ui] Do not hide what's not available to the current role

### Fixed

- [api] Missing optional chaining check in core controller
- [core] Missing optional chaining check in settings controller

## [0.5.2] - 2024-11-13

### Fixed

- [api] Fix incorrect key property when creating JWT in OIDC identity provider
- [core] Do not assume preseed.base is a string, handle objects too

### Removed

- [api] We no longer have a dedicated `/preseed` endpoint, use the `/setup` endpoint instead
- [api] We no longer have a dedicated `/validate/preseed` endpoint, use the `/validate/settings` endpoint instead
- [core] We no longer have a dedicated `/preseed` endpoint, use the `/setup` endpoint instead
- [ui] Removed preseed upload UI

## [0.5.1] - 2024-11-12

### Added

- [api] Implemented the various `DISABLE_IDP_[type]` feature flags
- [core] Added the ability to rotate the Morio Root Token
- [ui] Added feature flag settings to the UI
- [core] Added new actions page including the UI to rotate the Root Token

### Fixed

- [api] Fixed a thrown error in the `GET /token` endpoint due to passing in the wrong attibute
- [api] Implemented the `/kv/dump` endpoint (it always returned an empty object before)
- [api] Fixed incorrect node index in setup validation report
- [api] Allow scratch codes length in schema when validating OTP tokens
- [core] Fix an issue where the running services detection was not updated to reflect the container name prefix causing unneeded service restarts
- [ui] Guard against cluster leader being unknown in status view
- [ui] Show scratch codes after activating MFA on a local account

### Removed

- We have discontinued support for AMI images and have removed the related documentation, configurations, and tools.
- [core] We no longer create broker topics on startup. Note that auto-create is enabled by default

## [0.5.0] - 2024-10-25

Since this is a minor release, here's what's new since 0.4.0:

### Added

- [api] Allow the export of key data
- [api] Allow building of client-repo packages
- [client] Ported the Morio client to Go
- [core] Allow the export of key data
- [core] Allow preseeding key data
- [core] Generate GPG key pair to sign packages
- [core] Automatically build a client packages on initial setup
- [core] Automatically build client installer packages on initial setup
- [core] Provide automated install script for clients
- [core] Support optional mTLS for HTTP behind the `ENFORCE_HTTP_MTLS` feature flag
- [core] Allow building of client-repo packages
- [core] Support preseeding of client templates
- [core] Added support for the RESEED_ON_RELOAD feature flag
- [core] Added support for Debian client packages for amd64 and arm64
- [core] Support to bundle seeded client templates in built packages
- [dbuilder] Maintain APT repository of client packages
- [ui] Allow the export of key data
- [ui] Allow loading key data file in setup wizard
- [ui] Allow building of client-repo packages
- [watcher] We have enabled the watcher service which was disabled due to SASL
- [web] Added the web service to serve files over HTTP

### Changed

- All Morio containers have been updated to use the `morio-` prefix in their name
- Make it easier to run production containers in dev
- [broker] Upgraded RedPanda from v24.2.5 to v24.2.7
- [db] Upgraded Rqlite from v8.30.5 to v8.32.3
- [ca] Upgraded Step CA from v0.27.4 to v0.27.5
- [core] Renamed the `HEADLESS_MORIO` feature flag to `DISABLE_SERVICE_UI`
- [connector] Upgraded Logstash from v8.15.1 to v8.15.3
- [proxy] Upgraded Traefik from v3.1.4 to v3.1.6
- [proxy] Redirect HTTP to HTTPS
- [watcher] Upgraded Heartbeat from v8.15.1 to v8.15.3

### Fixed

- [api] Replace 'next' tag with 'testing'
- [core] Replace 'next' tag with 'testing'
- [core] Allow reseeding when the base config is not preseeded
- [core] Fix an incorrect path when templating out the webroot
- [core] Add missing git binary to itsmorio.core container image
- [broker] Fixed the issue with mTLS that was the reason for the SASL configuration as a temporary workaround
- [core] Guard against untagged images when filtering docker image list
- [dbuilder] Replace 'next' tag with 'testing'
- [dbuilder] Do not resolve MORIO_GIT_ROOT preset in production
- [moriod] Correct location of version file
- [ui] Replace 'next' tag with 'testing'
- [ui] Use correct spinner in setup wizard

### Removed

- [broker] We have removed SASL since we now use mTLS based authentication and authorization

### Security

- [broker] We now use mTLS based authorization (ACL)
- [core] Make console a broker superuser now that an ACL is enforced
- [core] Configure broker ACL for watcher service
- [core] Store the salted&hashed the root token. Earlier, it was stored in clear on disk to facilitate development, no longer.
- [core] Support optional mTLS for HTTP behind the `ENFORCE_HTTP_MTLS` feature flag

## [0.4.2] - 2024-10-02

### Fixed

- [dbuilder] Use correct container tag, rather than bare version number
- [moriod] Remove all containers when service is stopped
- [moriod] Force version file update in package postinstall step

### Removed

- We no longer publish AMI images, use https//install.morio.it/ on your own based image instead

## [0.4.1] - 2024-10-01

### Added

- Support `testing` and `canary` releases of the `moriod-repo` package
- Support for building canary and testing container images (tagged as `canary` and `testing`)

### Changed

- Set default core log level for moriod installs to debug (in systemd unit file)

### Fixed

- Prefix the version number with v in git and container image tags, and systemd unit file
- [core] Correct namespace in systemd unit file
- [moriod] Installing moriod should ensure the folder to hold the proxy config exists on disk
- [moriod] Do not attach core container to morionet in systemd unit file as it does not yet exists on intial setup
- [ui] Fix incorrect import in React animations component
- [ui] Remove unused symlink that broke the Docker build

### Security

- Morio's GPG key used to sign software packages is now signed by CERT-EU

## [0.4.0] - 2024-09-25

### Added

- Added public key used to sign packages to repository
- Added script to buid the moriod-repo .deb package
- [api] Added initial `kv` implementation. This adds a persistent key/value store to Morio
- [api] Added `oidc` identity provider
- [api] Added new `/pubkey` and `/pubkey.pem` endpoints to the API
- [api] Added rate limiting and new `/limits` endpoint to the API
- [api] Improved the OpenAPI specification
- [api] Added new script to lint the OpenAPI spec
- [api] Added support for account labels, based on IDP attributes
- [api] Allow basic authentication for mrt and apikey providers
- [api] Prevent users from generating X.509 certificates that would grant them elevated access
- [broker] Enable (SASL) authorization on the Kafka API (workaround until we get mTLS auth to work)
- [broker] Create initial ACL on startup
- [broker] Added superuser configuration
- [console] Added RBAC checks for console access
- [core] Integration with Hashicorp Vault / OpenBao
- [core] Support for preseeding
- [core] New `MORIO_DOCKER_LOG_DRIVER` preset allows overriding the log driver
- [core] New `MORIO_DOCKER_ADD_HOST` preset allows adding a custom host:ip mapping
- [core] Create root account on intial setup
- [core] JWKS endpoint is now served from core to ensure maximum availability
- [docs] Added search to docs site
- [ui] Added error pages for HTTP status errors
- [ui] Added a new cluster status page in the UI
- [ui] Added preseeding support to UI setup wizard
- [ui] Guard against IDP order including IDPs that are not configured
- [ui] Improved account page
- [ui] Force logout when `whoami` check fails
- [ui] Communicate more clearly why API keys are not available
- [ui] Allow token refresh through the UI
- [ui] Hide UI elements the user does not have access to with their current role
- [proxy] Added RBAC middleware to rpproxy and pradmin
- [watcher] Added the new Watcher service (disabled for now until SASL is removed in favor of mTLS)

### Changed

- Updated container images to use the `itsmorio` namespace
- [api] Allow trailing slash in allowed URLs for browsers who tend to add them or have them cached
- [api] Made `account.about` optional in the data schema
- [api] Improved OpenAPI schema
- [broker] Upgraded RedPanda from v24.1.11 to v24.2.5
- [ca] Upgraded SmallStep Step-CA to v.0.26.1 to v0.27.4
- [connector] Upgraded Elastic Logstash from 8.13.3 to 8.15.1
- [console] Upgraded RedPanda Console from v2.6.1 to v2.7.2
- [core] Improved secret unwrap
- [db] Upgraded RQLite to 8.26.7 to 8.30.5
- [docs] Migrated docs content from `.md` to `.mdx`
- [docs] Updated the term style in docs
- [docs] Moved the API reference documentation (redoc) under the docs route
- [docs] Improve prebuilt documentation pages
- [proxy] Upgraded Traefik from v3.0.4 to v3.1.4
- [ui] Improve settings wizard layout

### Fixed

- Call run scripts through env for improved cross-platform support
- Call auto-generated scripts through env for improved cross-platform support
- [broker] Fixed broker to trust root and intermediate CA certs
- [client] Fixed bug in the client CLI options
- [proxy] Fixed incorrect location of truststore causing certs to fail in proxy service (falling back to default)
- [proxy] Always force restart so that the new certificate configuration is taken into account
- [ui] Allow sign in when the MRT idenity provider is not explicitly configured
- [ui] Do not spread the `key` prop to a React component
- [ui] Account activation through the UI was broken
- [ui] Guard against issue with IDP order
- [ui] Do not make SAN manadatory for X.509 certificate generation
- [ui] Show current role on missing role warning
- [ui] Lock decrypt page below engineer role

### Security

- [proxy] Upgraded Traefik from v3.0.4 to v3.1.4. Fixes [CVE-2024-45410](https://nvd.nist.gov/vuln/detail/CVE-2024-45410)

## [0.3.0] - 2024-08-08

### Added

- [api] We now publish the [itsmorio/api](https://hub.docker.com/r/itsmorio/api) container image and will do so for all future releases
- [core] Initial support for clustering. Morio now support multi-node deployments. [7adc748](https://github.com/certeu/morio/commit/fadc7489e10672105915e38895fa6584ce7ded62)
- [core] We now publish the [itsmorio/core](https://hub.docker.com/r/itsmorio/core) container image and will do so for all future releases
- [dbuilder] We now publish the [itsmorio/dbuilder](https://hub.docker.com/r/itsmorio/dbuilder) container image and will do so for all future releases
- [ui] We now publish the [itsmorio/ui](https://hub.docker.com/r/itsmorio/ui) container image and will do so for all future releases

### Changed

- [api] Migrated API documentation to Redoc
- [broker] Upgraded RedPanda Broker from 23.3.4 to 23.3.15
- [ca] Upgraded SmallStep CA from 0.25.2 to 0.26.1
- [connector] Upgraded Elastic Logstash from 8.12.1 to 8.13.3
- [console] Upgraded RedPanda Console from 2.4.0 to 2.5.2
- [core] Migrated API documentation to Redoc
- [proxy] Upgraded Traefik Application Proxy from 2.10.7 to 2.11.2
- [ui] Migrated API documentation to Redoc

## [0.2.2] - 2024-05-07

### Added

- [api] Start ephemeral LDAP instance for running tests
- [api] Added reconfigure route
- [api] Allow access to test coverage reports when not in production
- [api] Added middleware to guard routes in ephemeral mode
- [api] Add curl to dev container image
- [api] Guard routes while reconfiguring
- [core] Guard routes while reconfiguring
- [core] Setup unit testing for core
- [core] Added middleware to guard routes in ephemeral mode
- [core] Added endpoint to remove Docker network
- [core] On startup, core now creates and attaches to its own Docker network, and then disconnects from all other networks
- [core] Add curl to dev container image
- [core] Carve out exception to not restart API during tests
- [db] Added database service, using Rqlite as database

### Changed

- [api] Do not attempt to authenticate in ephemeral mode
- [api] Removed core routes that we do not want to expose
- [core] Expose port when not in prod to allow serving coverage report
- [core] Unused docker routes were removed
- [proxy] Set alias in dev for unit tests

### Fixed

- [api] Prevent RPKV lookups from hanging when there is no data
- [api] Do not attempt to load config from core in ephemeral mode
- [api] Fix loading of info from core in ephemeral mode
- [api] Handle empty cookie in authentication route
- [core] /jwks endpoint in ephemeral mode
- [core] Typo in returned body
- [ui] MRT login was sending incorrect data
- [ui] Add to npm workspace configuration

## [0.1.6] - 2024-04-22

### Added

- [api] Added `/whoami` route
- [api] Added `/jwks` route
- [core] Added support for the db service
- [core] Added `/jwks` route
- [core] Generate node and deployment UUID
- [core] Return UUIDS after setup
- [core] Added support for setting aliases on containers

### Changed

- [api] Migrated accounts and apikeys from rpkv to db
- [client] No pager when invoking systemctl
- [core] Changes to the connector config generators
- [connector] Changes to the connector configuration
- [ui] Logout user when in ephemeral mode
- [ui] Redirect user when in ephemeral mode on a non-ephemeral URL
- [ui] Changes to connector pipelines for Elasticsearch

### Fixed

- [api] Only allow specific routes in epehemeral mode
- [connector] Make sure pipelines.yml exists prior to mount
- [moriod] Move env files into correct location
- [ui] Fix index input in Elasticsearch pipeline output form
- [ui] Login form when only MRT is available
- [ui] Always redirect to home page in epehemeral mode

### Removed

- [api] Dropped rpkv functionality in favor of the new database service
- [core] Dropped creation of KV topics in favor of the new database service

## [0.1.5] - 2024-04-16

### Added

- [api] Allow downloads from downloads folder
- [config] Added `MORIO_DOWNLOADS_FOLDER` preset defaulting to downloads
- [core] Store root and intermediate CA certificates in downloads/certs folder
- [core] Store broker certificate in downloads/certs folder
- [core] Keep both CA root and intermediate certificates in the store
- [ui] Add download links for root, intermediate, and broker certs to certificates page

### Changed

- Download folder was changed from `tmp_static` to `downloads` and is configurable via preset now
- Update export Docker images script to use new downloads location
- [api] Do not include API prefix when enumerating downloads
- [clients] Changes to client config
- [ui] Do not include API prefix when client package downloads
- [ui] Split create/download certificates into different pages

### Fixed

- [api] Do not check for `MORIO_REPO_ROOT` in production
- [clients] Enabled inputs for filebeat
- [core] Write client ad-hoc config to source files, not destination
- [core] Configure TLS chain on Kafka API port, rather than only the leaf certificate
- [core] Fix incorrect passing of hookProps to lifecycle hook
- [core] Conditionally check hookprops rather than assume they are set
- [core] Fix location of client source files inside container

## [0.1.4] - 2024-04-12

### Added

- [clients] Added logs config folders for linux client
- [moriod] Install revision file with package
- [moriod] Add systemd as a dependency in .deb control file

### Changed

- [api] Changed prefix to -/api from ops/api
- [broker] Check CA status rather than wait an arbitrary time for it to come up
- [core] Add hookProps to reconfigure for informed choices
- [core] Moved config and data into moriod subfolder on host OS
- [moriod] Updates to folder locations
- [proxy] Include custom entrypoint.sh in moriod package

### Fixed

- [broker] Fixed volume config when in develop mode
- [ca] Fixed volume config when in develop mode
- [core] Wait just a smidge before requesting CA certificate to avoid JWT timestamps that predate the CA epoch
- [core] Always recreate containers who need TLS on initial deploy
- [core] Keep auto-generated files out of config image
- [dbuilder] Fixed volume config when in develop mode
- [shared] Pass options to NodeJS cp call
- [moriod] Create version.env file on reconfigure inside repo
- [ui] Fix hardcoded API prefix

### Removed

- [client] Remove option to add Elastic repo as it's a requirement for installation
- [shared] Removed getRevision and verion epoch

## [0.1.3] - 2024-04-09

### Added

- [clients] Extended auditing for Linux client
- [moriod] Extended command line options
- [shared] The cp method now accepts options to pass to the NodeJS fs.cp call

### Changed

- [core] Use the journald Docker log driver for all morio containers
- [core] Use the current Morio version as default version for the .deb client package
- [core] Pass all props to lifecycle hooks as one object
- [core] Reorder Dockerfile layers to improve cache hits
- [moriod] Add postinstall script to start/enable services
- [ui] Renamed PreHeader to BannerMessage as it's a more descriptive name

### Fixed

- [core] Fix check for missing config file at first start of the CA service
- [core] Fix location of dbuilder control file output
- [core] Include client files in core container so it can pass them to the builder
- [ui] Fix broken link to downloads page in .deb builder output
- [ui] Ensure input background respects light/dark color scheme

## [0.1.2] - 2024-04-03

### Added

- This is the first Morio version where we included a changelog
- Changes will be tracked from this version onwards
