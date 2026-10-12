# Desmos 2.0 / Neural Lab Graph

[![Open Calculator](https://img.shields.io/badge/Open_Calculator-Live_Preview-2169d1?style=for-the-badge)](https://daguitarman55555-byte.github.io/desmos-2.0/)

[![Preview build](https://github.com/daguitarman55555-byte/desmos-2.0/actions/workflows/preview.yml/badge.svg?branch=preview)](https://github.com/daguitarman55555-byte/desmos-2.0/actions/workflows/preview.yml)

The **Open Calculator** button points to the latest version published from the preview branch. The address stays the same after updates.

**One-time activation:** Go to [Settings → Pages](https://github.com/daguitarman55555-byte/desmos-2.0/settings/pages). Under Build and deployment, set **Source = GitHub Actions**. Until this is enabled the button may lead to a 404 page.

### After every update

1. Changes are committed to the preview branch.
2. GitHub Actions automatically runs type checking, unit tests, and a Vite build.
3. If the build and publishing succeed, click **Open Calculator** above (or refresh a previously opened tab).

You can see progress in [Live Calculator Preview](https://github.com/daguitarman55555-byte/desmos-2.0/actions/workflows/preview.yml). Every successful build also uploads a **neural-lab-graph-preview** ZIP artifact, even before Pages is enabled.

The preview is a development version, not a production release. The master branch remains independent for review and merging.
