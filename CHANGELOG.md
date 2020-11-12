# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## Unreleased

### Added

- OPS-1297 - Added Changelog github action

### Fixed

- ARC-138 fix changelog action
- added missing package lock file
- fixed debug start scripts

### Changed

- SC-6832, SC-7568 - New implementation of mail service

# Release 1.2.2

## Features

- OPS-1575 - Added E-Mail address validation

# Release 1.1.1

## Features

- Removed file log handler. (OPS-746)
- Added multi-stages to Dockerfile. (OPS-746)

# Release 1.1.0

## Features

- Added Makefile and GitHub Actions build pipeline (#205, OPS-623)
- Added support for multiple SMTP configs (#206, SC-4907)
- Added support for bounce address (#207, SC-4908)

# Hotfix 1.0.1

## Features

- Added replyTo on mail interface
