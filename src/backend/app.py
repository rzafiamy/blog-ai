from flask import Flask, request, jsonify, render_template
import os
import markdown
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# NEW (leaner)
app = Flask(__name__)

# Configuration
SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
READ_TOKEN = os.getenv('JWT_READ_TOKEN')
EDIT_TOKEN = os.getenv('JWT_EDIT_TOKEN')
PAGES_DIR = Path('pages')

def verify_token(token, edit=False):
    if edit:
        return token == EDIT_TOKEN
    return token in {READ_TOKEN, EDIT_TOKEN}

ADMIN_CREDENTIALS = {
    'username': os.getenv('ADMIN_USERNAME', 'admin'),
    'password': os.getenv('ADMIN_PASSWORD', 'lemur123')
}


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if username == ADMIN_CREDENTIALS['username'] and password == ADMIN_CREDENTIALS['password']:
        return jsonify({'token': EDIT_TOKEN})
    return jsonify({'error': 'Invalid credentials'}), 401

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
                meta = dict(
                    line.split(': ', 1) for line in metadata.strip().split('\n') if ': ' in line
                )
                pages.append({
                    'id': str(md_file.relative_to(PAGES_DIR)),
                    'title': meta.get('title'),
                    'category': md_file.parent.parent.name if md_file.parent.parent != PAGES_DIR else '',
                    'section': md_file.parent.name,
                    'author': meta.get('author'),
                    'image': meta.get('image', None),  # Optional image
                    'date': meta.get('date')
                })
        except Exception as e:
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
        meta = dict(
            line.split(': ', 1) for line in metadata.strip().split('\n') if ': ' in line
        )
        return jsonify({
            'id': id,
            'title': meta.get('title'),
            'author': meta.get('author'),
            'image': meta.get('image', None),
            'date': meta.get('date'),
            'content': body
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

    image_line = f"image: {data['image']}" if data.get('image') else ''
    metadata = '\n'.join(filter(None, [
        f"title: {data['title']}",
        f"author: {data['author']}",
        image_line,
        f"date: {datetime.now().strftime('%Y-%m-%d')}"
    ]))

    content = f"""---
{metadata}
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

    image_line = f"image: {data['image']}" if data.get('image') else ''
    metadata = '\n'.join(filter(None, [
        f"title: {data['title']}",
        f"author: {data['author']}",
        image_line,
        f"date: {data['date']}"
    ]))

    content = f"""---
{metadata}
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

@app.route('/categories', methods=['GET'])
def get_categories():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token):
        return jsonify({'error': 'Invalid token'}), 401

    try:
        categories = [
            d.name for d in PAGES_DIR.iterdir()
            if d.is_dir()
        ]
        return jsonify({'categories': categories})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/sections/<category>', methods=['GET'])
def get_sections(category):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token):
        return jsonify({'error': 'Invalid token'}), 401

    category_path = PAGES_DIR / category
    if not category_path.exists() or not category_path.is_dir():
        return jsonify({'error': 'Category not found'}), 404

    try:
        sections = [
            d.name for d in category_path.iterdir()
            if d.is_dir()
        ]
        return jsonify({'sections': sections})
    except Exception as e:
        return jsonify({'error': str(e)}), 500