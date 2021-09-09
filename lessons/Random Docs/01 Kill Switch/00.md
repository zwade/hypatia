# Kill Switch

[Download Now](https://chrome.google.com/webstore/detail/killswitch/jfhaankhjbofagjdnlkjjppjooefegek)

## Overview

Kill Switch is a lightweight Chrome Extension that injects itself into the middle of sensitive API calls to allow users better control over which APIs are being accessed, and when.

For an overview of the motivations underpinning it, see [this blog post](https://dttw.tech/posts/B182t4M6d). The basic idea behind it is that having a better understanding of when sites use sensitive APIs allows users better control and insight into their own privacy.

### Supported APIs

- 💡 Ambient light sensor
- 📋 Clipboard read & write
- 🧮 Cryptography
- 📍 Geolocation
- 🌎 Orientation
- 💳 Payment
- 🧑‍🏭 Service Workers
- 📸 User Media
- 🖼️ WebGL

## Building

To get started working with Kill Switch, install `node` and `yarn`, and then run

```bash
cd js && yarn
```

To create a production build in the root directory, run

```bash
cd js && yarn build
```

To create a live-updating build (also in the root directory), run

```bash
cd js && yarn watch
```

Finally, to turn a production build into a clean zip (no source files, no dependencies) run from the root directory

```bash
yarn package
```

This will create a directory called `package` and a file called `killswitch.zip`.

## Contributing

Contributions are more than welcome! The most useful feature additions are the inclusions of new abusable APIs. If you want to add a new API to Kill Switch, please make sure that it meets the following criteria

- Can be used to identify the user or leak information about them
- Is not used commonly, or in critical paths (usually)
- Can be intercepted without breaking standard or predictable usage.

For instance, the `UserMedia` API would be valid, but the `fetch` API would not be.

## Credits

- Zach Wade ([zwad3](https://twitter.com/zwad3))