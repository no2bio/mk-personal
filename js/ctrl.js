/**
 * Main controller for the index page.
 */

var spreadsheetUrl = "data/mks.csv";

/**
 * @type array of MK objects (defined from CSV headers).
 */
var mks;

var pass = function(mk) {
  return true;
};

var supportFilter = pass;
var groupFilter = pass;
var counts = {};
var partyList = [];

function startPage() {
  loadMKs();
}

function parseCommittees( cmtString ) {
  var retVal = [];
  if ( cmtString ) {
    var comps = cmtString.split(" ");
    for ( var i=0; i<comps.length; i++ ) {
      if ( comps[i].length > 0 ) {
        retVal.push( comps[i] );
      }
    }
  }
  return retVal;
}

function loadMKs() {
  d3.csv(spreadsheetUrl,
    function(d) {
      return {
        id: d.alias,
        name: d.name,
        party: parties[d.party],
        committees: parseCommittees(d.committees),
        alias: d.alias,
        gender: d.gender,
        status: ((d.status === "yes") ? "y" : ((d.status === "no") ? "n" : "u")),
        facebookPage: d.facebook,
        facebookNick: d.fbmention,
        twitterHandle: d.twitter,
        email: d.email,
        site: d.web
      };
    },
    function(error, rows) {
      mks = rows;
      buildMkCards();
      var partyParam = getParameterByName("party");
      if ( partyParam ) {
        $("#groupSelect").val("p_" + partyParam);
        filterByGroup( "p_" + partyParam);
      } else {
        updateMkDisplay();
      }
    });
}

/**
 * Create the cards for all the MKs.
 * Later, updateMkDisplay will hide/show as needed.
 */
function buildMkCards() {
  d3.select("#mks").
    selectAll("li").
    data(mks, function(mk) {
      return mk.id;
    }).
    enter().
    append("li").
    attr("class", function(mk) {
      return "status-" + mk.status;
    }).
    html(buildMkContent);
}

function updateMkDisplay() {
  // MK card animation
  var mksUpdate = d3.select("#mks")
    .selectAll("li")
    .data(mks, function(mk) {
      return mk.id;
    }).
    transition().
    duration(1000).
    style("width", function(mk) {
      return (groupFilter(mk) && supportFilter(mk)) ? "110px" : "0px";
    }).
    style("margin-left", function(mk) {
      return (groupFilter(mk) && supportFilter(mk)) ? "14px" : "0px";
    }).
    style("margin-right", function(mk) {
      return (groupFilter(mk) && supportFilter(mk)) ? "14px" : "0px";
    });

  // updating counts.
  var filtered = [];
  for (var i = 0; i < mks.length; i++) {
    var mk = mks[i];
    if (supportFilter(mk) && groupFilter(mk)) {
      filtered.push(mk);
    }
  }
  counts.y=0;
  counts.n=0;
  counts.u=0;
  for ( var i=0; i<mks.length; i++ ) {
    var mk = mks[i];
    if ( groupFilter(mk) ) {
      counts[mk.status] = counts[mk.status]+1;
    }
  }

  $("#allCount").text(counts.y + counts.n + counts.u);
  $("#allCountXs").text(counts.y + counts.n + counts.u);
  $("#yesCount").text(counts.y);
  $("#yesCountXs").text(counts.y);
  $("#noCount").text(counts.n);
  $("#noCountXs").text(counts.n);
  $("#undecidedCount").text(counts.u);
  $("#undecidedCountXs").text(counts.u);

  if ( filtered.length === 0 ) {
    $("#noMksFound").slideDown();
  } else  {
    $("#noMksFound").slideUp();
  }

  // updating filterlink
  var groupFilterValue = $("groupSelect").val();
  var supportFilterValue = "all";
  $("#filter-permalink").attr("href", window.location + "?" + groupFilterValue + "&" + supportFilterValue + "#mk-status");
}

function buildMkContent(mk) {
  return "<a class='mk-card' id='" + mk.alias + "' name='" + mk.alias + "' href='mks/" + mk.alias + ".html'>" + 
          "<img class='mk-image' src='img/mks-small/" + mk.alias + ".jpg' alt=''" + mk.name + "'/>\n" +
          "<div class='mk-mask'>&nbsp;</div>" +
          "<div class='mk-name'>" + mk.name + "</div>" +
          "<div class='mk-party'>" + mk.party.name + "</div>" +
          "<div class='act-tag'>" +
            (mk.status==="y"? "לתמוך": mk.status==="n"? "למחות": "ללחוץ") +
          "</div>" +
          "</a>";
}

function buildContacts( mk ) {
  var retVal = "";
  if ( mk.facebookPage && mk.facebookPage !== "" ) {
    retVal = retVal + "<a href='" + mk.facebookPage + "' target='_blank'>" +
                  "<i class='fa fa-facebook'></i></a>"
  }
  if ( mk.twitterHandle && mk.twitterHandle !== "" ) {
    retVal = retVal +
      "<a href='https://twitter.com/intent/tweet?url=http%3A%2F%2Fexperiment-end.no2bio.org&via=no2bio&text=" +
      tweets[mk.gender][mk.status] + "' target='_blank'>" +
      "<i class='fa fa-twitter'></i></a>"
  }
  if ( mk.email && mk.email !== "" ) {
    retVal = retVal + "<a href=\"javascript:showMailModal('" + mk.id + "')\">" +
                  "<i class='fa fa-envelope-o'></i></a>";
  }
  return retVal;
}

function filterBySupport(what) {
  if (what === null) {
    supportFilter = pass;
  } else {
    supportFilter = function(mk) {
      return mk.status === what;
    };
  }
  updateMkDisplay();
}

function filterByGroup(which) {
  var comps = which.split("_");
  if ( comps[0]=="c" ) {
    filterByCommitee( comps[1] );
  } else {
    filterByParty( comps[1] );
  }
  updateMkDisplay();
}

function filterByCommitee( committeeId ) {
  console.log( "filtering by commitee " + committeeId );
  if (committeeId == "all" ) {
    groupFilter = function(mk) {
      console.log( mk.id + ": " + mk.commitees );
      return (mk.committees.length > 0);
    };
  } else {
    groupFilter = function(mk) {
      for ( var i=0; i<mk.committees.length; i++ ) {
        if ( committeeId === mk.committees[i] ) {
          return true;
        }
      }
      return false;
    };
  }
}

function filterByParty( partyId ) {
  groupFilter = (partyId==="all") ? pass : function(mk) { return mk.party.alias === partyId; };
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(window.location.href);
    return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, " "));
}
