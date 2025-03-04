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
    summarize = request.form.get('summarize')
    
    if file_selection:
        file_data = file_selection + ".txt"
    elif file_upload:
        file_data = file_upload
    else:
        return jsonify({'error': 'No file provided'}), 400
    
    alpha = alpha_select if alpha_select else alpha_custom
    visualizeBool = True if visualize == 'yes' else False
    summarizeBool = True if summarize == 'yes' else False

    try:
        print("Starting Prediction")
        result = toden_e.toden_e_predict(
            pags_txt_path=file_data,
            alpha=float(alpha),
            num_clusters=int(clusters),
            is_visualized=visualizeBool,
            is_summary=summarizeBool
        )
        print("Finished Prediction")
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'result': result})

@app.route('/visualize', methods=['POST'])
def visualize():
    file_selection = request.form.get('file')
    file_upload = request.files.get('fileUpload')
    if file_selection:
        # Use the file selection as a file path and append ".csv"
        file_data = file_selection + ".csv"
    elif file_upload:
        file_data = file_upload  # FileStorage object
    else:
        return jsonify({'error': 'No file provided for visualization.'}), 400

    try:
        print("Visualize Begin")
        result = toden_e.visualize_pred_results(pred_dict_path=file_data)
        print("Visualize Complete")
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'result': result})

@app.route('/summarize', methods=['POST'])
def summarize():
    file_selection = request.form.get('file')
    file_upload = request.files.get('fileUpload')
    if file_selection:
        # Use the file selection as a file path and append ".csv"
        file_data = file_selection + ".csv"
    elif file_upload:
        file_data = file_upload  # FileStorage object
    else:
        return jsonify({'error': 'No file provided for summarization.'}), 400

    try:
        print("Summarize Begin")
        result = toden_e.summarize_cluster_results(clustering_results_path=file_data)
        print("Summarize Complete")
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True)
