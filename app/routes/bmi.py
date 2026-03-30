from flask import Blueprint, render_template
bmi_bp = Blueprint('bmi', __name__, url_prefix='/bmi')
@bmi_bp.route('/')
def bmi():
    return render_template('bmi.html')
