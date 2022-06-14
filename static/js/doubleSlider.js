let totalDuration = 10;

function updateGradient(startTime, endTime) {
    const start = `${(startTime / totalDuration) * 100}%`;
    const end = `${(endTime / totalDuration) * 100}%`;
    const gradient = `linear-gradient(90deg,transparent 0px ${start},gold ${start} ${end}, transparent ${end} 100%)`;

    const sliderBg = document.getElementById('slider-track-inner');
    sliderBg.style.background = gradient;

    // const sliderWrap = document.getElementById('slider-track-outer');
    // console.log(`startTime: ${startTime}, endTime: ${endTime}, duration: ${totalDuration}`);
    // if (startTime === 0) {
    //     if (endTime === totalDuration) {
    //         sliderWrap.style.background = 'gold';
    //     } else {
    //         sliderWrap.style.background = 'linear-gradient(90deg,gold 0px 8px, rgba(0,0,0,0.5) 8px 100%';
    //     }
    // } else if (endTime === totalDuration) {
    //     sliderWrap.style.background = 'linear-gradient(270deg,gold 0px 8px, rgba(0,0,0,0.5) 8px 100%';
    // } else {
    //     sliderWrap.style.background = 'rgba(0,0,0,0.5)';
    // }
}

function initialize() {
    const startTimeSlider = document.getElementById('slider-start');
    const endTimeSlider = document.getElementById('slider-end');
    
    updateGradient(parseInt(startTimeSlider.value),parseInt(endTimeSlider.value));

    const videoSrc = document.getElementById('video-loader');
    
    endTimeSlider.addEventListener("input", () => {
        const startTime = parseInt(startTimeSlider.value);
        const endTime = parseInt(endTimeSlider.value);
        if (endTime <= startTime) {
            endTimeSlider.value = Math.min(startTime + 1, totalDuration);
        }
        updateGradient(startTime,endTime);
        if (videoSrc.currentTime >= endTime) {
            videoSrc.currentTime = startTime;
        }
    });
    startTimeSlider.addEventListener("input", () => {
        const startTime = parseInt(startTimeSlider.value);
        const endTime = parseInt(endTimeSlider.value);
        if (startTime >= endTime) {
            startTimeSlider.value = Math.max(endTime - 1, 0);
        }
        updateGradient(startTime,endTime);
        videoSrc.currentTime = startTime;
    });

    
    if (videoSrc) {
        videoSrc.addEventListener("loadeddata", e => {
            totalDuration = e.target.duration;
            startTimeSlider.max = totalDuration;
            startTimeSlider.value = 0;
            endTimeSlider.max = totalDuration;
            endTimeSlider.value = totalDuration;
            updateGradient(0,totalDuration);
        });
        videoSrc.addEventListener("timeupdate", e => {
            const startTime = parseInt(startTimeSlider.value);
            const endTime = parseInt(endTimeSlider.value);
            if (e.target.currentTime >= endTime) {
                e.target.currentTime = startTime;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initialize, false);