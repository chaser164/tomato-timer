//See background.js for helpful links I referred to during this project

const WORKTIME = 1500; //25 mins is 1500 secs
const BREAKTIME = 300; //5 mins is 300 secs

let timeToWork;
let timerGoing;
let tomatoMode;
let waitRunning;
let breakCounter;

//Run the javascript once DOM is finished loading
document.addEventListener('DOMContentLoaded', function() {

    //Popup has been opened
    chrome.runtime.sendMessage({ msg: "Popup open"}, (response) => {
        if (response) {
            //Align timeToWork, timerGoing, and tomatoMode values with the actual one in the background
            timeToWork = response.timeToWork;
            timerGoing = response.timerGoing;
            tomatoMode = response.tomatoMode;
            waitRunning = response.waitRunning;
            breakCounter = response.breakCounter;
            if (tomatoMode) {
                document.getElementById('start').click(); 
                //If timer is going, display the countdown from background.js
                if (timerGoing) {
                    if (waitRunning == 1) {
                        wait(response.time);
                    } else {
                        //If a mismatch is detected, turn off tomato mode and reset as a failsafe
                        document.getElementById('stop').click();
                    }
                } else {
                    document.querySelector('#timer').innerHTML = formatTime(response.time);
                }
                //Give the pause button and label the correct icon and text
                document.querySelector('#pause').innerHTML = '<i class="fa fa-' + (timerGoing ? 'pause' : 'play')  + '"></i>';
                document.querySelector('#label').innerHTML = '<b>' + (timeToWork ? 'Time to work!' : 'Break time!') + (timerGoing ? '' : ' (paused)') + '</b>';
                //Show the pause button and timer
                document.getElementById('pause').style.display = 'inline';
                document.getElementById('timer').style.display = 'inline';
            } else {
                document.getElementById('stop').click();
                //Hide the pause button and timer and communicate that we're not in tomato mode
                document.getElementById('pause').style.display = 'none';
                document.getElementById('timer').style.display = 'none';
                document.querySelector('#label').innerHTML = '<b>TOMATO MODE OFF</b>';
            }
        }
    });

    // Listen for the user starting tomato mode
    document.querySelector('#start').addEventListener('click', function() {
        if (!tomatoMode && waitRunning == 0) {
            //Communicate to background.js that tomato mode is requesting to be started
            chrome.runtime.sendMessage({ msg: "GO", timeToWork: timeToWork}, (response) => {
                if (response) {
                    if (response.waitRunning == 0) {
                        //Engage tomato mode and start timer
                        tomatoMode = true;
                        timerGoing = true; 
                        timeToWork = true;
                        //Give the pause button and label the correct icon and text
                        document.querySelector('#pause').innerHTML = '<i class="fa fa-pause"></i>'; 
                        document.querySelector('#label').innerHTML = '<b>Time to work!</b>';
                        //Show pause button and timer
                        document.getElementById('pause').style.display = 'inline';
                        document.getElementById('timer').style.display = 'inline';
                        //Display the countdown, amount specified in background.js
                        waitRunning++;
                        wait(response.time);
                    }
                }
            });
        } 
        //If the program is not ready to transition to tomato mode, keep tomato mode off
        else if (!tomatoMode) {
            document.getElementById('stop').click();
        }
    });

    //Listen for the user pausing and resuming the timer
    document.querySelector('#pause').addEventListener('click', function () {
        if (timerGoing) {
            //signify that timer has stopped
            timerGoing = false;
            //Switch the pause button icon and add ' (paused)' to the label
            document.querySelector('#pause').innerHTML = '<i class="fa fa-play"></i>';
            document.querySelector('#label').innerHTML = '<b>' + (timeToWork ? 'Time to work!' : 'Break time!') + ' (paused)</b>';
            //Pass the message
            chrome.runtime.sendMessage({ msg: "STOP", pause: true, timeToWork: timeToWork}, (response) => {
                if (response) {
                    //Display the static clock
                    document.querySelector('#timer').innerHTML = formatTime(response.time);
                }
            });     
            //Ensure wait isn't still running
        } else if (waitRunning == 0) {
            //Pass request to resume the timer
            chrome.runtime.sendMessage({ msg: "GO", timeToWork: timeToWork}, (response) => {
                if (response) {
                    if (response.waitRunning == 0) {
                        //Signify that the timer is starting
                        timerGoing = true;
                        //Switch the pause button icon and remove ' (paused)' from the label
                        document.querySelector('#pause').innerHTML = '<i class="fa fa-pause"></i>'; 
                        document.querySelector('#label').innerHTML = '<b>' + (timeToWork ? 'Time to work!' : 'Break time!') + '</b>';
                        //Display the countdown, resuming from the place where the pause left off
                        waitRunning++;
                        wait(response.time);
                    }
                }
            });  
        }
    });

    //Listen for the user stopping tomato mode
    document.querySelector('#stop').addEventListener('click', function() {
        if (tomatoMode) {
            document.querySelector('#label').innerHTML = '<b>TOMATO MODE OFF</b>';
            tomatoMode = false;
            timerGoing = false;
            breakCounter = 0;
            //Hide pause button and label
            document.getElementById('pause').style.display = 'none';
            document.getElementById('timer').style.display = 'none';
            //Communicate to background.js that tomato mode is stopped
            chrome.runtime.sendMessage({ msg: "STOP", pause: false});    
        }
    });
});

function wait(amount) {
    //If wait is being run more than one at a time, exit tomato mode and reset as failsafe
    if (waitRunning > 1) {
        document.getElementById('stop').click();
        waitRunning = 0;
        return;
    }
    //Quit out of function if we're not in tomato mode anymore
    if (!tomatoMode || !timerGoing) {
        waitRunning--;
        return;
    }
    if (amount == 0) {
        if (timeToWork) {
            document.querySelector('#label').innerHTML = '<b>Break time!</b>';
            breakCounter++;
            if (breakCounter == 4) {
                //long break and reset break counter
                breakCounter = 0;
                wait(BREAKTIME * 3);
              } 
              else {
                wait(BREAKTIME);
              }
        }
        else {
            document.querySelector('#label').innerHTML = '<b>Time to work!</b>';
            wait(WORKTIME);
        }
        timeToWork = !timeToWork;
        return;
    }
    document.querySelector('#timer').innerHTML = formatTime(amount);
    setTimeout(function () {
        wait(amount - 1)
    }, 1000)
}

function formatTime(secs) {
    //Format the seconds value into a 'minutes:seconds' string
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

//Keeps the service worker alive
//See background.js for the code this is connected to. I got this code from here:
//https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269#66618269
;(function connect() {
chrome.runtime.connect({name: 'keepAlive'})
    .onDisconnect.addListener(connect);
})();
