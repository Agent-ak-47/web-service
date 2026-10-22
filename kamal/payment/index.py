import traceback

from flask import Flask
from flask_cors import CORS

from config import Config
from controls.payment import payments_bp
from helpers.responses import error, success
from models import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.json.sort_keys = False

    db.init_app(app)

    CORS(
        app,
        resources={r'/api/*': {'origins': Config.CORS_ORIGINS}},
        supports_credentials=True,
        allow_headers=['Authorization', 'Content-Type'],
        methods=['GET', 'POST', 'OPTIONS'],
    )

    app.register_blueprint(payments_bp)

    @app.get('/health')
    def health():
        return success({
            'service': 'payment',
            'status': 'ok',
            'port': Config.PORT,
        })

    @app.errorhandler(404)
    def not_found(_exception):
        return error('NOT_FOUND', 'The requested endpoint does not exist.', 404)

    @app.errorhandler(405)
    def method_not_allowed(_exception):
        return error('METHOD_NOT_ALLOWED', 'This method is not allowed.', 405)

    @app.errorhandler(Exception)
    def internal_error(exception):
        db.session.rollback()
        print(f'[payment] unhandled {exception!r}', flush=True)
        traceback.print_exc()

        return error('INTERNAL_ERROR', 'Internal server error.', 500)

    return app


app = create_app()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT)
