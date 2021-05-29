$(document).ready(function() {
  const videoPlayer = document.getElementById('player');
  const channelsContainer = $('ul#list');
  const languageFilter = $('input#language');
  const countryFilter = $('input#country');
  const categoryFilter = $('input#category');
  const searchQuery = $('input#query');
  const languagesData = $('datalist#languages');
  const countriesData = $('datalist#countries');
  const categoriesData = $('datalist#categories');

  try {
    languageFilter.val(localStorage.getItem('crotv_language', language));
    countryFilter.val(localStorage.getItem('crotv_country', country));
    categoryFilter.val(localStorage.getItem('crotv_category', category));
  } catch (e) { console.log(e); };

  var currentLanguage = languageFilter.val();
  var currentCountry = countryFilter.val();
  var currentCategory = categoryFilter.val();

  var channelsList = [];
  var languagesList = [];
  var countriesList = [];
  var categoriesList = [];
  var currentChannel = undefined;
  var currentSource = undefined;

  if (Hls.isSupported()) {
    var hls = new Hls();
  } else if (!videovideoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    alert('Sorry, but Live Streaming feature is not supported on this browser.');
    $('.card').css({'pointer-events':'none'});
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
    let filteredList = list;
    let language = languageFilter.val(); //.split(' ')[0].replace(/\(|\)/g, '');
    let country = countryFilter.val(); //.split(' ')[0].replace(/\(|\)/g, '');
    let category = categoryFilter.val(); //.toLowerCase();

    if (language != '' && languagesList.indexOf(language) > -1) {
      filteredList = filteredList.filter(i => i.languages.find(l => l.code == language));
    };
    if (country != '' && countriesList.indexOf(country) > -1) {
      filteredList = filteredList.filter(i => i.countries.find(c => c.code == country));
    };
    if (category != '' && categoriesList.indexOf(category) > -1) {
      filteredList = filteredList.filter(i => i.category == category);
    };

    renderFilters(filteredList);
    renderList(filteredList);
    $(searchQuery).attr('placeholder', `Search among ${(filteredList).length} channels…`);
  }

  // Render Filters
  function renderFilters(list) {
    languagesList = []; countriesList = []; categoriesList = [];
    $(languagesData).html(''); $(countriesData).html(''); $(categoriesData).html('');

    $.each(list, function(i, item) {
      if (item.languages && item.languages.length > 0 && languagesList.indexOf(item.languages[0].code) === -1) { languagesList.push(item.languages[0].code) };
      if (item.countries && item.countries.length > 0 && countriesList.indexOf(item.countries[0].code) === -1) { countriesList.push(item.countries[0].code) };
      if (item.category && item.category != null && categoriesList.indexOf(item.category) === -1) { categoriesList.push(item.category) };
    });

    $.each(languagesList, function(i, item) {
      $(languagesData).append('<option value="' + item + '"></option>');
    });
    $.each(countriesList, function(i, item) {
      $(countriesData).append('<option value="' + item + '"></option>');
    });
    $.each(categoriesList, function(i, item) {
      $(categoriesData).append('<option value="' + item + '"></option>');
    });
  };

  // Render list
  function renderList(list) {
    $(channelsContainer).html('');

    $.each(list, function(i, item) {
      if (item.url !== undefined) {
        //if (item.logo === null) { item.logo = './assets/default.png' }
        $(channelsContainer).append([
          '<li class="card" data-id="' + item.tvg.id + '" data-name="' + item.name + '" data-source="' + item.url + '" title="' + item.name + '">',
            //'<div class="logo desktop"><img src="' + item.logo + '" alt="' + item.name + '"></div>',
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
  $(languageFilter).on('change paste keyup blur', function() {
    if ($(this).val() != currentLanguage && (languagesList.indexOf($(this).val()) > -1 || $(this).val() == '')) {
      try { localStorage.setItem('crotv_language', languageFilter.val()); } catch (e) { console.log(e); };
      currentLanguage = languageFilter.val();
      filterList(channelsList);
    };
  });
  $(countryFilter).on('change paste keyup blur', function() {
    if ($(this).val() != currentCountry && (countriesList.indexOf($(this).val()) > -1 || $(this).val() == '')) {
      try { localStorage.setItem('crotv_country', countryFilter.val()); } catch (e) { console.log(e); };
      currentCountry = countryFilter.val();
      filterList(channelsList);
    };
  });
  $(categoryFilter).on('change paste keyup blur', function() {
    if ($(this).val() != currentCategory && (categoriesList.indexOf($(this).val()) > -1 || $(this).val() == '')) {
      try { localStorage.setItem('crotv_category', categoryFilter.val()); } catch (e) { console.log(e); };
      currentCategory = categoryFilter.val();
      filterList(channelsList);
    };
  });
  // Search
  $(searchQuery).on('change paste keyup blur', function() {
    let cards = $('#list .card');
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
    };
  });
});