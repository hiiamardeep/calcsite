from flask import Blueprint, render_template
age_bp = Blueprint('age', __name__, url_prefix='/age')
@age_bp.route('/')
def age():
    return render_template('age.html')
