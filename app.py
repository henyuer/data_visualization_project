from flask import Flask, render_template, jsonify, send_from_directory, abort
import json
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/papers')
def get_papers():
    base_dir = os.path.dirname(os.path.abspath(__file__))  # folder of app.py
    path = os.path.join(base_dir, 'data', 'papers.json')
    print("Looking for file at:", path)
    if not os.path.exists(path):
        print("File not found!")
        return f"File not found: {path}", 404
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} papers")
    return jsonify(data)

@app.route('/authors')
def get_authors():
    base_dir = os.path.dirname(os.path.abspath(__file__))  # folder of app.py
    path = os.path.join(base_dir, 'data', 'authors.json')
    print("Looking for file at:", path)
    if not os.path.exists(path):
        print("File not found!")
        return f"File not found: {path}", 404
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} authors")
    return jsonify(data)

@app.route('/items')
def get_items():
    base_dir = os.path.dirname(os.path.abspath(__file__))  # folder of app.py
    path = os.path.join(base_dir, 'data', 'items.json')
    print("Looking for file at:", path)
    if not os.path.exists(path):
        print("File not found!")
        return f"File not found: {path}", 404
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} items")
    return jsonify(data)

@app.route('/items/<int:item_id>')
def get_item_by_id(item_id):
    path = os.path.join(os.path.dirname(__file__), 'data', 'items.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    for item in data:
        if item['id'] == item_id:
            return jsonify(item)
    return jsonify({'error': 'Item not found'}), 404

@app.route('/data/pictures/<filename>')
def get_picture(filename):
    # Security check: Only allow .jpg files
    if not filename.endswith('.jpg'):
        abort(404)

    # Folder where images are stored
    pictures_dir = os.path.join(app.root_path, 'data', 'pictures')

    # Return the requested file if it exists
    return send_from_directory(pictures_dir, filename)


if __name__ == '__main__':
    app.run(debug=True)
