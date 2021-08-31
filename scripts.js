$(document).ready(function() {
  const videoPlayer = document.getElementById('player');
  const favoritesContainer = $('#favorites');
  const channelsContainer = $('#channels');
  const searchQuery = $('#query');
  const languagesData = $('#languages');
  const countriesData = $('#countries');
  const categoriesData = $('#categories');

  var channelsList = [];
  var languagesList = [];
  var countriesList = [];
  var categoriesList = [];
  var favoritesList = [];

  var currentLanguages = ['eng','fra'];
  var currentCountries = [];
  var currentCategories = [];
  var currentChannel = undefined;
  var currentSource = undefined;

  try {
    if (localStorage.getItem('crotv_languages')) { currentLanguages = JSON.parse(localStorage.getItem('crotv_languages')) };
    if (localStorage.getItem('crotv_countries')) { currentCountries = JSON.parse(localStorage.getItem('crotv_countries')) };
    if (localStorage.getItem('crotv_categories')) { currentCategories = JSON.parse(localStorage.getItem('crotv_categories')) };
    if (localStorage.getItem('crotv_favorites')) { favoritesList = JSON.parse(localStorage.getItem('crotv_favorites')) };
  } catch (e) { console.log(e); };

  if (Hls.isSupported()) {
    var hls = new Hls();
  } else if (!videovideoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    $(body).html('Sorry, but Live Streaming feature is not supported on this browser.');
  };

  var wakeLock = null;
  const requestWakeLock = async () => {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { console.log(e); };
  };

  fetchList('https://iptv-org.github.io/iptv/channels.json');

  // Fetch list
  function fetchList(source) {
    fetch(source)
    .then(response => response.text())
    .then((data) => {
      //console.log('Fetched!', data);
      channelsList = JSON.parse(data);
      renderFilters(channelsList);
      renderFavorites(channelsList);
      filterList(channelsList);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };
  // Filter list
  function filterList(list) {
    let filteredList = [];

    if (currentLanguages.length > 0 || currentCountries.length > 0 || currentCategories.length > 0) {
      if (currentLanguages.length > 0) {
        $.each(currentLanguages, function(i, item) {
          let tempList1 = list.filter(i => i.languages.find(l => l.code == item));
          $.each(tempList1, function(i, item) {
            if (filteredList.indexOf(item) === -1) { filteredList.push(item); };
          });
        });
      };
      if (currentCountries.length > 0) {
        $.each(currentCountries, function(i, item) {
          let tempList2 = list.filter(i => i.countries.find(c => c.code == currentCountries));
          $.each(tempList2, function(i, item) {
            if (filteredList.indexOf(item) === -1) { filteredList.push(item); };
          });
        });
      };
      if (currentCategories.length > 0) {
        $.each(currentCategories, function(i, item) {
          let tempList3 = list.filter(i => i.category == currentCategories);
          $.each(tempList3, function(i, item) {
            if (filteredList.indexOf(item) === -1) { filteredList.push(item); };
          });
        });
      };
    } else { filteredList = list; };

    renderList(filteredList);
    $(searchQuery).attr('placeholder', `Search among ${(filteredList).length} channels…`);
  };
  // Render filters
  function renderFilters(list) {
    languagesList = []; countriesList = []; categoriesList = [];
    $(languagesData, countriesData, categoriesData).html('');

    $.each(list, function(i, item) {
      if (item.languages && item.languages.length > 0 && languagesList.indexOf(item.languages[0].code.toLowerCase()) === -1) { languagesList.push(item.languages[0].code.toLowerCase()) };
      if (item.countries && item.countries.length > 0 && countriesList.indexOf(item.countries[0].code.toLowerCase()) === -1) { countriesList.push(item.countries[0].code.toLowerCase()) };
      if (item.category && item.category != null && categoriesList.indexOf(item.category.toLowerCase()) === -1) { categoriesList.push(item.category.toLowerCase()) };
    });

    languagesList.sort( function(a, b) { return (languages[a] < languages[b]) ? -1 : (languages[a] > languages[b]) ? 1 : 0; });
    countriesList.sort( function(a, b) { return (countries[a] < countries[b]) ? -1 : (countries[a] > countries[b]) ? 1 : 0; });
    categoriesList.sort( function(a, b) { return (categories[a] < categories[b]) ? -1 : (categories[a] > categories[b]) ? 1 : 0; });

    $.each(languagesList, function(i, item) { renderItem(item, languages, currentLanguages, languagesData); });
    $.each(countriesList, function(i, item) { renderItem(item, countries, currentCountries, countriesData); });
    $.each(categoriesList, function(i, item) { renderItem(item, categories, currentCategories, categoriesData); });
  };
  // Render item
  function renderItem(item, label, current, target) {
    let active = (current.indexOf(item) > -1) ? 'checked' : '';
    $(target).append('<div class="item" id="' + item + '"><input type="checkbox" name="' + item + '"' + active + '><label for="' + item + '">' + (label[item] || item) + '</label></div>');
  }
  // Render list
  function renderList(list) {
    $(channelsContainer).html('');
    $.each(list, function(i, item) { renderCard(item, channelsContainer); });
    $('.card').first().addClass('selected');
  };
  // Render card
  function renderCard(card, container) {
    if (card && card.url !== undefined) {
      $(container).append([
        '<li class="card" data-id="' + (card.tvg.id || 'no_id') + '" data-source="' + card.url + '" title="' + (card.tvg.name || 'no_name') + '">',
          //'<div class="logo"><img src="' + (card.logo || './assets/default.png') + '" alt="' + (card.tvg.name || 'no_name') + '"></div>',
          '<p class="name">' + (card.tvg.name || 'no_name') + '</p>',
        '</li>'
      ].join(''));
    };
  };
  // Render favorites
  function renderFavorites(list) {
    $(favoritesContainer).html('');
    $.each(favoritesList, function(i, item) {
      let card = list.filter(l => l.tvg.id == item)[0];
      renderCard(card, favoritesContainer);
    });
  };

  // Search
  $(searchQuery).on('change paste keyup blur', function() {
    let cards = $(channelsContainer).children('.card');
    let search = $(this).val().toLowerCase();

    $.each(cards, function(i, item) {
      try {
        if (JSON.stringify($(item).data('id')).toLowerCase().indexOf(search) > -1) {
          $(item).css({'display':''});
        } else {
          $(item).css({'display':'none'});
        };
      } catch (e) { console.log(e); };
    });
  });

  // Load/stop stream
  function loadHlsStream(stream) {
    // https://github.com/video-dev/hls.js/blob/master/docs/API.md#first-step-setup-and-support
    if (Hls.isSupported()) {
      try {
        hls.loadSource(stream);
        hls.attachMedia(videoPlayer);
        videoPlayer.play();
        videoPlayer.requestFullscreen();

        // Error handling
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            /*switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Fatal network error encountered, trying to recover…');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Fatal media error encountered, trying to recover…');
                hls.recoverMediaError();
                break;
              default:*/
                console.log('Sorry, we didn\'t manage to recover that stream.');
                hls.detachMedia();
                $('#stream').addClass('hidden');
                /*break;
            }*/
          }
        });
      } catch (e) { console.log(e); }
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
      videoPlayer.src = stream;
      videoPlayer.requestFullscreen();
    };
    if ('wakeLock' in navigator) {
      requestWakeLock();
    };
  };
  function unloadHlsStream() {
    if (Hls.isSupported()) {
      hls.detachMedia();
    }
    else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
      videoPlayer.src = '';
    };
    if ('wakeLock' in navigator) {
      try {
        wakeLock.release().then(() => { wakeLock = null; });
      } catch (e) { console.log(e); }
    };
  };

  // Update Filters
  $('#filters .header span').click( function() {
    let category = $(this).data('id');
    $('#filters .active').removeClass('active');
    $(this).addClass('active');
    $('#filters .category').addClass('hidden');
    $('#' + category).removeClass('hidden');
  });
  $(document).on('click', '#languages .item', function() {
    currentLanguages = updateFilters($(this), $(this).attr('id'), currentLanguages, languagesList, 'crotv_languages');
  });
  $(document).on('click', '#countries .item', function() {
    currentCountries = updateFilters($(this), $(this).attr('id'), currentCountries, countriesList, 'crotv_countries');
  });
  $(document).on('click', '#categories .item', function() {
    currentCategories = updateFilters($(this), $(this).attr('id'), currentCategories, categoriesList, 'crotv_categories');
  });
  function updateFilters(item, id, current, list, storage) {
    if (list.indexOf(id) > -1) {
      if (current.indexOf(id) > -1) {
        current = current.filter( function(i) { return i != id; });
        $(item).children('input[type="checkbox"]').prop('checked', false);
      } else {
        current.push(id);
        $(item).children('input[type="checkbox"]').prop('checked', true);
      };
      try { localStorage.setItem(storage, JSON.stringify(current)); } catch (e) { console.log(e); };
      filterList(channelsList);
    };
    return current;
  };

  // Toggle Modal
  $('#search').click( function() {
    $('#query').removeClass('hidden').select().focus();
    $('#query').blur(function() { if ($(this).val().length === 0) { $(this).addClass('hidden'); }} );
  });
  $('#settings').click( function() {
    $('#filters').removeClass('hidden');
  });
  $(document).on('click', '.list .card', function() {
    currentChannel = $(this);
    currentSource = $(currentChannel).data('source');

    loadHlsStream(currentSource);
    $('#stream').data('id', currentChannel.data('id')).removeClass('hidden');

    $('.selected').removeClass('selected');
    $(currentChannel).addClass('selected');
  });
  $('.modal .close').click( function() {
    $(this).parents('.shadow').addClass('hidden');
  });

  // Buttons
  $('#save').click( function() {
    let channelId = $('#stream').data('id');
    setFavorite(channelId);
  });
  $('#reload').click( function() {
    unloadHlsStream();
    loadHlsStream(currentSource);
  });
  $('#unload').click( function() {
    unloadHlsStream();
    $('#stream').addClass('hidden');
  });
  var fade = null;
  $('#player').on('mousemove', function() {
    $('#controls').removeClass('hidden');
    clearTimeout(fade);
    fade = window.setTimeout(function() {
      $('#controls').addClass('hidden');
    }, 5000);
  });

  // Updates favorites
  function setFavorite(channel) {
    if (favoritesList.indexOf(channel) > -1) {
      favoritesList = favoritesList.filter( function(item) { return item != channel; });
    } else {
      favoritesList.push(channel);
    };
    renderFavorites(channelsList);
    try { localStorage.setItem('crotv_favorites', JSON.stringify(favoritesList)); } catch (e) { console.log(e); };
  };

  // Keys navigation
  $(document).keydown( function(e) {
    let selected = $('.selected');
    let list = $(selected).parents('.list');

    switch (e.keyCode) {
      case 37: //left
        if ($(selected).prev('li').length > 0) {
          $(selected).prev('li').addClass('selected');
        } else {
          $(selected).siblings('li').last().addClass('selected');
        };
        $(selected).removeClass('selected');
        break;
      case 39: //right
        if ($(selected).next('li').length > 0) {
          $(selected).next('li').addClass('selected');
        } else {
          $(selected).siblings('li').first().addClass('selected');
        };
        $(selected).removeClass('selected');
        break;
      case 38: //up
      if ($(list).parents('.section').prev().find('.list').length > 0) {
        $(list).parents('.section').prev().find('.list').children('.card').first().addClass('selected');
      } else {
        $('.section').last().find('.list').children('.card').first().addClass('selected');
      };
      $(selected).removeClass('selected');
        break;
      case 40: //down
        if ($(list).parents('.section').next().find('.list').length > 0) {
          $(list).parents('.section').next().find('.list').children('.card').first().addClass('selected');
        } else {
          $('.section').first().find('.list').children('.card').first().addClass('selected');
        };
        $(selected).removeClass('selected');
        break;
      case 13: //enter
        if ($('#filters').hasClass('hidden')) {
          currentChannel = $('.selected');
          currentSource = $(currentChannel).data('source');
          loadHlsStream(currentSource);
          $('#stream').removeClass('hidden');
        };
        break;
        case 27: //esc
          unloadHlsStream();
          $('#stream').addClass('hidden');
          break;
      default:
        //console.log('Not an control key.');
    };
  });
});