$(function() {
  // Instantiating variables
  var pageTitle = null;
  var pendingPageTitle = null;
  var queryData = null;
  var idString = null;
  var rawText = null;
  var count = 0;

  // Reset previously instantiated variables
  var resetVariables = function() {
    pageTitle = null;
    queryData = null;
    idString = null;
    rawText = null;
  }

  // Replace search box spaces with '%20' and return the search box's value
  var setPageTitle = function() {
    if (pendingPageTitle == null) {
      pageTitle = $('#wiki-page-title').val();
    } else {
      pageTitle = pendingPageTitle;
      pendingPageTitle = null;
    }
    $('<p>').text('Following ' + pageTitle + '...').appendTo('#results');
    pageTitle = pageTitle.replace(/ /g, '%20');
    pageTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);
  }

  // // Remove block
  // var blockRemove = function(string, start, nested, finish) {
  //   debugger;
  //   var startIndex = string.indexOf(start);
  //   var finishIndex = string.indexOf(finish);
  //   var blockRemoval = string.substring(startIndex + start.length, finishIndex);
  //   string = string.substring(finishIndex + finish.length, string.length);
  //   var nestedCount = 0;
  //   while (blockRemoval.indexOf(nested) != -1) {
  //     nestedCount++;
  //     blockRemoval = blockRemoval.substring(blockRemoval.indexOf(nested) + nested.length, blockRemoval.length);
  //   }
  //   for (i = 0; i < nestedCount; i++) {
  //     chopIndex = string.indexOf(finish) + finish.length;
  //     string = string.substring(chopIndex, string.length);
  //   }
  //   return string;
  // }

  // Recursively find the first clickable link in the page text, logging the results
  var gameFollow = function(page) {
    var deleteUpTo = null;
    var linkStart = null;
    // Remove all new line characters...
    page = page.replace(/(\r\n|\n|\r)/gm,"");
    // while (page.substring(0, 2) == '{{') {
    //   page = blockRemove(page, '{{', '{{', '}}');
    // }
    // while (page.substring(0, 7) == '[[File:') {
    //   page = blockRemove(page, '[[File:', '[[', ']]');
    // }
    // while (page.substring(0, 8) == '[[Image:') {
    //   page = blockRemove(page, '[[File:', '[[', ']]');
    // }

    // // Remove the header...
    // while (page.substring(0, 2) == '{{') {
    //   deleteUpTo = page.indexOf('}}') + 2;
    //   page = page.substring(deleteUpTo, page.length);
    //   while (page.substring(0, 2) == '}}') {
    //     page = page.substring(2, page.length);
    //   }
    // }
    // // Remove any '[[File:' entries from the start
    // if (page.substring(0, 7) == '[[File:') {
    //   var breakPoint = page.indexOf(']]') + 2;
    //   page = page.substring(breakPoint, page.length);
    // }
    // // Remove any '[[Image:' entries from the start
    // if (page.substring(0, 8) == '[[Image:') {
    //   var breakPoint = page.indexOf(']]') + 2;
    //   page = page.substring(breakPoint, page.length);
    // }

    // Remove the excess...
    pageIndex = page.indexOf("'''") + 3;
    page = page.substring(pageIndex, page.length);

    // Find the candidate...
    var startBracket = page.indexOf('[[') + 2;
    var endBracket = page.indexOf(']]');
    var candidate = page.substring(startBracket, endBracket);
    var hashBreak = candidate.indexOf('#');
    if (hashBreak != -1) {
      candidate = candidate.substring((hashBreak + 1), candidate.length);
    }
    var pipeBreak = candidate.indexOf('|');
    if (pipeBreak != -1) {
      candidate = candidate.substring(0, pipeBreak);
    }
    count++;
    pendingPageTitle = candidate;
    if (count > 30) {
      $('<p>').text("Couldn't make it.").appendTo('#results');
    } else {
      setTimeout(performWikiAJAX, 1000);  
    }
  }

  // Perform a new AJAX request to WIkipedia
  var performWikiAJAX = function() {
    setPageTitle();
    if (pageTitle == "Philosophy") {
      $('<p>').text('Made it! Philosophy!').appendTo('#results');
      return;
    }
    queryData = 'action=query&titles=' + pageTitle + '&prop=revisions&rvprop=content&format=json&callback=?';
    $.ajax({
      url: 'https://en.wikipedia.org/w/api.php',
      jsonp: "callback",
      data: queryData,
      dataType: 'json',
      type: 'get',
      success: function(response) {
        idString = Object.getOwnPropertyNames(response.query.pages)[0]
        if (idString == -1) {
          $('<p>').text('Page not found on Wikipedia.').appendTo('#results');
          resetVariables();
        } else {
          rawText = response["query"]["pages"][idString]["revisions"]["0"]["*"]
          if (rawText.substring(0, 9) == "#REDIRECT") {
            // Redirect to other page. New AJAX request required.
            var startBracket = rawText.indexOf('[[') + 2;
            var endBracket = rawText.indexOf(']]');
            pendingPageTitle = rawText.substring(startBracket, endBracket);
            $('<p>').text('Redirect detected. Redirecting to ' + pendingPageTitle + '...').appendTo('#results');
            resetVariables();
            setTimeout(performWikiAJAX, 1000);
          } else {
            gameFollow(rawText);
          }
        }
      }
    });
  }

  // Play button click handler
  $('#play').on('click', function() {
    $('#results').empty();
    performWikiAJAX();
  });

  

});
// $("<p>").text(rawText).appendTo("body");

        // On a redirect (wrong name or whatever) it will still all work, but the rawText will only be a redirect prompt. Looks like this: "#REDIRECT [[Fruit preserves]]" for 'jam'

        // for a bad response (no page found), idString will be "-1"