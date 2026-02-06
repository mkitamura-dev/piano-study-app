#!/usr/bin/env bash
set -euo pipefail

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI が見つかりません。先にインストールしてください。" >&2
  exit 1
fi

if [[ -z "${S3_BUCKET_NAME:-}" ]]; then
  echo "S3_BUCKET_NAME を設定してください。" >&2
  exit 1
fi

if [[ ! -d "dist" ]]; then
  echo "dist がありません。先に npm run build を実行してください。" >&2
  exit 1
fi

echo "Deploy start: s3://${S3_BUCKET_NAME}"

# index.html 以外は長めキャッシュ
aws s3 sync dist "s3://${S3_BUCKET_NAME}" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

# index.html は短命キャッシュ
aws s3 cp dist/index.html "s3://${S3_BUCKET_NAME}/index.html" \
  --cache-control "no-store,no-cache,must-revalidate,max-age=0"

if [[ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]]; then
  echo "Create CloudFront invalidation: ${CLOUDFRONT_DISTRIBUTION_ID}"
  aws cloudfront create-invalidation \
    --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths "/*" >/dev/null
fi

echo "Deploy done."
