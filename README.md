# piano-study-app

## 開発（フロント：音符あてゲーム）

```bash
cd frontend
npm install
npm run dev
```

ブラウザで表示されたURL（例: `http://localhost:5173`）を開きます。

## 開発（バックエンド：Laravel / Docker）

```bash
cd infra
docker compose up --build
```

`http://localhost:8080` を開きます。

## AWS公開（フロントのみ / S3 + CloudFront）

### 1. 手動デプロイ

```bash
cd frontend
npm install
S3_BUCKET_NAME=<your-bucket-name> \
CLOUDFRONT_DISTRIBUTION_ID=<your-distribution-id> \
npm run deploy:s3
```

`CLOUDFRONT_DISTRIBUTION_ID` は省略可能です（省略時は invalidation を実行しません）。

### 2. CloudFront のSPA設定

CloudFront の `Custom error response` で以下を設定してください。

- `403 -> /index.html (200)`
- `404 -> /index.html (200)`

### 3. GitHub Actions 自動デプロイ

`main` ブランチに `frontend/**` の変更が push されると、自動デプロイされます。  
ワークフロー: `.github/workflows/deploy-frontend-s3-cloudfront.yml`

GitHub Secrets を作成してください。

- `AWS_ROLE_TO_ASSUME`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`

### 4. GitHub OIDC用 IAMロール作成

テンプレート:

- 信頼ポリシー: `infra/aws/github-oidc-trust-policy.json`
- 権限ポリシー: `infra/aws/frontend-deploy-policy.json`

`<...>` のプレースホルダを自分の値に置換してから実行します。

```bash
# 1) (初回のみ) GitHub OIDC Provider 作成
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2) IAMロール作成
aws iam create-role \
  --role-name github-actions-frontend-deploy \
  --assume-role-policy-document file://infra/aws/github-oidc-trust-policy.json

# 3) インラインポリシー付与
aws iam put-role-policy \
  --role-name github-actions-frontend-deploy \
  --policy-name frontend-s3-cloudfront-deploy \
  --policy-document file://infra/aws/frontend-deploy-policy.json
```

作成後、`AWS_ROLE_TO_ASSUME` には次を設定します。

```text
arn:aws:iam::<AWS_ACCOUNT_ID>:role/github-actions-frontend-deploy
```
