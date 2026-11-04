#!/usr/bin/env bash
# Uploads the app's built-in photos (apps/mobile/app-photos) to the R2 bucket under static/,
# where the API serves them at /api/v1/static/<path>. Run it once, and again after adding or
# changing a photo (give a changed photo a new file name: the app caches them for a year).
#
#   bash scripts/upload-app-photos.sh            # bucket from apps/api/wrangler.jsonc
#   R2_BUCKET=my-bucket bash scripts/upload-app-photos.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="${R2_BUCKET:-personal-os-assets}"
SOURCE="$ROOT_DIR/apps/mobile/app-photos"

cd "$ROOT_DIR/apps/api"
count=0
while IFS= read -r -d '' file; do
	path="${file#"$SOURCE"/}"
	case "$file" in
	*.webp) type="image/webp" ;;
	*.png) type="image/png" ;;
	*.jpg) type="image/jpeg" ;;
	*.gif) type="image/gif" ;;
	*) continue ;;
	esac
	bunx wrangler r2 object put "$BUCKET/static/$path" --file "$file" --content-type "$type" --remote >/dev/null
	count=$((count + 1))
	echo "uploaded static/$path"
done < <(find "$SOURCE" -type f -print0 | sort -z)
echo "Done: $count photos in $BUCKET/static/"
