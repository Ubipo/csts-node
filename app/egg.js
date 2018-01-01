var egg = {
    retries: 3,
    sources: ['hmmmgifs', 'WTF_GIFs', 'brokengifs', 'FractalGifs'],
    defaultGif: 'https://i.imgur.com/HZRLGEl.gif',
    width: '20em',
    init: function() {
      $('#page-wrapper').append('text');
      $('#egg-wrapper').css({'position': 'absolute', 'z-index': '-1', 'height': '100vh', 'width': '100vw', 'margin': 0});  
      $('.egg').css({"background-color": "yellow", "font-size": "200%"});
      $.getScript('http://snaptortoise.github.io/konami-js/konami.js').done(function( script, textStatus ) {
        new Konami(function() {
            egg.trigger();
        });
      });
    },
    trigger: function(retry) {
      if (!retry) {counter=0};
      $('#egg-wrapper').css('background-image', 'url(https://cdnjs.cloudflare.com/ajax/libs/galleriffic/2.0.1/css/loader.gif)').css('background-size', '50px');
      var subReddit = egg.sources[Math.floor(Math.random()*egg.sources.length)];
      $.getJSON('https://www.reddit.com/r/'+subReddit+'/random.json', function(data) {
        var url = data[0].data.children[0].data.url;
        if (!data[0].data.children[0].data.over_18) {
            if (url.slice(-3) == 'gif') {
              $('#egg-wrapper').css('background-image', 'url(' + url + ')').css('background-size', egg.width);
              return;
            } else if (url.slice(-4) == 'gifv' && url.indexOf('imgur.com') != -1) {
              $('#egg-wrapper').css('background-image', 'url(' + url.slice(0, -1) + ')').css('background-size', egg.width);
              return;
            }
        }
        counter++;
        if (counter > egg.retries) {
          $('#egg-wrapper').css('background-image', 'url('+egg.defaultGif+')').css('background-size', egg.width);
          return;
        } else {
          egg.trigger(true);
        }
      })
    }
}

egg.init();