<h1 align="center" style="border-bottom: none">
    <a href="https://github.com/SantaClaas/dim-ice" target="_blank"><img alt="Dim Ice logo" width="120px" src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/dfb5c3b7b10e20878a3fee6e3b05660e4d3bd9d5/assets/Ice/Color/ice_color.svg"></a><br>Dim Ice
</h1>
<p align="center">A Mastodon client to only see the new</p>

## Things I use

[![Built with open-wc recommendations](https://img.shields.io/badge/built%20with-open--wc-blue.svg)](https://github.com/open-wc)

- [Lit](https://lit.dev) for Web Components
- [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji)
  - at the time of writing I am using the ice emoji as app icon

## Scripts

- `start` runs your app for development, reloading on file changes
- `start:build` runs your app after it has been built using the build command
- `build` builds your app and outputs it in your `dist` directory
- `test` runs your test suite with Web Test Runner
- `lint` runs the linter for your project

## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

## Ideas

- Can I create a router component?
  - Can I implement an js`@authorize({ role: string | undefined, isAuthenticationRequired: boolean : true})` decorator? To only route to page components when it is authorized.
  - With an js`@page("/debug/components")` decorator?
