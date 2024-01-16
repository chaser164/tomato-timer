const WORKTIME = 1500; //25 mins is 1500 secs
const BREAKTIME = 300; //5 mins is 300 secs
let isPaused = false;
let timerOn = true;
let timeToWork = true;
let countdownTimeout;


//Run the javascript once DOM is finished loading
document.addEventListener('DOMContentLoaded', function() {

    // Configure appropriately by checking storage
    getData('deadline').then(deadline => {
        getData('timeToWork').then(timeToWorkVal => {
            timeToWork = timeToWorkVal;
            // If deadilne found, resume timer
            if(deadline) {
                pausePlayVisuals(true, timeToWorkVal);
                document.getElementById('start').checked = true;
                const currentDate = new Date();
                startTimer(deadline = Math.floor((deadline - currentDate.getTime()) / 1000))
                return;
            }
            getData('msLeft').then(msLeft => {
                isPaused = true;
                // If msLeft found, show paused timer
                if(msLeft) {
                    pausePlayVisuals(false, timeToWorkVal);
                    document.getElementById('start').checked = true;
                    document.querySelector('#timer').innerHTML = formatTime(Math.round(msLeft / 1000));
                    return;
                }
                // Otherwise, turn the timer off
                document.getElementById('stop').click();
            });
        });
    });




    // Listen for the user starting timer
    document.querySelector('#start').addEventListener('click', function() {
        if (timerOn) {
            return;
        }
        timerOn = true;
        setData('timeToWork', true);
        startTimer(WORKTIME);
    });

    //Listen for the user pausing and resuming the timer
    document.querySelector('#pause').addEventListener('click', function () {
        getData('timeToWork').then(timeToWorkVal => {
            if (isPaused) {
                // Pause -> Play
                getData('msLeft').then(msLeft => {
                    const currentDate = new Date();
                    setData('deadline', currentDate.getTime() + msLeft);
                    removeData('msLeft');
                    chrome.runtime.sendMessage({ action: `schedule ${timeToWorkVal ? 'work' : 'break'}`, delayInMinutes: msLeft / 60000 });
                    countdown(Math.floor(msLeft / 1000))
                })
                pausePlayVisuals(true, timeToWorkVal);
                isPaused = false;
            }
            else {
                // Play -> Pause
                chrome.runtime.sendMessage({ action: 'clear' });
                clearTimeout(countdownTimeout);
                isPaused = true;
                getData('deadline').then(deadline => {
                    const currentDate = new Date();
                    setData('msLeft', deadline - currentDate.getTime());
                    removeData('deadline');
                })
                pausePlayVisuals(false, timeToWorkVal);
            }
        });
    });

    //Listen for the user turning off
    document.querySelector('#stop').addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'clear' });
        if (!timerOn) {
            return;
        }
        timerOn = false;
        // Remove any data possible
        removeData('deadline');
        removeData('msLeft');
        document.getElementById('pause').style.display = 'none';
        document.getElementById('timer').style.display = 'none';
        document.getElementById('label').style.display = 'none';
        // stop countdown and pause
        clearTimeout(countdownTimeout);
        isPaused = true
    });
});

// Update button and text when pause/play is clicked
function pausePlayVisuals(timerGoing, timeToWork) {
    // Give the pause button and label the correct icon and text
    document.querySelector('#pause').innerHTML = '<i class="fa fa-' + (timerGoing ? 'pause' : 'play')  + '"></i>';
    document.querySelector('#label').innerHTML = '<b>' + (timeToWork ? 'Time to work!' : 'Break time!') + (timerGoing ? '' : ' (paused)') + '</b>';
    // Show the pause button and timer
    document.getElementById('pause').style.display = 'inline';
    document.getElementById('timer').style.display = 'inline';
}

function startTimer(initTime, timeToWorkInput = null) {
    getData('timeToWork').then(timeToWorkVal => {
        // Only schedule alarms when not a visual reset (i.e. starting or resuming)
        if(timeToWorkInput) {
            timeToWorkVal = timeToWorkInput
        }
        else {
            chrome.runtime.sendMessage({ action: `schedule ${timeToWorkVal ? 'work' : 'break'}`, delayInMinutes: initTime / 60 });
        }
        // allow countdown
        isPaused = false;
        // Show timer with timer going and work time
        pausePlayVisuals(true, timeToWorkVal);
        const currentDate = new Date();
        setData('deadline', currentDate.getTime() + initTime * 1000);
        countdown(initTime);
        // Show label
        document.getElementById('label').style.display = 'inline';
    });
}

// continuously update countdown
function countdown(initTime) {
    // Stop countdown at 0
    if(initTime <= 0)  {
        // Update local timeToWork variable
        timeToWork = !timeToWork;
        startTimer(timeToWork ? WORKTIME : BREAKTIME, timeToWork);
        return;
    }
    // Stop countdown when paused
    if (isPaused) {
        return;
    }
    document.querySelector('#timer').innerHTML = formatTime(initTime);
    countdownTimeout = setTimeout(() => countdown(initTime - 1), 1000);
}

// Formats seconds as MM:SS
function formatTime(secs) {
    let minutes = Math.floor(secs / 60);
    let seconds = secs - minutes * 60;
    let minPlaceholder = '';
    let secPlaceholder = '';
    if (minutes < 10) {
        minPlaceholder = '0';
    }
    if (seconds < 10) {
        secPlaceholder = '0';
    }
    return minPlaceholder + minutes.toString() + ':' + secPlaceholder + seconds.toString();

}

// get chrome storage data
function getData(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([key], function(result) {
        if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
        } else {
            resolve(result[key]);
        }
        });
    });
}
