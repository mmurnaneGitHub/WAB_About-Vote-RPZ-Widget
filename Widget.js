///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare',
    'dojo/_base/html',
    'dojo/query',
    'dojo/on',
    'dojo/_base/lang',
    'dijit/TitlePane', //MJM - collapsible bar to hold details
    'dijit/layout/AccordionContainer',  //MJM - AccordionContainer holds a set of panes whose titles are all visible, but only one pane’s content is visible at a time
    'dijit/layout/ContentPane',  //MJM - contents for each pane in AccordionContainer
    'jimu/PanelManager', //MJM - use to close another panel
    'esri/tasks/query',  //MJM - To find and zoom to individual RPZs
    './common',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget'
  ],
  function(declare, html, query, on, lang,
    TitlePane, AccordionContainer, ContentPane, PanelManager, Query, 
    common, _WidgetsInTemplateMixin, BaseWidget) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-about',

      postCreate: function () {
        this.inherited(arguments);
      },

      startup: function () {
	        this.inherited(arguments);

	        if (common.isDefaultContent(this.config)) {
	          this.config.about.aboutContent = common.setDefaultContent(this.config, this.nls);
	        }
	        this.resize();

	        this._constructPage(); //MJM - set up individual RPZ sections plus Questions section
      },

      onOpen: function(){  //MJM - Added to get around Vote Totals & Vote panels staying open.
	      	PanelManager.getInstance().closePanel(this.appConfig.widgetPool.widgets[1].id + '_panel');  //Close Vote Widget
	      	PanelManager.getInstance().closePanel(this.appConfig.widgetPool.widgets[2].id + '_panel');  //Close Vote Totals Widget
      },

      _constructPage: function() { //MJM - Add details in collapsible panels (Accordion)
	        //See TitleGroup as alt to Accordion - https://dojotoolkit.org/reference-guide/1.10/dojox/widget/TitleGroup.html
	        var aContainer = new AccordionContainer({ //https://dojotoolkit.org/api/
	          id: "Accordion1",
	          //iconBase: "images/spriteArrows.png",  //HOW TO GET OPEN/CLOSE ICONS??? - https://stackoverflow.com/questions/8524155/dojo-dijit-accordion-add-expand-and-collapse-arrows
	          //iconClass: "dijitArrowNode",
	          //iconClass: 'dijitEditorIconSpace', //empty image - place real image below
	          //iconClass: 'dijitEditorCut', //empty image - place real image below
	          style: "height: 460px"
	        }); //Needed to create enough space with each panel - MAYBE BASE ON NUMBER OF FEATURES 175=3
	        //Get unique RPZs, maybe update global variables for use in zooming later ---------------------------------------------------------------------------------
	        var query = new Query(); //https://developers.arcgis.com/javascript/3/jsapi/query-amd.html
	        var featureLayer = this.widgetManager.map.getLayer("Master_RPZ_Data_7046_6103");  //Use AGO Assistant
	        query.where = "App_Result='Under Review'"; //Proposed RPZs
	        query.outFields = ["Applicatio", "Petitioner", "App_Phase", "Time_Reg", "Day_Reg", "PPeriod"]; 
	        query.orderByFields = ["Applicatio"];
	        query.returnGeometry = false;
	        query.returnDistinctValues = true;  //Get unique combo of outFields
		        featureLayer.queryFeatures(query, lang.hitch(this, function(result) { //https://developers.arcgis.com/javascript/3/jsapi/featurelayer-amd.html#queryfeatures
		          this._zoomToFirst(result.features[0].attributes.Applicatio);  //Zoom to first RPZ in the list (to match the open accordion value)
		          for (i = 0; i < result.features.length; i++) { //Loop through all RPZs, build an individual section containers, and add to accordion
		            var aContent = "<div><font face='Arial' size='2'><b>Petitioner:  &nbsp;</b>" + result.features[i].attributes.Petitioner;
		                aContent += "<br><b>Phase:  &nbsp;</b>" + result.features[i].attributes.App_Phase;
		                aContent += "<br><b>Time & Days:  &nbsp;</b>" + result.features[i].attributes.Time_Reg + " | " + result.features[i].attributes.Day_Reg;
		                aContent += "<br><b>Petition Period:  &nbsp;</b>" + result.features[i].attributes.PPeriod;
		                aContent += "<br><span id='VoteTotal" + i + "' style='color: blue; text-decoration: underline; cursor: pointer;' title='Show current vote totals.'>Current Poll</span> | <span id='Vote" + i + "' style='color: blue; text-decoration: underline; cursor: pointer;' title='Show current vote totals.'>Vote</span></div>";
		            aContainer.addChild(new ContentPane({
		              title: "<b><span id='RPZ1'>Residential Parking Zone: " + result.features[i].attributes.Applicatio + "</b></span>",
		              id: result.features[i].attributes.Applicatio, //Unique ID
		              //iconClass: 'dijitEditorIconSpace', //empty image - place real image below
		              //iconClass: 'dijitEditorCut', //empty image - place real image below
		              content: aContent,
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

		        this.Accordion.appendChild(aContainer.domNode); //Add to DOM by data-dojo-attach-point 'Accordion'
		        aContainer.startup(); //Complete on page
		        aContainer.on('click', lang.hitch(this, this._zoomToRPZ)); //Add click event to RPZ section - Need lang.hitch to keep scope of function within widget  - CHANGE THIS TO ONOPEN EVENT FOR EACH PANEL
		        //End unique RPZs-----------------------------------------------------------------------------------------------------------------------------------------
	        //QUESTIONS & COMMENTS
	        var tpContent = "<div><font face='Arial' size='3'>For suggestions, questions, or comments related to the information provided on this map,";
	        tpContent += " please contact Rachel Lindahl, Public Works, at <a href='mailto:RLindahl@cityoftacoma.org?subject=Tacoma RPZ Locator Map' target='_self'>RLindahl@cityoftacoma.org</a> or 253-591-5371.</div>";
	        var tp = new TitlePane({
	          title: "<b>Questions & Comments</b>",
	          open: false,
	          content: tpContent
	        });
	        this.Questions.appendChild(tp.domNode);
	        tp.startup(); //place on page (waits for appendChild step)
      },

      _zoomToFirst: function (id) {  //MJM - Initial zoom - first RPZ in list 
	        var query = new Query();
	        var featureLayer = this.widgetManager.map.getLayer("Master_RPZ_Data_7046_6103");
	        query.where = "Applicatio='" + id + "'";  //RPZ ID
	         featureLayer.queryExtent(query,function(result){  //https://developers.arcgis.com/javascript/3/jsapi/featurelayer-amd.html#queryextent
	            this._widgetManager.map.setExtent(result.extent.expand(1.4)); //Need '_' to get to widgetManager instead of using hitch | expand extent slightly beyond features
	         })
      },

      _zoomToRPZ: function () {  //MJM - Query layer then zoom to extent of selection - For zoom links to each RPZ (could also zoom to parcels by RPZ_Value field value)
	        var query = new Query();
	        var featureLayer = this.widgetManager.map.getLayer("Master_RPZ_Data_7046_6103");
	        query.where = "Applicatio='" + dijit.byId("Accordion1").selectedChildWidget.id + "'";  //get the RPZ ID of the selected accordion panel(contentpane) - DON'T NEED SLICE IF UNIQUE
	         featureLayer.queryExtent(query,function(result){  //https://developers.arcgis.com/javascript/3/jsapi/featurelayer-amd.html#queryextent
	            this._widgetManager.map.setExtent(result.extent.expand(1.4)); //Need '_' to get to widgetManager instead of using hitch | expand extent slightly beyond features
	         })
      },

      _voteTotal: function () {  //MJM - Since this within the RPZ content the first event will be to zoom to RPZ (_zoomToRPZ), even if user pans away.
	        // https://developers.arcgis.com/web-appbuilder/api-reference/panelmanager.htm | https://developers.arcgis.com/web-appbuilder/api-reference/widgetmanager.htm
			PanelManager.getInstance().showPanel(this.appConfig.widgetPool.widgets[2]);  //Loads and opens a panel (widget pool not on screen): Infographic Widget (#2) - works, but panel stays open!!! Fix with onClose event.
	        PanelManager.getInstance().closePanel(this.appConfig.widgetPool.widgets[3].id + '_panel');  //Close About Widget
      },

      _voteNow: function () {  //MJM - Since this within the RPZ content the first event will be to zoom to RPZ (_zoomToRPZ), even if user pans away.
	        PanelManager.getInstance().showPanel(this.appConfig.widgetPool.widgets[1]);  //Loads and opens a panel: SmartEditor Widget (#1) - works, but stays open!!! Fix with onClose event.
	        PanelManager.getInstance().closePanel(this.appConfig.widgetPool.widgets[3].id + '_panel');  //close About Widget
      },

      resize: function () {
        this._resizeContentImg();
      },

      _resizeContentImg: function () {
	        html.empty(this.customContentNode);

	        var aboutContent = html.toDom(this.config.about.aboutContent);
	        html.place(aboutContent, this.customContentNode);
	        // single node only(no DocumentFragment)
	        if (this.customContentNode.nodeType && this.customContentNode.nodeType === 1) {
	          var contentImgs = query('img', this.customContentNode);
	          if (contentImgs && contentImgs.length) {
	            contentImgs.forEach(lang.hitch(this, function (img) {
	              var isNotLoaded = ("undefined" !== typeof img.complete && false === img.complete) ? true : false;
	              if (isNotLoaded) {
	                this.own(on(img, 'load', lang.hitch(this, function () {
	                  this._resizeImg(img);
	                })));
	              } else {
	                this._resizeImg(img);
	              }
	            }));
	          }
	        }
      },
      _resizeImg: function(img) {
	        var customBox = html.getContentBox(this.customContentNode);
	        var imgSize = html.getContentBox(img);
	        if (imgSize && imgSize.w && imgSize.w >= customBox.w) {
	          html.setStyle(img, {
	            maxWidth: (customBox.w - 20) + 'px', // prevent x scroll
	            maxHeight: (customBox.h - 40) + 'px'
	          });
	        }
      }
    });
    return clazz;
  });