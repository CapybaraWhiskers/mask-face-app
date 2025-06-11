# mask-face-app

## セットアップ

1. **リポジトリをクローン**
   ```bash
   git clone <repo_url>
   cd mask-face-app
   ```
2. **Python 環境を作成 & 依存インストール**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```
3. **モデルファイルを配置**
   - `frontend/models` に face-api.js のモデルファイル（`ssd_mobilenetv1_model-weights_manifest.json` など）を配置します。
   - モデルは [face-api.js](https://github.com/justadudewhohacks/face-api.js/) から入手してください。
4. **サーバー起動**
   ```bash
   cd backend
   python app.py
   ```
5. **アプリにアクセス**
   - ブラウザで [http://localhost:5000](http://localhost:5000) を開きます。

## 使い方

1. 「Choose File」で画像を選択
2. 顔検出後、😊 が各顔に重ねられます
3. クリックで表示/非表示を切り替え
4. マーカーをドラッグして位置を調整
5. 「Download Masked Image」で最終画像を保存
