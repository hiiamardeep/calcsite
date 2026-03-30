from flask import Blueprint, render_template
emi_bp = Blueprint('emi', __name__, url_prefix='/emi')
@emi_bp.route('/')
def emi():
    return render_template('emi.html')
