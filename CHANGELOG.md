# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.3] - 2024-08-26

### Added
- Bridge server log monitoring script (`npm run bridge:logs`)
- Manual storage cleanup tool (`npm run clear-storage`)
- Emergency storage cleanup functionality
- Aggressive storage management to prevent quota issues

### Changed
- Reduced screenshot size limit from 1.5MB to 750KB to save storage
- More aggressive storage cleanup (keeps only 2 screenshots, 3 tokens when storage is full)
- Enhanced error handling with multiple fallback levels

### Fixed
- **CRITICAL**: Fixed storage quota exceeded errors (5MB limit)
- Fixed JavaScript error in `saveTokenMapping` function
- Improved storage cleanup reliability
- Better error recovery when storage is full

## [1.2.1] - 2024-08-26

### Added
- Screenshot capture functionality for visual reference
- Enhanced design token extraction and mapping
- Real-time export with bridge server integration
- MCP server with comprehensive design analysis tools

### Changed
- Improved UI with modern design system
- Enhanced error handling and user feedback
- Better TypeScript type definitions

### Fixed
- Component selection and extraction reliability
- Token mapping accuracy
- Bridge server communication stability

## [1.2.0] - 2024-01-XX

### Added
- Initial release of Figment MCP Plugin
- Figma plugin with modern UI
- MCP server integration
- Design system analysis tools
- Code generation capabilities
- Bridge server for real-time exports

### Features
- One-click export from Figma
- AI-powered code generation
- Design token extraction
- Universal IDE compatibility
- Screenshot capture and storage

## [1.0.0] - 2024-01-XX

### Added
- Initial project setup
- Basic Figma plugin structure
- MCP server foundation
- Core extraction functionality
