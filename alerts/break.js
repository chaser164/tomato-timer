//See background.js for helpful links I referred to during this project
//Doorbell sound:
//https://www.youtube.com/watch?v=gCW8ZC7lvMA&ab_channel=YTSoundEffects

//Run the javascript once DOM is finished loading
document.addEventListener('DOMContentLoaded', function() {
  var sound = new Audio('doorbell.mp3');
  sound.play();
  const suggestions = ['Do a quick exercise!', 'Call a family member!', 'Tell yourself how awesome you are!', 'Listen to a song!', 'Do some breathing exercises!', 'Play with your pet if you have one!', 'Make a snack!', 'Watch a video!', 'Brainstorm weekend plans!', 'Drink water!', 'Brainstorm birthday gift ideas!', 'Water your plants if you have any!', 'Give yourself a big hug!', 'Stretch out!', 'Text a friend!', 'Take out your trash!', 'Dance party!', 'Tell yourself that you are so loved!', 'Do a doodle!', 'Brainstorm a new hobby you want to take up!'];
  randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  document.querySelector('#suggestion').innerHTML = '<i>' + randomSuggestion + '</i>';
});

//Helps keep service worker alive
//See background.js for the code this is connected to. I got this code from here:
//https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269#66618269
;(function connect() {
  chrome.runtime.connect({name: 'keepAlive'})
    .onDisconnect.addListener(connect);
})();