
.PHONY: build
build:
	./build.sh -O3 -s WASM=1 -s ENVIRONMENT="web,worker" -s EXPORTED_FUNCTIONS=_malloc,_free -s ALLOW_MEMORY_GROWTH=1
