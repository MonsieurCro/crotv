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
    favoritesList = JSON.parse(localStorage.getItem('crotv_favorites', favorites));
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
  }
  // Filter list
  function filterList(list) {
    let filteredList = list;

    if (currentLanguage != '') { filteredList = filteredList.filter(i => i.languages.find(l => l.code == currentLanguage)); };
    if (currentCountry != '') { filteredList = filteredList.filter(i => i.countries.find(c => c.code == currentCountry)); };
    if (currentCategory != '') { filteredList = filteredList.filter(i => i.category == currentCategory); };

    renderList(filteredList);
    renderFilters(filteredList);
    $(searchQuery).attr('placeholder', `Search among ${(filteredList).length} channels…`);
  }
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
      //if (card.logo === null) { card.logo = './assets/default.png' };
      $(container).append([
        '<li class="card" data-id="' + card.tvg.id + '" data-name="' + card.tvg.name + '" data-source="' + card.url + '" title="' + card.tvg.name + '">',
          '<svg class="favorite" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5C12.3788 2.5 12.725 2.714 12.8944 3.05279L15.4733 8.2106L21.1439 9.03541C21.5206 9.0902 21.8335 9.35402 21.9511 9.71599C22.0687 10.078 21.9706 10.4753 21.6981 10.741L17.571 14.7649L18.4994 20.4385C18.5607 20.8135 18.4043 21.1908 18.0956 21.4124C17.787 21.6339 17.3794 21.6614 17.0438 21.4834L12 18.8071L6.95621 21.4834C6.62059 21.6614 6.21303 21.6339 5.90437 21.4124C5.5957 21.1908 5.43927 20.8135 5.50062 20.4385L6.42903 14.7649L2.3019 10.741C2.02939 10.4753 1.93133 10.078 2.04894 9.71599C2.16655 9.35402 2.47943 9.0902 2.85606 9.03541L8.52667 8.2106L11.1056 3.05279C11.275 2.714 11.6212 2.5 12 2.5ZM12 5.73607L10.0819 9.57221C9.93558 9.86491 9.65528 10.0675 9.33144 10.1146L5.14839 10.723L8.1981 13.6965C8.43179 13.9243 8.53958 14.2519 8.48687 14.574L7.80001 18.7715L11.5313 16.7917C11.8244 16.6361 12.1756 16.6361 12.4687 16.7917L16.2 18.7715L15.5131 14.574C15.4604 14.2519 15.5682 13.9243 15.8019 13.6965L18.8516 10.723L14.6686 10.1146C14.3447 10.0675 14.0644 9.86491 13.9181 9.57221L12 5.73607Z"></path></svg>',
          //'<div class="logo desktop"><img src="' + card.logo + '" alt="' + card.name + '"></div>',
          '<p class="name">' + card.tvg.name + '</p>',
        '</li>'
      ].join(''));

      $('.card[data-id="' + card.tvg.id + '"]').click( function() {
        currentChannel = $(this);
        currentSource = $(currentChannel).data('source');

        $('.modal .header').html($(currentChannel).data('name'));
        loadHlsStream(currentSource);
        $(popModal).show();

        $('.active').removeClass('active');
        $(currentChannel).addClass('active');
      });
      $('.card[data-id="' + card.tvg.id + '"] > .favorite').click( function(e) {
        e.stopPropagation();
        let channelId = $(this).parents('.card').data('id');
        setFavorite(channelId);
      });
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
  };
  function unloadHlsStream() {
    if (Hls.isSupported()) {
      hls.detachMedia();
    }
    else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
      videoPlayer.src = '';
    };
  };



  // Add/remove favorite
  function setFavorite(channel) {
    if (favoritesList.indexOf(channel) > -1) {
      favoritesList = favoritesList.filter( function(item) { return item != channel; });
    } else {
      favoritesList.push(channel);
    };
    try { localStorage.setItem('crotv_favorites', JSON.stringify(favoritesList)); } catch (e) { console.log(e); };
    renderFavorites(channelsList);
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



  // Buttons
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