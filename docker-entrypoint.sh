#!/bin/sh
# Read Docker secret files and export as env vars at runtime.
# This lets Edge middleware (which can't read files) use NEXTAUTH_SECRET
# without storing it in .env or passing it as a plaintext env var in compose.
if [ -f "$NEXTAUTH_SECRET_FILE" ]; then
  export NEXTAUTH_SECRET
  NEXTAUTH_SECRET=$(cat "$NEXTAUTH_SECRET_FILE")
fi
exec "$@"
