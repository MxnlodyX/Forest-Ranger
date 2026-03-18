from flask import Blueprint, jsonify

hr_bp = Blueprint('human_resource', __name__)

@hr_bp.route('/api/testAPI', methods=['GET'])
def test_api():
    return jsonify({"message": "Hello, World!"})
