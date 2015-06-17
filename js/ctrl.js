/**
 * Main controller for the index page.
 */

var spreadsheetUrl = "data/mks.csv";

/**
 *
 * @type array of MK objects (defined from CSV headers).
 */
var mks;

var pass = function(mk) {
	return true;
};

var supportFilter = pass;
var partyFilter = pass;
var counts = {};
var partyList = [];

function startPage() {
  supportFilter = function(mk) {
    return mk.status === "u";
  };
	loadMKs();
}

function showMailModal( mkId ) {
  var mk;
  for ( var i=0; i<mks.length; i++ ) {
    if ( mks[i].id===mkId ) {
      mk = mks[i];
      break;
    }
  }

  $.get( "content/email-" +mk.status + "-" + mk.gender + ".txt")
    .done( function(data) {
      $("#emailModalMkName").text(mk.name);
      $("#emailModalMkNameSmall").text(mk.name);
      $("#emailModalEmail").html("<a href='mailto:" + mk.email + "'>" + mk.email + "</a>");
      $("#emailModalMkGender").text(mk.gender==="f" ? "חברת" : "חבר");
      $("#emailModalContent").html(data);
      $('#emailModal').modal('show')
    });
}

function loadMKs() {
	d3.csv(spreadsheetUrl,
		function(d) {
			return {
				id: d.alias,
				name: d.name,
				party: parties[d.party],
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
			updateMkDisplay();
		});
}

function updateMkDisplay() {
	var filtered = [];
	for (var i = 0; i < mks.length; i++) {
		var mk = mks[i];
		if (supportFilter(mk) && partyFilter(mk)) {
			filtered.push(mk);
		}
	}
	var mksUpdate = d3.select("#mks")
		.selectAll("li")
		.data(filtered, function(mk) {
			return mk.id;
		});
	var mksEnter = mksUpdate.enter()
		.append("li")
		.attr("class", function(mk) {
			return "status-" + mk.status;
		})
		.html(buildMkContent);

	var mksExit = mksUpdate.exit()
		.transition()
		.duration(1000)
		.style("width", "0px")
		.style("opacity", "0")
    .remove();

  counts.y=0;
  counts.n=0;
  counts.u=0;
  for ( var i=0; i<mks.length; i++ ) {
    var mk = mks[i];
    if ( partyFilter(mk) ) {
      counts[mk.status] = counts[mk.status]+1;
    }
  }

  $("#noCount").text(counts.n);
  $("#yesCount").text(counts.y);
  $("#undecidedCount").text(counts.u);

  if ( filtered.length === 0 ) {
    $("#noMksFound").slideDown();
  } else  {
    $("#noMksFound").slideUp();
  }
}

function buildMkContent(mk) {
  return "<img class='mk-image' src='img/mks-small/" + mk.alias + ".jpg' alt=''" + mk.name + "'/>\n" +
          "<div class='mk-name'>" + mk.name + "</div>" +
          "<div class='mk-party'>" + mk.party.name + "</div>" +
          "<div class='mk-contact'>" + buildContacts(mk) + "</div>";
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

function filterByParty(which) {
	if (which === "all") {
		partyFilter = pass;
	} else {
		partyFilter = function(mk) {
			return mk.party.alias === which;
		};
	}
	updateMkDisplay();

}
