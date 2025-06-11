import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)


@app.route('/')
def index():
    # Serve frontend index.html
    return app.send_static_file('index.html')


@app.route('/api/upload', methods=['POST'])
def upload():
    # Receive uploaded image and return a Data URL
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400
    data = file.read()
    b64 = base64.b64encode(data).decode('utf-8')
    mime = file.mimetype
    url = f'data:{mime};base64,{b64}'
    return jsonify({'url': url})


if __name__ == '__main__':
    app.run(debug=True)
