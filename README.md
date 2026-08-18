# ImageMaker

SNS投稿用画像とYouTubeサムネイルをブラウザ上で作成し、指定ピクセルのPNGとして書き出すWebアプリです。

## 機能

- 9:16（1080×1920px）と16:9（1920×1080px）のサイズ切り替え
- 縦画像ではフィード表示範囲 1080×1350px を意識した中央寄りレイアウト
- カラーコード入力とカラーピッカー
- お気に入りカラーを最大10色まで保存
- 最大3枚の画像アップロード
- テキスト指示から短いキャッチコピーとサブコピーを自動生成
- キラキラ、細い回路線、斜めライン入りの明るい背景
- 白い縁取りと影つきの太字テキスト
- PNGダウンロード

## 開発

```bash
pnpm install
pnpm dev
```

このCodex環境で通常の`node`がPATHにない場合は、同梱NodeをPATHに追加して実行します。

```bash
PATH=/Users/michikooie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/michikooie/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH pnpm dev
```

## ビルド

```bash
pnpm build
```

公開URL:

```text
https://g.it-mei.com/ImageMaker-01
```
