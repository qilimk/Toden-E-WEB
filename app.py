# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import toden_e

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    # Get values from form data
    file_selection = request.form.get('file')
    file_upload = request.files.get('fileUpload')
    alpha_select = request.form.get('alphaSelect')
    alpha_custom = request.form.get('alphaCustom')
    visualize = request.form.get('visualize')
    clusters = request.form.get('clusters')
    
    file_data = file_selection if file_selection else file_upload
    alpha = alpha_select if alpha_select else alpha_custom
    visualizeBool = True if visualize == 'Yes' else False

    try:
        result = toden_e.toden_e_predict(file_data, alpha_select, clusters, visualizeBool)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'result': result})

@app.route('/visualize', methods=['POST'])
def visualize():
    file_selection = request.form.get('file')
    file_upload = request.files.get('fileUpload')
    file_data = file_upload if file_upload else file_selection

    try:
        result = toden_e.visualize_function(file_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'result': result})

@app.route('/summarize', methods=['POST'])
def summarize():
    file_selection = request.form.get('file')
    file_upload = request.files.get('fileUpload')
    file_data = file_upload if file_upload else file_selection

    try:
        result = toden_e.summarize_function(file_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True)
