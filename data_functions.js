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

// remove chrome storage data
function removeData(key) {
    return new Promise((resolve, reject) => {
        // Remove data from storage
        chrome.storage.sync.remove([key], function() {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                // Succesful removal
                resolve();
            }
        });
    });
}
