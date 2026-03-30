from flask import Blueprint, render_template
prod_bp = Blueprint('productivity', __name__, url_prefix='/productivity')
@prod_bp.route('/')
def productivity():
    return render_template('productivity.html')
