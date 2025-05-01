from flask import Flask, request, jsonify
import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import frontmatter

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
READ_TOKEN = os.getenv('JWT_READ_TOKEN')
EDIT_TOKEN = os.getenv('JWT_EDIT_TOKEN')
PAGES_DIR = Path('pages')

ADMIN_CREDENTIALS = {
    'username': os.getenv('ADMIN_USERNAME', 'admin'),
    'password': os.getenv('ADMIN_PASSWORD', 'lemur123')
}

def verify_token(token, edit=False):
    if edit:
        return token == EDIT_TOKEN
    return token in {READ_TOKEN, EDIT_TOKEN}

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if data.get('username') == ADMIN_CREDENTIALS['username'] and data.get('password') == ADMIN_CREDENTIALS['password']:
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
            post = frontmatter.load(md_file)
            pages.append({
                'id': str(md_file.relative_to(PAGES_DIR)),
                'title': post.get('title'),
                'category': md_file.parent.parent.name if md_file.parent.parent != PAGES_DIR else '',
                'section': md_file.parent.name,
                'author': post.get('author'),
                'image': post.get('image'),
                'date': post.get('date')
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

    post = frontmatter.load(file_path)
    return jsonify({
        'id': id,
        'title': post.get('title'),
        'author': post.get('author'),
        'image': post.get('image'),
        'date': post.get('date'),
        'content': post.content
    })


@app.route('/page', methods=['POST'])
def create_page():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token, edit=True):
        return jsonify({'error': 'Invalid token'}), 401

    data = request.json
    if not data:
        return jsonify({'error': 'Missing JSON data'}), 400

    title = data.get('title')
    author = data.get('author')
    content = data.get('content', '').strip()

    if not title or not author or not content:
        return jsonify({'error': 'Missing title, author, or content'}), 400

    file_name = f"{title.lower().replace(' ', '-')}.md"
    file_path = PAGES_DIR / data['category'] / data['section'] / file_name
    file_path.parent.mkdir(parents=True, exist_ok=True)

    post = frontmatter.Post(
        content,
        **{
            'title': title,
            'author': author,
            'image': data.get('image'),
            'date': datetime.now().strftime('%Y-%m-%d %H:%M')
        }
    )

    with open(file_path, 'wb') as f:
        frontmatter.dump(post, f)


    return jsonify({'id': str(file_path.relative_to(PAGES_DIR)), 'message': 'Page created'})


@app.route('/page/<path:id>', methods=['PUT'])
def update_page(id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_token(token, edit=True):
        return jsonify({'error': 'Invalid token'}), 401

    file_path = PAGES_DIR / id
    if not file_path.exists():
        return jsonify({'error': 'Page not found'}), 404

    data = request.json
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Content is empty'}), 400

    post = frontmatter.Post(
        content,
        **{
            'title': data['title'],
            'author': data['author'],
            'image': data.get('image'),
            'date': data.get('date')
        }
    )

    with open(file_path, 'wb') as f:  # ✅ FIX HERE
        frontmatter.dump(post, f)

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
        categories = [d.name for d in PAGES_DIR.iterdir() if d.is_dir()]
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
        sections = [d.name for d in category_path.iterdir() if d.is_dir()]
        return jsonify({'sections': sections})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
