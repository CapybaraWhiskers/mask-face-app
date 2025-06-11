# mask-face-app

## セットアップ

1. **リポジトリをクローン**
   ```bash
   git clone <repo_url>
Python 環境を作成 & 依存インストール

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

モデルファイルを配置

frontend/models/ に face-api.js のモデルファイル（ssd_mobilenetv1_model-weights_manifest.json など）を配置

モデルは face-api.js GitHub から入手

サーバー起動

python app.py

アプリにアクセス

ブラウザで http://localhost:5000 を開く

使い方

「Choose File」で画像を選択

顔検出後、😊 が各顔に重ねられます

クリックで表示/非表示切替

マーカーをドラッグして位置調整

「Download Masked Image」で最終画像を保存