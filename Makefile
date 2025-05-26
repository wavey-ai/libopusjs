OPUS_DIR   := opus
OBJ_DIR    := obj
REL_DIR    := release
JS_SHARED  := $(REL_DIR)/libopus.mjs

CFLAGS_BASE := -O3 -flto -DNDEBUG -fno-exceptions -fno-rtti
EMFLAGS     := --pre-js preapi.js --post-js api.js \
               -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=\"createOpusModule\" \
               -s ENVIRONMENT='web,webview,worker,node' \
               -s EXPORTED_FUNCTIONS='["_opus_malloc","_opus_free","_malloc","_free"]' \
               -s EXPORTED_RUNTIME_METHODS='["HEAP8","HEAPU8","HEAP16","HEAPU16","HEAP32","HEAPU32"]' \
               -s INITIAL_MEMORY=32MB -s ALLOW_MEMORY_GROWTH=0 \
               -s FILESYSTEM=0 -O3 -flto --minify 0

.PHONY: all init clean
all: $(JS_SHARED)

init:
	git submodule update --init --recursive
	git -C $(OPUS_DIR) fetch --tags
	git -C $(OPUS_DIR) checkout main

clean:
	rm -rf $(OBJ_DIR) $(REL_DIR)

$(OBJ_DIR) $(REL_DIR):
	@mkdir -p $@

$(OBJ_DIR)/libopus.a: | $(OBJ_DIR)
	cd $(OPUS_DIR) && ./autogen.sh
	cd $(OPUS_DIR) && \
	  emconfigure ./configure --disable-shared --enable-static \
	    --disable-doc --disable-extra-programs \
	    --host=wasm32-unknown-emscripten \
	    CFLAGS="$(CFLAGS_BASE)"
	cd $(OPUS_DIR) && emmake make -j$$(nproc)
	cp $(OPUS_DIR)/.libs/libopus.a $@

$(JS_SHARED): api.cpp preapi.js api.js $(OBJ_DIR)/libopus.a | $(REL_DIR)
	em++ -I$(OPUS_DIR)/include api.cpp $(OBJ_DIR)/libopus.a $(EMFLAGS) -o $@

$(REL_DIR)/libopus.wasm: $(JS_SHARED) ; @true

