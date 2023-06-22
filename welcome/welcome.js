document.addEventListener('DOMContentLoaded', function() {   
    //Listen for the user to click the allow button
    document.querySelector('#allow').addEventListener('click', function() {
        console.log('here');
        //Ask for access to all URLs
        chrome.permissions.request({
            origins: ["<all_urls>"]
        });
    });
});