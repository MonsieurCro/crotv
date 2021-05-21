$(document).ready(function() {

  var videoPlayer = document.getElementById('player');
  var languageFilter = $('input#language');
  var countryFilter = $('input#country');
  var categoryFilter = $('input#category');
  try {
    languageFilter.val(localStorage.getItem('crotv_language', language));
    countryFilter.val(localStorage.getItem('crotv_country', country));
    categoryFilter.val(localStorage.getItem('crotv_category', category));
  } catch (e) { console.log(e); };

  if (languageFilter.val() == '' && countryFilter.val() == '' && categoryFilter.val() == '') {
    languageFilter.val('(fra) French');
  };

  var channelsList = [];
  var currentChannel = undefined;
  var currentSource = undefined;

  if (Hls.isSupported()) {
    var hls = new Hls();
  } else if (!videovideoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
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
      localStorage.setItem('crotv_category', categoryFilter.val());
    } catch (e) { console.log(e); };

    var language = languageFilter.val().split(' ')[0].replace(/\(|\)/g, '');
    var country = countryFilter.val().split(' ')[0].replace(/\(|\)/g, '');
    var category = categoryFilter.val();

    if (language != '') {
      filteredList = filteredList.filter(i => i.languages.find(l => l.code == language));
    };
    if (country != '') {
      filteredList = filteredList.filter(i => i.countries.find(c => c.code == country));
    };
    if (category != '') {
      filteredList = filteredList.filter(i => i.category == category);
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
      $('#pop').show();

      $('.active').removeClass('active');
      $(currentChannel).addClass('active');
    });
  };

  // Load/stop stream
  function loadHlsStream(stream) {
    if (Hls.isSupported()) {
      hls.loadSource(stream);
      hls.attachMedia(videoPlayer);
    }
    else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
      videoPlayer.src = stream;
    };
  };
  function unloadHlsStream() {
    if (Hls.isSupported()) {
      hls.detachMedia();
    }
    else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
      videoPlayer.src = '';
    };
  };




  // Filter
  $('input#language, input#country, input#category').on('change paste keyup blur', function() {
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
    unloadHlsStream();
    loadHlsStream(currentSource);
  });

  $('#bigview').click( function() {
    var modal = $(this).parents('#pop');
    $(pop).removeClass('picture');
  });

  $('#close').click( function() {
    var modal = $(this).parents('#pop');
    if ($(pop).hasClass('picture')) {
      unloadHlsStream();
      $('.active').removeClass('active');
      $(pop).removeClass('picture').hide();
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