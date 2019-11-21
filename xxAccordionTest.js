//Get unique Proposed RPZs, maybe update global variables for use in zooming later ---------------------------------------------------------------------------------
var query = new Query(); //https://developers.arcgis.com/javascript/3/jsapi/query-amd.html
var featureLayer = this.widgetManager.map.getLayer("Master_RPZ_Data_7046_6103");  //Use AGO Assistant
query.where = "App_Status = 'Under Review'"; //Proposed RPZs
query.outFields = ["Applicatio", "Petitioner", "App_Phase", "Time_Reg", "Day_Reg", "PPeriod"];
query.orderByFields = ["Applicatio"];
query.returnGeometry = false;
query.returnDistinctValues = true;  //Get unique combo of outFields
featureLayer.queryFeatures(query, lang.hitch(this, function (result) { //https://developers.arcgis.com/javascript/3/jsapi/featurelayer-amd.html#queryfeatures
	this._zoomToFirst(result.features[0].attributes.Applicatio);  //Zoom to first RPZ in the list (to match the open accordion value)
	for (i = 0; i < result.features.length; i++) { //Loop through all RPZs, build an individual section containers, and add to accordion
		var aContent1 = "<div><font face='Arial' size='2'><b>Petitioner:  &nbsp;</b>" + result.features[i].attributes.Petitioner;
		aContent1 += "<br><b>Phase:  &nbsp;</b>" + result.features[i].attributes.App_Phase;
		aContent1 += "<br><b>Time & Days:  &nbsp;</b>" + result.features[i].attributes.Time_Reg + " | " + result.features[i].attributes.Day_Reg;
		aContent1 += "<br><b>Petition Period:  &nbsp;</b>" + result.features[i].attributes.PPeriod;
		aContainerProposed.addChild(new ContentPane({
			title: "<b><span id='RPZ1'>Residential Parking Zone: " + result.features[i].attributes.Applicatio + "</b></span>",
			id: result.features[i].attributes.Applicatio, //Unique ID
			content: aContent1,
			selected: false
		}));

		if (i === result.features.length - 1) { //Done looping through all RPZs
			for (i = 0; i < result.features.length; i++) { //Unique ids have been added to spans by RPZ, make the link clickable by id
				var theVoteTotal = "VoteTotal" + i;
				var theVote = "Vote" + i;
				on(dojo.byId(theVoteTotal), 'click', lang.hitch(this, this._voteTotal)); //Add Vote Total click event
				on(dojo.byId(theVote), 'click', lang.hitch(this, this._voteNow)); //Add Vote click event
			}
		}
	}
})); //End lang.hitch

//MJM - 2019-9-16 Disable Current Poll & Vote links for now 
this.Accordion.appendChild(aContainerProposed.domNode); //Add to DOM by data-dojo-attach-point 'Accordion'
aContainerProposed.startup(); //Complete on page
aContainerProposed.on('click', lang.hitch(this, this._zoomToRPZ)); //Add click event to RPZ section - Need lang.hitch to keep scope of function within widget  - CHANGE THIS TO ONOPEN EVENT FOR EACH PANEL
//End unique Proposed RPZs-----------------------------------------------------------------------------------------------------------------------------------------
