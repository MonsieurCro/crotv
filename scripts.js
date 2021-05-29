$(document).ready(function() {
  const videoPlayer = document.getElementById('player');
  const popModal = $('#pop');
  const favoritesContainer = $('ul#favorites');
  const channelsContainer = $('ul#channels');
  const languageFilter = $('input#language');
  const countryFilter = $('input#country');
  const categoryFilter = $('input#category');
  const searchQuery = $('input#query');
  const languagesData = $('datalist#languages');
  const countriesData = $('datalist#countries');
  const categoriesData = $('datalist#categories');

  var channelsList = [];
  var languagesList = [];
  var countriesList = [];
  var categoriesList = [];
  var favoritesList = [];

  try {
    languageFilter.val(localStorage.getItem('crotv_language', language));
    countryFilter.val(localStorage.getItem('crotv_country', country));
    categoryFilter.val(localStorage.getItem('crotv_category', category));
    if (localStorage.getItem('crotv_favorites', favorites)) { favoritesList = JSON.parse(localStorage.getItem('crotv_favorites', favorites)) };
  } catch (e) { console.log(e); };

  var currentLanguage = languageFilter.val();
  var currentCountry = countryFilter.val();
  var currentCategory = categoryFilter.val();
  var currentChannel = undefined;
  var currentSource = undefined;

  if (Hls.isSupported()) {
    var hls = new Hls();
  } else if (!videovideoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    alert('Sorry, but Live Streaming feature is not supported on this browser.');
    $('#channels .card').css({'pointer-events':'none'});
  };
  //if ('wakeLock' in navigator) {
    var wakeLock = null;
    const requestWakeLock = async () => {
      try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { console.log(e); };
    };
 // };

  fetchList('https://iptv-org.github.io/iptv/channels.json');



  // Fetch list
  function fetchList(source) {
    fetch(source)
    .then(response => response.text())
    .then((data) => {
      //console.log('Success:', data);
      channelsList = JSON.parse(data);
      renderFavorites(channelsList);
      filterList(channelsList);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };

  // Filter list
  function filterList(list) {
    let filteredList = list;

    if (currentLanguage != '') { filteredList = filteredList.filter(i => i.languages.find(l => l.code == currentLanguage)); };
    if (currentCountry != '') { filteredList = filteredList.filter(i => i.countries.find(c => c.code == currentCountry)); };
    if (currentCategory != '') { filteredList = filteredList.filter(i => i.category == currentCategory); };

    renderList(filteredList);
    renderFilters(filteredList);
    $(searchQuery).attr('placeholder', `Search among ${(filteredList).length} channels…`);
  };

  // Render list
  function renderList(list) {
    $(channelsContainer).html('');
    $.each(list, function(i, item) {
      renderCard(item, channelsContainer);
    });
  };

  // Render card
  function renderCard(card, container) {
    if (card && card.url !== undefined) {
      $(container).append([
        '<li class="card" data-id="' + (card.tvg.id || 'no_id') + '" data-name="' + (card.tvg.name || 'no_name') + '" data-source="' + card.url + '" title="' + (card.tvg.name || 'no_name') + '">',
          '<span class="favorite"></span>',
          //'<div class="logo desktop"><img src="' + card.logo + '" alt="' + (card.name || './assets/default.png') + '"></div>',
          '<p class="name">' + (card.tvg.name || 'no_name') + '</p>',
        '</li>'
      ].join(''));
    };
  };

  // Render Filters
  function renderFilters(list) {
    languagesList = []; countriesList = []; categoriesList = [];
    $(languagesData).html(''); $(countriesData).html(''); $(categoriesData).html('');

    $.each(list, function(i, item) {
      if (item.languages && item.languages.length > 0 && languagesList.indexOf(item.languages[0].code) === -1) { languagesList.push(item.languages[0].code) };
      if (item.countries && item.countries.length > 0 && countriesList.indexOf(item.countries[0].code) === -1) { countriesList.push(item.countries[0].code) };
      if (item.category && item.category != null && categoriesList.indexOf(item.category) === -1) { categoriesList.push(item.category) };
    });

    $.each(languagesList, function(i, item) { $(languagesData).append('<option value="' + item + '"></option>'); });
    $.each(countriesList, function(i, item) { $(countriesData).append('<option value="' + item + '"></option>'); });
    $.each(categoriesList, function(i, item) { $(categoriesData).append('<option value="' + item + '"></option>'); });
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
      } catch (e) { console.log(e); };
    };
  };



  // Add/remove favorite
  function setFavorite(channel) {
    console.log(favoritesList)
    if (favoritesList.indexOf(channel) > -1) {
      favoritesList = favoritesList.filter( function(item) { return item != channel; });
    } else {
      favoritesList.push(channel);
    };
    renderFavorites(channelsList);
    try { localStorage.setItem('crotv_favorites', JSON.stringify(favoritesList)); } catch (e) { console.log(e); };
  };
  // Render favorites
  function renderFavorites(list) {
    $(favoritesContainer).html('');
    $.each(favoritesList, function(i, item) {
      let card = list.filter(l => l.tvg.id == item)[0];
      renderCard(card, favoritesContainer);
    });
  };



  // Filter
  $(languageFilter).on('change paste keyup blur', function() {
    if ($(this).val() != currentLanguage && (languagesList.indexOf($(this).val()) > -1 || $(this).val() == '')) {
      currentLanguage = languageFilter.val();
      try { localStorage.setItem('crotv_language', currentLanguage); } catch (e) { console.log(e); };
      filterList(channelsList);
    };
  });

  $(countryFilter).on('change paste keyup blur', function() {
    if ($(this).val() != currentCountry && (countriesList.indexOf($(this).val()) > -1 || $(this).val() == '')) {
      currentCountry = countryFilter.val();
      try { localStorage.setItem('crotv_country', currentCountry); } catch (e) { console.log(e); };
      filterList(channelsList);
    };
  });

  $(categoryFilter).on('change paste keyup blur', function() {
    if ($(this).val() != currentCategory && (categoriesList.indexOf($(this).val()) > -1 || $(this).val() == '')) {
      currentCategory = categoryFilter.val();
      try { localStorage.setItem('crotv_category', currentCategory); } catch (e) { console.log(e); };
      filterList(channelsList);
    };
  });

  // Search
  $(searchQuery).on('change paste keyup blur', function() {
    let cards = $(channelsContainer).children('.card');
    let search = $(this).val().toLowerCase();

    $.each(cards, function(i, item) {
      if ($(this).children('.name').text().toLowerCase().indexOf(search) > -1) {
        $(this).css({'display':''});
      } else {
        $(this).css({'display':'none'});
      };
    });
  });



  // Listen clicks ([data-id="' + card.tvg.id + '"])
  $(document).on('click', '.card', function() {
    currentChannel = $(this);
    currentSource = $(currentChannel).data('source');

    $('.modal .header').html($(currentChannel).data('name'));
    $('.modal .header').data('id', $(currentChannel).data('id'));
    loadHlsStream(currentSource);
    $(popModal).show();

    $('.active').removeClass('active');
    $(currentChannel).addClass('active');
  });

  $(document).on('click', '.card > .favorite', function(e) {
    e.stopPropagation();
    let channelId = $(this).parents('.card').data('id');
    setFavorite(channelId);
  });



  // Buttons
  $('#favorite').click( function() {
    let channelId = $('.modal .header').data('id');
    setFavorite(channelId);
  });

  $('#reload').click( function() {
    unloadHlsStream();
    loadHlsStream(currentSource);
  });

  $('#bigview').click( function() {
    $(popModal).removeClass('picture');
  });

  $('#close').click( function() {
    if ($(popModal).hasClass('picture')) {
      unloadHlsStream();
      $('.active').removeClass('active');
      $(popModal).removeClass('picture').hide();
    } else {
      $(popModal).addClass('picture');
    };
  });
});