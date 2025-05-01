from flask import Flask, request, jsonify, render_template
import os
import markdown
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

# Configuration
SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
READ_TOKEN = os.getenv('JWT_READ_TOKEN')
EDIT_TOKEN = os.getenv('JWT_EDIT_TOKEN')
PAGES_DIR = Path('pages')

def verify_token(token, edit=False):
    expected = EDIT_TOKEN if edit else READ_TOKEN
    return token == expected

# Hardcoded credentials (replace with database or auth service in production)
ADMIN_CREDENTIALS = {
    'username': 'admin',
    'password': 'lemur123'
}

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if username == ADMIN_CREDENTIALS['username'] and password == ADMIN_CREDENTIALS['password']:
        return jsonify({'token': EDIT_TOKEN})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/pages', methods=['GET'])
def get_pages():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token):
        return jsonify({'error': 'Invalid token'}), 401

    pages = []
    for md_file in PAGES_DIR.rglob('*.md'):
        try:
            with open(md_file, 'r') as f:
                content = f.read()
                parts = content.split('---')
                if len(parts) < 3:
                    continue
                metadata = parts[1]
                meta = dict(line.split(': ', 1) for line in metadata.strip().split('\n'))
                pages.append({
                    'id': str(md_file.relative_to(PAGES_DIR)),
                    'title': meta.get('title'),
                    'category': md_file.parent.parent.name,
                    'section': md_file.parent.name,
                    'author': meta.get('author'),
                    'date': meta.get('date')
                })
        except Exception:
            continue
    return jsonify(pages)

@app.route('/page/<path:id>', methods=['GET'])
def get_page(id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token):
        return jsonify({'error': 'Invalid token'}), 401

    file_path = PAGES_DIR / id
    if not file_path.resolve().is_relative_to(PAGES_DIR.resolve()):
        return jsonify({'error': 'Invalid path'}), 400

    if not file_path.exists():
        return jsonify({'error': 'Page not found'}), 404

    with open(file_path, 'r') as f:
        content = f.read()
        parts = content.split('---')
        if len(parts) < 3:
            return jsonify({'error': 'Invalid page format'}), 400
        metadata = parts[1]
        body = parts[2]
        meta = dict(line.split(': ', 1) for line in metadata.strip().split('\n'))
        html_content = markdown.markdown(body)
        return jsonify({
            'id': id,
            'title': meta.get('title'),
            'author': meta.get('author'),
            'date': meta.get('date'),
            'content': body  # Return raw markdown for editing
        })

@app.route('/page', methods=['POST'])
def create_page():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token, edit=True):
        return jsonify({'error': 'Invalid token'}), 401

    data = request.json
    file_name = f"{data['title'].lower().replace(' ', '-')}.md"
    file_path = PAGES_DIR / data['category'] / data['section'] / file_name
    file_path.parent.mkdir(parents=True, exist_ok=True)

    content = f"""---
title: {data['title']}
author: {data['author']}
date: {datetime.now().strftime('%Y-%m-%d')}
---
{data['content']}
"""
    with open(file_path, 'w') as f:
        f.write(content)
    return jsonify({'id': str(file_path.relative_to(PAGES_DIR)), 'message': 'Page created'})

@app.route('/page/<path:id>', methods=['PUT'])
def update_page(id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token, edit=True):
        return jsonify({'error': 'Invalid token'}), 401

    data = request.json
    file_path = PAGES_DIR / id
    if not file_path.exists():
        return jsonify({'error': 'Page not found'}), 404

    content = f"""---
title: {data['title']}
author: {data['author']}
date: {data['date']}
---
{data['content']}
"""
    with open(file_path, 'w') as f:
        f.write(content)
    return jsonify({'message': 'Page updated'})

@app.route('/page/<path:id>', methods=['DELETE'])
def delete_page(id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token, edit=True):
        return jsonify({'error': 'Invalid token'}), 401

    file_path = PAGES_DIR / id
    if not file_path.exists():
        return jsonify({'error': 'Page not found'}), 404

    file_path.unlink()
    return jsonify({'message': 'Page deleted'})

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_ENV') == 'development')