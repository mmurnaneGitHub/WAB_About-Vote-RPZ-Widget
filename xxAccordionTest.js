//ACTIVE RPZS Details
//Get unique Implemented RPZs, maybe update global variables for use in zooming later ---------------------------------------------------------------------------------
var query = new Query();
var featureLayer = this.widgetManager.map.getLayer("Master_RPZ_Data_7046");  //Use AGO Assistant
query.where = "App_Result='Approved'"; //Implemented RPZs
query.outFields = ["RPZ_Num", "Time_Reg", "Day_Reg"];
query.orderByFields = ["RPZ_Num"];
query.returnGeometry = false;
query.returnDistinctValues = true;  //Get unique combo of outFields
featureLayer.queryFeatures(query, lang.hitch(this, function (result) { //https://developers.arcgis.com/javascript/3/jsapi/featurelayer-amd.html#queryfeatures
	this._zoomToFirst(result.features[0].attributes.RPZ_Num);  //Zoom to first RPZ in the list (to match the open accordion value)
	for (i = 0; i < result.features.length; i++) { //Loop through all RPZs, build an individual section containers, and add to accordion
		var aContent = "<div><font face='Arial' size=''><b>Time & Days:  &nbsp;</b>" + result.features[i].attributes.Time_Reg + " | " + result.features[i].attributes.Day_Reg;
		aContainer.addChild(new ContentPane({
			title: "<b><span id='RPZ1'>Residential Parking Zone: " + result.features[i].attributes.RPZ_Num + "</b></span>",
			id: result.features[i].attributes.RPZ_Num, //Unique ID
			content: aContent,
			selected: false
		}));
	}
	this.Accordion_Implemented.appendChild(aContainer.domNode); //Add to DOM by data-dojo-attach-point 'Accordion_Implemented'
	aContainer.startup(); //Complete on page
	aContainer.on('click', lang.hitch(this, this._zoomToRPZ)); //Add click event to RPZ section - Need lang.hitch to keep scope of function within widget  - CHANGE THIS TO ONOPEN EVENT FOR EACH PANEL

})); //End lang.hitch
				//End unique Implemented RPZs-----------------------------------------------------------------------------------------------------------------------------------------
