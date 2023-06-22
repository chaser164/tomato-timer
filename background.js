//This was my main resource for getting associated with chrome extensions:
//https://developer.chrome.com/docs/extensions/
//I refreshed memory about creating JS functions here:
//https://www.w3schools.com/js/js_functions.asp
//I learned about disabling buttons here:
//https://alvarotrigo.com/blog/disable-button-javascript/#:~:text=To%20disable%20a%20button%20using,disabled%20JavaScript%20property%20to%20false%20.
//I learned about constructing the manifest.JSON and other chrome extension fundamentals here:
//https://developer.chrome.com/docs/extensions/mv3/getstarted/
//PSET9 JS was helpful here
//Helpful video tutorial on setting up a chrome extension with Manifest v3:
//https://www.youtube.com/watch?v=zatlOlVR8Ts&ab_channel=codepiep
//I learned about showing and hiding HTML elements here:
//https://www.w3schools.com/jsref/prop_style_display.asp
//Icon buttons how to:
//https://www.w3schools.com/howto/howto_css_icon_buttons.asp
//I learned about injecting scripts here:
//https://www.youtube.com/watch?v=qwEFy4FTbNY&ab_channel=RustyZone
//I learned about opening a link in a new tab here:
//https://wordpress.com/forums/topic/how-to-open-custom-html-link-to-open-in-new-tab/#:~:text=You%20can%20make%20a%20HTML,this%20after%20the%20link%20address.
//I learned details about sending and receiving messages here:
//https://betterprogramming.pub/building-chrome-extensions-communicating-between-scripts-75e1dbf12bb7
//I found code here that helps keep the service worker alive:
//https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269#66618269
//I learned about playing an mp3 here:
//https://gomakethings.com/how-to-play-a-sound-with-javascript/
//I learned about Font Awesome 4 and including icons in HTML here:
//https://www.w3schools.com/icons/fontawesome_icons_intro.asp

const WORKTIME = 1500; //25 mins is 1500 secs
const BREAKTIME = 300; //5 mins is 300 secs

let currentTime = WORKTIME;
let timerGoing = false;
let tomatoMode = false;
let timeToWork = true;
let breakCounter = 0;
let waitRunning = 0;

//Listen for extension being installed
chrome.runtime.onInstalled.addListener(install => {
  if(install.reason == 'install'){
    //Open the configuration page
    chrome.tabs.create({
      url: '/welcome/welcome.html'
    });
  };
});

//Listen for popup opening
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request) {
    if (request.msg == "Popup open") {
        //Communicate status of timer and current left
        sendResponse({sender: 'background.js', timerGoing: timerGoing, time: currentTime, timeToWork: timeToWork, tomatoMode: tomatoMode, waitRunning: waitRunning, breakCounter: breakCounter}); 
    }
  }
});

//Listen for tomato mode start / request to resume the timer
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request) {
    if (request.msg == "GO") {
        //Communicate timer's current value and whether or not wait() is running
        sendResponse({sender: 'background.js', time: currentTime, waitRunning: waitRunning});
        if (waitRunning == 0) {
          timeToWork = request.timeToWork;
          tomatoMode = true;
          timerGoing = true;
          waitRunning++;
          wait(currentTime);
        }
    }
  }
});

//Listen for tomato mode stop / request to pause timer
chrome.runtime.onMessage.addListener((request, sender,sendResponse) => {
  if(request) {
    if (request.msg == "STOP") {
        tomatoMode = request.pause;
        timerGoing = false;
        if (request.pause) {
          sendResponse({sender: 'background.js', time: currentTime});
          timeToWork = request.timeToWork;
        } else {
          //Get ready for new tomato mode
          currentTime = WORKTIME;
          timeToWork = true;
          breakCounter = 0;
        } 
      }
  }
});

//Count down from the given amount of seconds, storing the current time in the currentTime global variable
function wait(amount) {
  //If wait is running more than once, reset and return as a failsafe
  if (waitRunning > 1) {
    waitRunning = 0;
    tomatoMode = false;
    timerGoing = false;
    timeToWork = true;
    breakCounter = 0;
    return;
  }
  if (!tomatoMode || !timerGoing) {
    waitRunning--;
    return;
  }
  //Once the timer gets to 0:
  if (amount == 0) {
    //Check if the timer has just counted down a work period or a break period
    if (timeToWork) {
      breakCounter++;
      showAlert('break');
      //If this is the 4th break in the cycle, execute a 15-minute break. Otherwise 5-minute break
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
      showAlert('work');
      wait(WORKTIME);
    }
    timeToWork = !timeToWork;
    return;
  }
  currentTime = amount;
  setTimeout(function () {
      wait(amount - 1);
  }, 1000)
}

//Alert the user of the end of a timer by redirecting to a new page
function showAlert(breakType) {
  //Open a page depending on the type of the break
  chrome.tabs.create({
    url: '/alerts/' + breakType + '-alert.html'
  });
}

//Keeps the service worker alive!
//I went to office hours to talk about this, but I had trouble finding someone who could sufficiently explain everything
//Here is where I got this code from:
//https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269#66618269
const onUpdate = (tabId, info, tab) => /^https?:/.test(info.url) && findTab([tab]);
findTab();
chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'keepAlive') {
    setTimeout(() => port.disconnect(), 250e3);
    port.onDisconnect.addListener(() => findTab());
  }
});
async function findTab(tabs) {
  if (chrome.runtime.lastError) { /* tab was closed before setTimeout ran */ }
  for (const {id: tabId} of tabs || await chrome.tabs.query({url: '*://*/*'})) {
    try {
      await chrome.scripting.executeScript({target: {tabId}, func: connect});
      chrome.tabs.onUpdated.removeListener(onUpdate);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(onUpdate);
}
function connect() {
  chrome.runtime.connect({name: 'keepAlive'})
    .onDisconnect.addListener(connect);
}