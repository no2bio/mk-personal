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
var filterBySupportValue = null;
var blockMkUpdates = false;
var expandSupport = { u: "Undecided", y:"Yes", n:"No" };
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
      blockMkUpdates = true;
      var partyParam = getParameterByName("party");
      if ( partyParam ) {
        if ( partyParam[0] === '_' ) // legacy kludge
          partyParam = 'c_all';
        if ( partyParam.indexOf("c_") == 0 ) {
          filterByGroup(partyParam);
          $("#groupSelect").val(partyParam);
        } else {
          filterByGroup( "p_" + partyParam);
          $("#groupSelect").val("p_" + partyParam);
        }
      } else {
        var groupParam = getParameterByName("group");
        if ( groupParam ) {
          filterByGroup( groupParam );
          $("#groupSelect").val(groupParam);
        }
        var supportParam = getParameterByName("support");
        if ( supportParam ) {
          filterBySupport( supportParam );
          var selectButton = expandSupport[supportParam];
          var labelId = "#btn" + selectButton + "Label";
          $(labelId).button("toggle");
          $( labelId +"Xs").button("toggle");
        }
      }
      blockMkUpdates = false;
      updateMkDisplay();
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
  if ( blockMkUpdates ) return;
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
  var paramSection = "";
  var groupFilterValue = $("#groupSelect").val();
  if ( groupFilterValue !== "p_all" ) {
    paramSection = "group=" + groupFilterValue;
  } 
  if ( filterBySupportValue ) {
    paramSection = paramSection + ((paramSection.length>0 ? "&" : "" )) + "support=" + filterBySupportValue;
  }
  $("#filter-permalink").attr("href",
    window.location.href.split("?")[0].split('#')[0] +
    (paramSection.length>0 ? ("?" + paramSection) : "") + "#mk-status");
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

function filterBySupport(what) {
  filterBySupportValue = what;
  if (what === null) {
    supportFilter = pass;
  } else {
    supportFilter = function(mk) {
      return mk.status === what;
    };
  }
}

function filterByGroup(which) {
  var comps = which.split("_");
  if ( comps[0]=="c" ) {
    filterByCommitee( comps[1] );
  } else {
    filterByParty( comps[1] );
  }
}

function filterByCommitee( committeeId ) {
  if (committeeId == "all" ) {
    groupFilter = function(mk) {
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
