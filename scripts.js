$(document).ready(function() {

  var player = document.getElementById('player');
  var languageFilter = $('input#language');
  var countryFilter = $('input#country');
  try {
    languageFilter.val(localStorage.getItem('crotv_language', language));
    countryFilter.val(localStorage.getItem('crotv_country', country));
  } catch (e) { console.log(e); };

  var channelsList = [];
  var currentChannel = undefined;
  var currentSource = undefined;

  if (Hls.isSupported()) {
    var hls = new Hls();
  } else if (!videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    alert('Sorry, but Live Streaming feature is not supported on this browser.');
    $('#list .card').css({'pointer-events':'none'});
  };

  fetchList('https://iptv-org.github.io/iptv/channels.json');




  // Fetch list
  function fetchList(source) {
    fetch(source)
    .then(response => response.text())
    .then((data) => {
      //console.log('Success:', data);
      channelsList = JSON.parse(data);
      filterList(channelsList);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  // Filter list
  function filterList(list) {
    var filteredList = list;

    try {
      localStorage.setItem('crotv_language', languageFilter.val());
      localStorage.setItem('crotv_country', countryFilter.val());
    } catch (e) { console.log(e); };

    var language = languageFilter.val().split(' ')[0].replace(/\(|\)/g, '');
    var country = countryFilter.val().split(' ')[0].replace(/\(|\)/g, '');

    if (language != '') {
      filteredList = filteredList.filter(i => i.languages.find(l => l.code == language));
    };
    if (country != '') {
      filteredList = filteredList.filter(i => i.countries.find(c => c.code == country));
    };
    renderList(filteredList);
  }

  // Render list
  function renderList(list) {
    $('#list').html('');
    $.each(list, function(i, item) {
      if (item.url !== undefined) {
        if (item.logo === null) { item.logo = './assets/default.png' }
        $('ul#list').append([
          '<li class="card" data-id="' + i + '" data-name="' + item.name + '" data-source="' + item.url + '" title="' + item.name + '">',
            '<div class="logo desktop"><img src="' + item.logo + '" alt="' + item.name + '"></div>',
            '<p class="name">' + item.name + '</p>',
          '</li>'
        ].join(''));
      };
    });

    $('.card').click( function() {
      currentChannel = $(this);
      currentSource = $(currentChannel).data('source');
      $('.modal .header').html($(currentChannel).data('name'));
      loadHlsStream(currentSource);

      $('.active').removeClass('active');
      $(currentChannel).addClass('active');
    });
  };

  // Load/stop stream
  function loadHlsStream(stream) {
    /*https://github.com/video-dev/hls.js/blob/master/docs/API.md*/
    if (Hls.isSupported()) {
      hls.loadSource(stream);
      hls.attachMedia(player);
    }
    else if (player.canPlayType('application/vnd.apple.mpegurl')) {
      player.src = stream;
    };

    $('#pop').show();
  };
  function unloadHlsStream() {
    if (Hls.isSupported()) {
      hls.detachMedia();
    }
    else if (player.canPlayType('application/vnd.apple.mpegurl')) {
      player.src = '';
    };

    currentChannel = undefined; currentSource = undefined;
    $('.active').removeClass('active');
    $(pop).removeClass('picture').hide();
  };




  // Filter
  $('input#language, input#country').on('change paste keyup', function() {
    filterList(channelsList);
  });

  // Search
  $('input#query').keyup( function() {
    var cards = $('#list .card');
    var search = $(this).val().toLowerCase();

    $.each(cards, function(i, item) {
      if ($(this).children('.name').text().toLowerCase().indexOf(search) > -1) {
        $(this).css({'display':''});
      } else {
        $(this).css({'display':'none'});
      };
    });
  });

  // Buttons
  $('#reload').click( function() {
    loadHlsStream(currentSource);
  });

  $('#bigview').click( function() {
    var modal = $(this).parents('#pop');
    $(pop).addClass('picture');
  });

  $('#close').click( function() {
    var modal = $(this).parents('#pop');
    if ($(pop).hasClass('picture')) {
      unloadHlsStream();
    } else {
      $(pop).addClass('picture');
    }
  });
});

/*
// Convert M3U to JSON
function M3UtoJSON(M3U) {
  return M3U
  .split('#EXTM3U\n').join('')
  .split('#EXTINF')
  .map(line => {
    return line.split(' ').filter(a => a.length >= 4).join(' ')
  }).filter(a => a.length)
  .map(l => {
    const [start, end] = l.split(',')
    const [random, source] = end.split('\n')
    const obj = start.split(' ').reduce((o, item,i) => {
      const [key, val] = item.split('=\"')
      o[key] = val.slice(0, -1)
      return o
    },{
      source, random
    });
    return obj;
  });
};
*/