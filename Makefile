.PHONY: init
init:
	git submodule update --init --recursive --remote

.PHONY: opus
opus:
	cd opus && ./autogen.sh && emconfigure ./configure --disable-shared --enable-static --disable-doc --disable-extra-programs && emmake make

.PHONY: build
build:
	./build.sh
