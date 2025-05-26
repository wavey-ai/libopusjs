# libopusjs – Opus v1.5.2 fork

A trimmed-down continuation of [ImagicTheCat/libopusjs](https://github.com/ImagicTheCat/libopusjs) that targets Opus 1.5.2-dev

| **Feature**          | **Upstream (v1.3.1)** | **This fork**                  |
|----------------------|------------------------|--------------------------------|
| Opus version         | 1.3.1 tag             | *main* 1.5.2-dev               |
| Output targets       | asm.js + Wasm         | Wasm only                      |
| Heap model           | Growable              | Fixed 32 MB                    |
| JavaScript API       | Streaming     | Frame-based |
| WebAssembly SIMD     | –                     | *TODO*  |


---

## Quick start

```bash
git clone --recursive https://github.com/wavey-ai/libopusjs
cd libopusjs
make init        # pulls Opus submodule & checks out main
make             # builds release/libopus.{mjs,wasm}
./run-tests.sh   # 60-second sine-wave round-trip sanity test
