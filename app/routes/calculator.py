from flask import Blueprint, render_template
calc_bp = Blueprint('calculator', __name__, url_prefix='/calculator')
@calc_bp.route('/')
def calculator():
    return render_template('calculator.html')