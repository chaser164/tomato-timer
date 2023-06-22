//See background.js for helpful links I referred to during this project
//Doorbell sound:
//https://www.youtube.com/watch?v=gCW8ZC7lvMA&ab_channel=YTSoundEffects

//Run the javascript once DOM is finished loading
document.addEventListener('DOMContentLoaded', function() {
  var sound = new Audio('doorbell.mp3');
  sound.play();
});

//Helps keep service worker alive
//See background.js for the code this is connected to. I got this code from here:
//https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269#66618269
;(function connect() {
  chrome.runtime.connect({name: 'keepAlive'})
    .onDisconnect.addListener(connect);
})();