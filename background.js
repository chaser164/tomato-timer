const WORKTIME = 1500; //25 mins is 1500 secs
const BREAKTIME = 300; //5 mins is 300 secs

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

// set chrome storage data
function setData(key, value) {
    return new Promise((resolve, reject) => {
        // Save data to storage
        chrome.storage.sync.set({ [key]: value }, function() {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } 
            else {
                // Successful set
                resolve();
            }
        });
    });
}

//Listen for extension being installed
chrome.runtime.onInstalled.addListener(install => {
    if(install.reason == 'install'){
        //Open the configuration page
        chrome.tabs.create({
            url: '/welcome/welcome.html'
        });
    };
});

//Alert the user of the end of a timer by redirecting to a new page
function showAlert(breakType) {
    //Open a page depending on the type of the break
    chrome.tabs.create({
        url: '/alerts/' + breakType + '-alert.html'
    });
}

//Listen for alert 
chrome.runtime.onMessage.addListener((request) => {
    if(request) {
        if (request.msg == "break") {
            showAlert("break")
        }
        else if (request.msg == "work") {
            showAlert("work")
        }
    }
});

// Scheduling alarms
chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'schedule work') {
        // Add work alarm if it's not already there
        getData('alarm').then(workAlarm => {
            if(!workAlarm) {
                chrome.alarms.create('work alarm', { delayInMinutes: request.delayInMinutes });
                // console.log(`work alarm set to go off in ${request.delayInMinutes} mins`);
                setData('alarm', true);
            }
        });
    }
    else if(request.action === 'schedule break') {
        // Add break alarm if it's not already there
        getData('alarm').then(breakAlarm => {
            if(!breakAlarm) {
                chrome.alarms.create('break alarm', { delayInMinutes: request.delayInMinutes });
                // console.log(`break alarm set to go off in ${request.delayInMinutes} mins`);
                setData('alarm', true);
            }
        });
    }
    else if(request.action === 'clear') {
        setData('alarm', false);
        chrome.alarms.clear('work alarm');
        chrome.alarms.clear('break alarm');
    }
});

// Firing alarms
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === 'work alarm') {
        showAlert('break')
        updateStorageData();
    }
    else if(alarm.name === 'break alarm') {
        showAlert('work')
        updateStorageData();
    }
});

function updateStorageData() {
    setData('alarm', false);
    chrome.alarms.clear('work alarm');
    chrome.alarms.clear('break alarm');
    getData('timeToWork').then(timeToWorkVal => {
        if(timeToWorkVal === true) {
            // Toggle work time
            setData('timeToWork', false);
            // Begin break timer
            const currentDate = new Date();
            setData('deadline', currentDate.getTime() + BREAKTIME * 1000)
        }
        else if(timeToWorkVal === false) {
            // Toggle work time
            setData('timeToWork', true);
            const currentDate = new Date();
            // Begin work timer
            setData('deadline', currentDate.getTime() + WORKTIME * 1000)

        }
        // Add new alarm
        getData('alarm').then(alarm => {
            if(!alarm) {
                chrome.alarms.create(`${!timeToWorkVal ? 'work' : 'break'} alarm`, { delayInMinutes: !timeToWorkVal ? WORKTIME / 60 : BREAKTIME / 60 });
                // console.log(`NEW alarm set to go off in ${!timeToWorkVal ? WORKTIME / 60 : BREAKTIME / 60} mins`);
                setData('alarm', true);
            }
        });
    });
}
