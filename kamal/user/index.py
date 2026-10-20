from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import Config
from controls.auth import auth_bp
from models import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(
        app,
        resources={r'/api/*': {'origins': Config.CORS_ORIGINS}},
        supports_credentials=True,
        allow_headers=['Content-Type', 'Authorization'],
        methods=['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    )
    app.register_blueprint(auth_bp)

    @app.get('/health')
    def health():
        return {'status': 'ok'}

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({'error': {
            'code': 'NOT_FOUND',
            'message': 'Resource not found.',
            'details': {},
        }}), 404

    @app.errorhandler(405)
    def method_not_allowed(_):
        return jsonify({'error': {
            'code': 'METHOD_NOT_ALLOWED',
            'message': 'Method not allowed.',
            'details': {},
        }}), 405

    @app.errorhandler(Exception)
    def unexpected(exception):
        if isinstance(exception, HTTPException):
            return exception

        db.session.rollback()
        app.logger.exception('Unhandled user service error')

        return jsonify({'error': {
            'code': 'INTERNAL_ERROR',
            'message': 'Internal server error.',
            'details': {},
        }}), 500

    return app


app = create_app()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT, debug=False)
