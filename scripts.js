$(document).ready(function() {

  // Fetch list
  function fetchM3U8(source) {
    fetch(source)
    .then(response => response.text())
    .then((data) => {
      //console.log('Success:', data);
      renderList(M3UtoJSON(data));
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  // Convert M3U to clean JSON file
  function M3UtoJSON(M3U) {
    return M3U
    .replace('#EXTM3U', '') //remove extension line
    .split('#EXTINF') //split by channel
    .slice(1) //remove empty block
    .map( function(string, index) {
      var channelInfos = string.split(/["]/);
      var channelUrl = string.split('\n')[1];

      return {
        "id": channelInfos[1] || index + 1,
        "name": channelInfos[3] || undefined,
        "country": channelInfos[5] || undefined,
        "language": channelInfos[7] || undefined,
        "logo": channelInfos[9] || './assets/default.png',
        "category": channelInfos[11] || undefined,
        "source": channelUrl || undefined
      };
    });
  };

  // Render list
  function renderList(list) {
    $('#list').html('');
    $.each(list, function(i, item) {
      if (item.source !== undefined) {
        $('ul#list').append([
          '<li class="card" data-id="' + item.id + '" data-name="' + item.name + '" data-source="' + item.source + '" title="' + item.name + '">',
            '<div class="logo desktop"><img src="' + item.logo + '" alt="' + item.name + '"></div>',
            '<p class="name">' + item.name + '</p>',
          '</li>'
        ].join(''));
      };
    });

    $('.card').click( function() {
      var channel = $(this);
      currentStream = $(channel).data('source');
      $('.modal .header').html($(channel).data('name'));
      loadHlsStream(currentStream);

      $('.active').removeClass('active');
      $(channel).addClass('active');
    });
  };

  // Load/stop stream
  function loadHlsStream(stream) {
    var player = document.getElementById('player');
    if (Hls.isSupported()) {
      hls.loadSource(stream);
      hls.attachMedia(player);
    }
    else if (player.canPlayType('application/vnd.apple.mpegurl')) {
      player.src = stream;
    }
    else {
      console.log('No HLS support.');
    };

    $('#pop').show();
  };
  function stopHlsStream() {
    if (Hls.isSupported()) {
      hls.detachMedia();
    }
    else if (player.canPlayType('application/vnd.apple.mpegurl')) {
      player.src = '';
    };

    $('.active').removeClass('active');
    $(pop).removeClass('picture').hide();
  };




  // It's show time!
  var currentStream = undefined;
  if (Hls.isSupported()) {
    var hls = new Hls();
  };
  fetchM3U8('https://iptv-org.github.io/iptv/languages/fra.m3u');




  // Search
  $('#filter').keyup( function() {
    var cards = $('#list > li');
    var search = $(this).val().toLowerCase();

    $.each(cards, function(i, item) {
      if ($(this).children('.name').text().toLowerCase().indexOf(search) > -1) {
        $(this).css({'display':'inline-flex'});
      } else {
        $(this).css({'display':'none'});
      };
    });
  });

  // Buttons
  $('#reload').click( function() {
    loadHlsStream(currentStream);
  });

  $('#bigview').click( function() {
    var modal = $(this).parents('#pop');
    $(pop).addClass('picture');
  });

  $('#close').click( function() {
    var modal = $(this).parents('#pop');
    if ($(pop).hasClass('picture')) {
      stopHlsStream();
    } else {
      $(pop).addClass('picture');
    }
  });
});

//https://github.com/video-dev/hls.js/blob/master/docs/API.md