const filePickerStatus = [false, false];

function initialize() {
    const imgPicker = document.getElementById('image-input');
    const imgLoader = document.getElementById('image-loader');
    imgPicker.addEventListener('change', e => {
        imgLoader.src = URL.createObjectURL(e.target.files[0]);
        filePickerStatus[0] = true;
        if (filePickerStatus.every(v => v === true)) {
            topBar.collapse();
        }
    }, false);

    const vidPicker = document.getElementById('video-input');
    const vidLoader = document.getElementById('video-loader');
    vidPicker.addEventListener('change', e => {
        vidLoader.src = URL.createObjectURL(e.target.files[0])
        filePickerStatus[1] = true;
        if (filePickerStatus.every(v => v === true)) {
            topBar.collapse();
        }
    }, false);
}

document.addEventListener('DOMContentLoaded', initialize, false);