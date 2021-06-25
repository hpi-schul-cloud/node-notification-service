# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## Unreleased

### Added

- Added E-mail error handling
- Added status routes for queues and transports
- OPS-1297 - Added Changelog github action

### Fixed

- ARC-138 fix changelog action
- added missing package lock file
- fixed debug start scripts

### Changed

- SC-6832, SC-7568 - New implementation of mail service

## [1.2.5] - 2021-06-24

### Changed

- OPS-2468 - changes build pipeline to github actions 

## [1.2.4]

### Fixed

- SC-8772 - update extend of mongodb connection

## [1.2.3]

## [1.2.2]

### Added

- OPS-1575 - Added E-Mail address validation

## [1.1.1]

### Added

- Removed file log handler. (OPS-746)
- Added multi-stages to Dockerfile. (OPS-746)

## [1.1.0]

### Added

- Added Makefile and GitHub Actions build pipeline (#205, OPS-623)
- Added support for multiple SMTP configs (#206, SC-4907)
- Added support for bounce address (#207, SC-4908)

## [1.0.1]

### Added

- Added replyTo on mail interface
