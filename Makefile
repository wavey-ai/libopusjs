###############################################################################
# paths
###############################################################################
OPUS_DIR  := opus
OBJ_DIR   := obj
REL_DIR   := release
JS_SHARED := $(REL_DIR)/libopus.mjs

###############################################################################
# common flags
###############################################################################
CFLAGS_BASE := -O3 -flto -DNDEBUG -fno-exceptions -fno-rtti
SIMD_MACRO  := -DOPUS_WASM_SIMD=1
SIMD_FLAGS  := -msimd128 $(SIMD_MACRO)

EMFLAGS := \
  --pre-js preapi.js --post-js api.js \
  -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=\"createOpusModule\" \
  -s ENVIRONMENT='web,webview,worker,node' \
  -s EXPORTED_FUNCTIONS='["_opus_malloc","_opus_free","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["HEAP8","HEAPU8","HEAP16","HEAPU16","HEAP32","HEAPU32"]' \
  -s INITIAL_MEMORY=32MB -s ALLOW_MEMORY_GROWTH=0 \
  -s FILESYSTEM=0 -O3 -flto --minify 0

###############################################################################
# phony
###############################################################################
.PHONY: all init clean
all: $(JS_SHARED) $(REL_DIR)/libopus-simd.wasm

init:
	git submodule update --init --recursive
	git -C $(OPUS_DIR) fetch --tags
	git -C $(OPUS_DIR) checkout main

clean:
	rm -rf $(OBJ_DIR) $(REL_DIR) $(OPUS_DIR)/simd-build

###############################################################################
# helper dirs
###############################################################################
$(OBJ_DIR) $(REL_DIR):
	@mkdir -p $@

###############################################################################
# baseline archive (float, no SIMD)
###############################################################################
$(OBJ_DIR)/libopus.a: | $(OBJ_DIR)
	cd $(OPUS_DIR) && ./autogen.sh
	cd $(OPUS_DIR) && \
	  emconfigure ./configure --disable-shared --enable-static \
	    --disable-doc --disable-extra-programs \
	    --host=wasm32-unknown-emscripten \
	    CFLAGS="$(CFLAGS_BASE)"
	cd $(OPUS_DIR) && emmake make -j$$(nproc)
	cp $(OPUS_DIR)/.libs/libopus.a $@

###############################################################################
# SIMD archive (fixed-point + intrinsics)
###############################################################################
$(OBJ_DIR)/libopussimd.a: | $(OBJ_DIR)
	rm -rf $(OPUS_DIR)/simd-build && cp -R $(OPUS_DIR) $(OPUS_DIR)/simd-build
	cd $(OPUS_DIR)/simd-build && ./autogen.sh
	cd $(OPUS_DIR)/simd-build && \
	  emconfigure ./configure --disable-shared --enable-static \
	    --disable-doc --disable-extra-programs \
	    --enable-fixed-point --enable-intrinsics \
	    --host=wasm32-unknown-emscripten \
	    CFLAGS="$(CFLAGS_BASE) $(SIMD_FLAGS)" \
	    CPPFLAGS="$(SIMD_FLAGS)"
	cd $(OPUS_DIR)/simd-build && emmake make -j$$(nproc)
	cp $(OPUS_DIR)/simd-build/.libs/libopus.a $@

###############################################################################
# shared JS + baseline wasm
###############################################################################
$(JS_SHARED): api.cpp preapi.js api.js $(OBJ_DIR)/libopus.a | $(REL_DIR)
	em++ -I$(OPUS_DIR)/include api.cpp $(OBJ_DIR)/libopus.a $(EMFLAGS) -o $@

$(REL_DIR)/libopus.wasm: $(JS_SHARED) ; @true    # emitted above

###############################################################################
# SIMD wasm
###############################################################################
$(REL_DIR)/libopus-simd.wasm: api.cpp preapi.js api.js $(OBJ_DIR)/libopussimd.a | $(REL_DIR)
	em++ -I$(OPUS_DIR)/include $(SIMD_FLAGS) api.cpp $(OBJ_DIR)/libopussimd.a \
	    $(EMFLAGS) -s EXPORT_ES6=0 -o $(REL_DIR)/tmp.js
	mv $(REL_DIR)/tmp.wasm $@
	rm $(REL_DIR)/tmp.js

