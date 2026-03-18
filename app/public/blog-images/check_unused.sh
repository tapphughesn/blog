#!/bin/bash

IMAGES_DIR="$(dirname "$0")"
POSTS_DIR="$IMAGES_DIR/../../src/blog-posts"

unused=()
for img in "$IMAGES_DIR"/*.png "$IMAGES_DIR"/*.jpg "$IMAGES_DIR"/*.gif "$IMAGES_DIR"/*.webp; do
  [ -f "$img" ] || continue
  filename=$(basename "$img")
  if ! grep -qr "$filename" "$POSTS_DIR"; then
    unused+=("$filename")
  fi
done

if [ ${#unused[@]} -eq 0 ]; then
  echo "All images are referenced."
else
  echo "Unreferenced images:"
  printf '  %s\n' "${unused[@]}"
fi
