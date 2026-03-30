from flask import Blueprint, render_template
mf_bp = Blueprint('mf', __name__, url_prefix='/mf')
@mf_bp.route('/')
def mf():
    return render_template('mf.html')
