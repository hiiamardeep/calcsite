from flask import Flask
import os

def create_app():
    app = Flask(__name__)

    app.secret_key = os.environ.get("SECRET_KEY", "dev-key")

    app.config['SUPPORT_URL'] = "https://razorpay.me/@amardeepmg"

    from app.routes.main import main_bp
    from app.routes.calculator import calc_bp
    from app.routes.emi import emi_bp
    from app.routes.bmi import bmi_bp
    from app.routes.age import age_bp
    from app.routes.percentage import pct_bp
    from app.routes.mf import mf_bp
    from app.routes.productivity import prod_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(calc_bp)
    app.register_blueprint(emi_bp)
    app.register_blueprint(bmi_bp)
    app.register_blueprint(age_bp)
    app.register_blueprint(pct_bp)
    app.register_blueprint(mf_bp)
    app.register_blueprint(prod_bp)

    return app
