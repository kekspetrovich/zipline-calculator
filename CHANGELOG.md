# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0] - 2026-06-17
### Added
- **Multilingual Support**: Added German (DE) and French (FR) translations.
- **Enhanced Visualizations**: 
  - Speed-based coloring for the cable profile chart (gradient from blue to red).
  - Technical SVG diagram in the Geometry input section.
  - "Aero-only" and "Ideal" simulation lines on the speed chart.
- **Safety Features**: 
  - EN 15567-1 compliant safety status messages based on finish speed.
  - Color-coded finish speed indicators in the stats grid.
- **Versioning**: Integrated application version display and CHANGELOG.md.

### Changed
- Improved UI layout for better density and technical clarity.
- Updated physics engine to include additional simulation variants.

### Fixed
- Improved accuracy of rolling friction calculations.

## [2.0.0] - 2026-06-10
### Added
- Initial "Pro" version with high-fidelity physics engine.
- Interactive charts using D3.js.
- Wind, atmosphere, and complex trolley parameters.
- Anchor reaction calculations and safety factor tracking.
