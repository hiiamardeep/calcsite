from flask import Blueprint, render_template
pct_bp = Blueprint('percentage', __name__, url_prefix='/percentage')
@pct_bp.route('/')
def percentage():
    return render_template('percentage.html')
