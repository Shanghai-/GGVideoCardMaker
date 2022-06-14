import ffmpeg
from flask import Flask, render_template, flash, redirect, request, url_for, send_from_directory
from werkzeug.utils import secure_filename
import os

UPLOAD_FOLDER = '/uploads'

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["MAX_CONTENT_LENGTH"] = 256 * 1000 * 1000 #256 MB
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/uploads/<filename>", methods=['GET'])
def serve_file(name):
    return send_from_directory(app.config['UPLOAD_FOLDER'], name)

@app.route("/generate", methods=['POST'])
def run_generator():
    if 'video' not in request.files:
        flash('No video file given')
        return redirect(request.url)
    if 'image' not in request.files:
        flash('No image file given')
        return redirect(request.url)
    video = request.files['video']
    image = request.files['image']
    if video and image:
        secure_video = secure_filename(video)
        secure_image = secure_filename(image)
        video.save(os.path.join(app.config['UPLOAD_FOLDER'], secure_video))
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], secure_image))
    else:
        flash('One of your files could not be uploaded.')
        return redirect('/')

@app.route("/editor", methods=['GET'])
def render_editor():
    video_name = request.args.get('v')
    image_name = request.args.get('i')
    if not video_name or not image_name:
        flash('The editor requires both an image and a video to work.')
        return redirect('/')
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_name)
    image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_name)
    if not os.path.exists(video_path) or os.path.exists(image_path):
        flash('The specified video or image could not be found.')
        return redirect('/')
    return render_template('editor.html', video=video_name, image=image_name)

@app.route("/", methods=['GET'])
def render_file_select():
    return render_template('fileSelect.html')
