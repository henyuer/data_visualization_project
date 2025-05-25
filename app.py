from flask import Flask, render_template, jsonify
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


if __name__ == '__main__':
    app.run(debug=True)
