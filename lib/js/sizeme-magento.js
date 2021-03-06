// SizeMe UI JS v1.0
// based on SizeMe Item Types 2015-03-11
// (c) SizeMe Inc.
// www.sizeme.com
// License undecided
/* jshint browser:true, jquery:true */
/* globals product: false, sizeme_options: false, sizeme_UI_options: false, Opentip: false, SizeMe: false */

(function($) {
    "use strict";

// Common functions for all pages
var LOCALIZED_STR = {
    not_fitted: "Too small",
    too_small: "Too small",
    slim: "Slim",
    regular: "Regular",
    loose: "Loose",
    very_loose: "Very loose",
    huge: "Huge",
    too_big: "Too big",

    chest: "Chest",	
    waist: "Waist",    
    sleeve: "Sleeve",    
    sleeve_top_width: "Sleeve top",     
    wrist_width: "Wrist",
    underbust: "Underbust",
	neck_opening_width: "Collar",    
    shoulder_width: "Shoulder",
    front_height: "Front height",
	pant_waist: "Pant waist",
	hips: "Hips",	
	inseam: "Inseam",	
	outseam: "Outseam",
	thigh_width: "Thigh",
	knee_width: "Knee",
	calf_width: "Calf",
	pant_sleeve_width: "Leg opening",
    shoe_inside_length: "Shoe length",
	shoe_inside_width: "Shoe width",
    hat_width: "Hat circumference",
    hood_height: "Hood height"
};

var LOCALIZED_STR_longs = {
    not_fitted: "Too short",
    too_small: "Too short",
    slim: "Short",
    regular: "Regular",
    loose: "Long",
    very_loose: "Very long",
    huge: "Huge",
    too_big: "Too long"
};

var FIT_RANGES = {
	   1: {text: "too_small", arrowColor: "#999999"}, 
	 940: {text: "too_small", arrowColor: "#BB5555"},
	1000: {text: "slim", arrowColor: "#457A4C"},
	1050: {text: "regular", arrowColor: "#42AE49"},
	1110: {text: "loose", arrowColor: "#87B98E"},
	1170: {text: "too_big", arrowColor: "#BB5555"},
	1230: {text: "too_big", arrowColor: "#BB5555"}
};

var FIT_ORDER = [
	"chest",	
	"waist",    
	"underbust",
	"pant_waist",
	"hips",	
	"inseam",	
	"outseam",
	"thigh_width",
	"knee_width",
	"calf_width",
	"pant_sleeve_width",
	"neck_opening_width",    
	"shoulder_width",
    "sleeve_top_width",     
    "sleeve",    
    "wrist_width",
	"front_height",
	"shoe_inside_length",
	"shoe_inside_width",
	"hat_width",
	"hood_height"	
];

var PINCHED_FITS = [
	"chest",	
	"waist",    
	"underbust",
	"pant_waist",
	"hips",	
	"thigh_width",
	"knee_width",
	"calf_width",
	"pant_sleeve_width",
	"neck_opening_width",    
    "sleeve_top_width",     
    "wrist_width",
	"hat_width"
];

var LONG_FITS = [
	"inseam",	
	"outseam",
    "sleeve",    
	"front_height"
];

var OPTIMAL_FIT = 1070;

var realCanvasWidth = 350;
var realCanvasHeight = 480;
var padding = 0.07;

var drawColor = '#777777';
var fillColor = '#BBBBBB';
var arrowColor;
var arrowColorGreen = '#42AE49';
var arrowColorBlack = '#000000';
var arrowColorInfo = '#666666';

var itemLineWidth = 1;
var arrowLineWidth = 2;
var arrowEndRadius = 4;
var arrowNumberRadius = 10;
var arrowNumberFont = "10px sans-serif";
var arrowNumberHighlightFont = "bold 14px sans-serif";
var arrowLift = 30;
var arcRadius = 10;

var fadeLength = 400;

var item_drawing = {};
var measurement_arrows = {};

var sizeKeys = [];

var recommendedId;
var recommendedLabel = "None";

var selectedProfile;
var linkToSelectedProfile;

var sliderScale = 1.15;
var sliderPosXMin = 9999;
var sliderPosXMax = 0;

var accuracyThreshold = 0.01;

var cookieLifetime = 90;

var itemName = "";

var sizeme_local_options = {
	fitAreaSlider: true,
	writeMessages: true,
	writeOverlaps: true
};

function sizeText(txt) {
	var retStr = txt;
	retStr = retStr.split(" -")[0];
	retStr = retStr.split(" +")[0];
	return retStr;
}

function getFit(fitValue) {
    var returnFit;
	for (var singleFit in FIT_RANGES) {
        if (FIT_RANGES.hasOwnProperty(singleFit)) {
            if (fitValue < singleFit) {
                if (returnFit) {
                    return returnFit;
                } else {
                    return FIT_RANGES[singleFit];
                }
            }
            returnFit = FIT_RANGES[singleFit];
        }
	}
	return returnFit;
}

function addIds(parentElement) {
	// add ids to select for easy handling
	$(parentElement+" option").each(function() {
		var myVal = $(this).val();	
		var myText = $(this).text();
		$(this).addClass("sm-selectable element_for_"+myVal);
		this.id = (myVal ? "input_"+myVal : "choose");
		if (myVal) {
			if (product.item.measurements[myVal]) {
				sizeKeys.push({key: myVal, sizeLabel: myText});
			}
		}
	});
}

function loadArrows(isSizeGuide) {
	var itemTypeStr = product.item.itemType.toString(),
        $i, $x;
	
	// arrows first
	arrowColor = arrowColorGreen;
	var arcStyle = "arc";
	
	if (isSizeGuide) {
		arrowColor = arrowColorBlack;
		arcStyle = "line"; // size guide shows flat measurements (except neck opening)
	}
	
	measurement_arrows.sleeve = { mirror: false, coords: [{X: 329,Y: 44},{X: 569,Y: 975}], style: "line", lift: true, color: arrowColor };
	measurement_arrows.sleeve_top_width = { mirror: false, coords: [{X: 250,Y: 399},{X: 410,Y: 348}], style: arcStyle, lift: false, color: arrowColor };
	measurement_arrows.wrist_width = { mirror: false, coords: [{X: 571,Y: 978},{X: 454,Y: 1009}], style: arcStyle, lift: false, color: arrowColor };
	
	measurement_arrows.chest = { mirror: false, coords: [{X: -250,Y: 399},{X: 250,Y: 399}], style: arcStyle, lift: false, color: arrowColor };
	measurement_arrows.waist = { mirror: false, coords: [{X: -250,Y: 635},{X: 250,Y: 635}], style: arcStyle, lift: false, color: arrowColor };
	measurement_arrows.front_height = { mirror: false, coords: [{X: -174,Y: 0},{X: -174,Y: 978}], style: "line", lift: false, color: arrowColor };
	measurement_arrows.neck_opening_width = {
		mirror: false, 
		coords: [{X: 0,Y: 47}, {X: 174,Y: 0, cp1X: 65, cp1Y: 45, cp2X: 140, cp2Y: 23}, {X: 0,Y: 100, cp1X: 150, cp1Y: 46, cp2X: 50, cp2Y: 92}, 
				 {X: -174,Y: 0, cp1X: -50, cp1Y: 92, cp2X: -150, cp2Y: 46}, {X: 0,Y: 47, cp1X: -140, cp1Y: 23, cp2X: -65, cp2Y: 45}],
		style: "line", 
		lift: true, 
		color: arrowColor};
	
	measurement_arrows.hood_height = { mirror: false, coords: [{X: 195,Y: -5},{X: 195,Y: -390}], style: "line", lift: false, color: arrowColor };
	measurement_arrows.shoulder_width = { mirror: false, coords: [{X: -329,Y: 42},{X: -164,Y: -7}], style: "line", lift: true, color: arrowColor };

	measurement_arrows.pant_waist = { mirror: false, coords: [{X: -232,Y: 0},{X: 222,Y: 0}], style: arcStyle, lift: true, color: arrowColor };
	measurement_arrows.hips = { mirror: false, coords: [{X: -261,Y: 171}, {X: 263,Y: 171}], style: arcStyle, lift: false, color: arrowColor };
	measurement_arrows.outseam = { mirror: false, coords: [{X: 222,Y: 0},{X: 263,Y: 171},{X: 302,Y: 1071}], style: "line", lift: true, color: arrowColor };
	measurement_arrows.inseam = { mirror: false, coords: [{X: 5,Y: 297},{X: 151, Y: 1084}], style: "line", lift: false, color: arrowColor };
	measurement_arrows.thigh_width = { mirror: false, coords: [{X: -266,Y: 274},{X: -17,Y: 297}], style: arcStyle, lift: false, color: arrowColor };
	measurement_arrows.knee_width = { mirror: false, coords: [{X: -286,Y: 727},{X: -93,Y: 744}], style: arcStyle, lift: false, color: arrowColor };
	measurement_arrows.pant_sleeve_width = { mirror: false, coords: [{X: -301,Y: 1071},{X: -152,Y: 1084}], style: arcStyle, lift: false, color: arrowColor };
	
	measurement_arrows.shoe_inside_length = { mirror: false, coords: [{X: 169,Y: 984},{X: 132,Y: 18}], style: "line", lift: false, color: arrowColor };
	
	measurement_arrows.hat_width = {
		mirror: false, 
		coords: [{X: 534,Y: 238}, 
				 {X: 539,Y: 265, cp1X: 559, cp1Y: 236, cp2X: 567, cp2Y: 252}, 
				 {X: 70,Y: 262, cp1X: 352, cp1Y: 353, cp2X: 223, cp2Y: 351}, 
				 {X: 77,Y: 242, cp1X: 38, cp1Y: 241, cp2X: 60, cp2Y: 234}], 
		midCircle: {X: 300, Y: 325}, 				 
		style: "line", 
		lift: false, 
		color: arrowColor };
	
	item_drawing.mirror = true;
	item_drawing.coords = [];
	item_drawing.accents = [];			
	// load item drawing
	switch (itemTypeStr[0]) {
	
	case '1':	// shirts/coats
		LOCALIZED_STR.hips = "Hem";
		LOCALIZED_STR.pant_waist = "Hem";

		switch (itemTypeStr[2]) { // shoulder
			case '2':	// raglan line
				if (itemTypeStr[1] !== '0') {
                    item_drawing.accents.push({type: "line", coords: [{X: 250,Y: 399}, {X: 185,Y: 6, cp1X: 220, cp1Y: 320, cp2X: 185, cp2Y: 6}]});
                }
				measurement_arrows.sleeve = { mirror: false, coords: [{X: 174,Y: -16}, {X: 329,Y: 27},{X: 569,Y: 975}], style: "line", lift: true, midCircle: {X: 437, Y: 444}, color: arrowColor };
				break;
			case '1':	// normal shoulder line
				if (itemTypeStr[3] !== '0') {
                    item_drawing.accents.push({type: "line", coords: [{X: 250,Y: 399}, {X: 329,Y: 44, cp1X: 250, cp1Y: 250, cp2X: 300, cp2Y: 70}]});
                } break;
		}
		
		switch (itemTypeStr[1]) { // collar
			case '2':	// tight (turnover)
				item_drawing.coords.push({X: 0,Y: -60},{X: 119,Y: -48, cp1X: 68, cp1Y: -60, cp2X: 106, cp2Y: -57}, {X: 128,Y: 0}); 
				item_drawing.accents.push({type: "area", coords: [	{X: 0,Y: -47}, 
																	{X: 100,Y: -35, cp1X: 64, cp1Y: -48, cp2X: 105, cp2Y: -47}, 
																	{X: -5,Y: 59, cp1X: 66, cp1Y: 8, cp2X: 6, cp2Y: 40},
																	{X: -104,Y: -34, cp1X: -25, cp1Y: 32, cp2X: -93, cp2Y: -12}, 
																	{X: 0,Y: -46, cp1X: -117, cp1Y: -48, cp2X: -52, cp2Y: -48}
																], noMirror: true});
				item_drawing.accents.push({type: "line", coords:[	{X: 129,Y: 0}, 
																	{X: 136,Y: 26, cp1X: 132, cp1Y: 14, cp2X: 133, cp2Y: 18},
																	{X: 78,Y: 125, cp1X: 123, cp1Y: 63, cp2X: 100, cp2Y: 95},
																	{X: 37,Y: 78, cp1X: 60, cp1Y: 106, cp2X: 51, cp2Y: 101},
																	{X: -12,Y: 111, cp1X: 24, cp1Y: 8, cp2X: -32, cp2Y: 66}
																], noMirror: true});	// non mirrored turnover collar right
				item_drawing.accents.push({type: "line", coords:[	{X: -129,Y: 0}, 
																	{X: -136,Y: 26, cp1X: -132, cp1Y: 14, cp2X: -133, cp2Y: 18},
																	{X: -90,Y: 127, cp1X: -127, cp1Y: 68, cp2X: -106, cp2Y: 110},
																	{X: -9,Y: 59, cp1X: -33, cp1Y: 88, cp2X: -61, cp2Y: 25}
																], noMirror: true});	// non mirrored turnover collar left
				item_drawing.accents.push({type: "circle", coords: [{X: 0,Y: 100, R: 5}]});																
				measurement_arrows.neck_opening_width = {
					mirror: false, 
					coords: [{X: 0,Y: -47}, {X: 100,Y: -35, cp1X: 64, cp1Y: -48, cp2X: 105, cp2Y: -47}, 
							{X: -5,Y: 59, cp1X: 66, cp1Y: 8, cp2X: 6, cp2Y: 40}, {X: -104,Y: -34, cp1X: -25, cp1Y: 32, cp2X: -93, cp2Y: -12}, 
							{X: 0,Y: -46, cp1X: -117, cp1Y: -48, cp2X: -52, cp2Y: -48}],
					style: "line", 
					lift: false, 
					midCircle: {X: 0, Y: -47},
					color: arrowColor};		
				measurement_arrows.shoulder_width = { mirror: false, coords: [{X: -329,Y: 49},{X: -129,Y: -5}], style: "line", lift: true, color: arrowColor };
				measurement_arrows.front_height = { mirror: false, coords: [{X: -167,Y: -4},{X: -167,Y: 978}], style: "line", lift: false, color: arrowColor };

				break;		
			case '3':	// hood 
				item_drawing.coords.push({X: 0,Y: -390},{X: 185,Y: 6, cp1X: 180, cp1Y: -400, cp2X: 160, cp2Y: -20}); 
				item_drawing.accents.push({type: "line", coords: [{X: 185,Y: 6}, {X: 0,Y: 123, cp1X: 140, cp1Y: 70, cp2X: 70, cp2Y: 100}]});	// basic round collar line			
				item_drawing.accents.push({type: "area", coords: [{X: 0,Y: -320}, {X: 144,Y: 0, cp1X: 150, cp1Y: -320, cp2X: 140, cp2Y: -20}, {X: 0,Y: 100, cp1X: 140, cp1Y: 46, cp2X: 40, cp2Y: 92}]}); // hood area
				measurement_arrows.shoulder_width = { mirror: false, coords: [{X: -329,Y: 42},{X: -174,Y: -7}], style: "line", lift: true, color: arrowColor };
				break;
			case '5':	// open high round
				item_drawing.coords.push({X: 0,Y: 90},{X: 189,Y: 0}); 
				item_drawing.accents.push({type: "line", coords: [{X: 210,Y: 6}, {X: 0,Y: 123, cp1X: 165, cp1Y: 70, cp2X: 100, cp2Y: 123}]});	// open round collar line
				item_drawing.accents.push({type: "area", coords: [{X: 0,Y: 49}, {X: 189,Y: 0, cp1X: 100, cp1Y: 47, cp2X: 155, cp2Y: 23}, {X: 0,Y: 102, cp1X: 165, cp1Y: 46, cp2X: 95, cp2Y: 102}]}); // open collar area
				break;
			case '6':	// open low round
				item_drawing.coords.push({X: 0,Y: 180},{X: 164,Y: 0}); 
				item_drawing.accents.push({type: "line", coords: [{X: 181,Y: 5}, {X: 0,Y: 196, cp1X: 146, cp1Y: 196, cp2X: 50, cp2Y: 196}]});	// collar line							
				item_drawing.accents.push({type: "area", coords: [{X: 0,Y: 47}, {X: 164,Y: 0, cp1X: 55, cp1Y: 45, cp2X: 130, cp2Y: 23}, {X: 0,Y: 180, cp1X: 130, cp1Y: 180, cp2X: 45, cp2Y: 180}]}); // basic area
				break;
			case '7':	// v-style high
				item_drawing.coords.push({X: 0,Y: 90},{X: 189,Y: 0}); 
				item_drawing.accents.push({type: "line", coords: [{X: 210,Y: 6}, {X: 0,Y: 123, cp1X: 165, cp1Y: 70, cp2X: 80, cp2Y: 100}]});	// open round collar line
				item_drawing.accents.push({type: "area", coords: [{X: 0,Y: 47}, {X: 189,Y: 0, cp1X: 80, cp1Y: 45, cp2X: 155, cp2Y: 23}, {X: 0,Y: 100, cp1X: 165, cp1Y: 46, cp2X: 65, cp2Y: 92}]}); // open collar area
				break;
			case '8':	// v-style low
				item_drawing.coords.push({X: 0,Y: 90},{X: 189,Y: 0}); 
				item_drawing.accents.push({type: "line", coords: [{X: 210,Y: 6}, {X: 0,Y: 123, cp1X: 165, cp1Y: 70, cp2X: 80, cp2Y: 100}]});	// open round collar line
				item_drawing.accents.push({type: "area", coords: [{X: 0,Y: 47}, {X: 189,Y: 0, cp1X: 80, cp1Y: 45, cp2X: 155, cp2Y: 23}, {X: 0,Y: 100, cp1X: 165, cp1Y: 46, cp2X: 65, cp2Y: 92}]}); // open collar area
				break;
			default:	// elastic round
				item_drawing.coords.push({X: 0,Y: 90},{X: 164,Y: 0}); 
				item_drawing.accents.push({type: "line", coords: [{X: 185,Y: 6}, {X: 0,Y: 110, cp1X: 140, cp1Y: 70, cp2X: 70, cp2Y: 108}]});	// basic round collar line							
				item_drawing.accents.push({type: "area", coords: [{X: 0,Y: 47}, {X: 164,Y: 0, cp1X: 55, cp1Y: 45, cp2X: 130, cp2Y: 23}, {X: 0,Y: 90, cp1X: 140, cp1Y: 46, cp2X: 55, cp2Y: 90}]}); // basic area
				break;
		}
		
		switch (itemTypeStr[3]) { // sleeve length
			case '0':	// vest or poncho
				item_drawing.coords.push({X: 289,Y: 34});			
				item_drawing.coords.push({X: 250,Y: 399, cp1X: 285, cp1Y: 44, cp2X: 220, cp2Y: 389});
				measurement_arrows.shoulder_width = { mirror: false, coords: [{X: -299,Y: 32},{X: -164,Y: -7}], style: "line", lift: true, color: arrowColor };

				if (itemTypeStr[4] !== '0') {
					item_drawing.coords.push({X: 250,Y: 399, cp1X: 328, cp1Y: 44, cp2X: 250, cp2Y: 260});
					FIT_ORDER.splice(13, 1);  // remove sleeve top
					measurement_arrows.sleeve_top_width = false;
				}
				break;
			case '1':  // very short 
			case '2':  // short 
			case '3':  // short-medium
				item_drawing.coords.push({X: 329,Y: 44});			
				item_drawing.coords.push({X: 482,Y: 460},{X: 324,Y: 529}); 
				item_drawing.coords.push({X: 250,Y: 399});
				measurement_arrows.sleeve = { mirror: false, coords: [{X: 329,Y: 44},{X: 482,Y: 460}], style: "line", lift: true, color: arrowColor };
				measurement_arrows.sleeve_top_width = { mirror: false, coords: [{X: 250,Y: 399},{X: 430,Y: 322}], style: arcStyle, lift: false, color: arrowColor };
				measurement_arrows.wrist_width = { mirror: false, coords: [{X: 324,Y: 529},{X: 482,Y: 460}], style: arcStyle, lift: false, color: arrowColor };
				LOCALIZED_STR.wrist_width = "Sleeve opening";
				break;
			case '4':  // medium
			case '5':  // semi-long 
			case '6':  // long
			case '7':  // very long
			case '8':  // extra long
				item_drawing.coords.push({X: 329,Y: 44});			
				if (itemTypeStr[4] === '1') {	// elastic
					item_drawing.coords.push({X: 556,Y: 902},{X: 547,Y: 930}, {X: 557,Y: 978},{X: 463,Y: 998},{X: 449,Y: 951},{X: 430,Y: 934}); 
					item_drawing.accents.push({type: "line", coords: [{X: 465,Y: 944}, {X: 476,Y: 996}]},
												{type: "line", coords: [{X: 476,Y: 941}, {X: 487,Y: 993}]},
												{type: "line", coords: [{X: 487,Y: 938}, {X: 498,Y: 990}]},
												{type: "line", coords: [{X: 498,Y: 935}, {X: 509,Y: 987}]},
												{type: "line", coords: [{X: 509,Y: 932}, {X: 520,Y: 984}]},
												{type: "line", coords: [{X: 520,Y: 929}, {X: 531,Y: 981}]},
												{type: "line", coords: [{X: 531,Y: 926}, {X: 542,Y: 978}]});
					item_drawing.coords.push({X: 250,Y: 399});
					measurement_arrows.wrist_width = { mirror: false, coords: [{X: 430,Y: 934}, {X: 556,Y: 902}], style: arcStyle, lift: false, color: arrowColor };
				} else {
					item_drawing.coords.push({X: 571,Y: 978},{X: 454,Y: 1009}); 
					item_drawing.coords.push({X: 250,Y: 399});
				}
				break;
		}	
		
		switch (itemTypeStr[5]) { // waistband
			case '0':	// poncho dude
				item_drawing.coords.push({X: 550,Y: 750, cp1X: 450, cp1Y: 70, cp2X: 450, cp2Y: 550}); 			
				item_drawing.coords.push({X: 0,Y: 1038, cp1X: 450, cp1Y: 800, cp2X: 400, cp2Y: 1038}); 		
				measurement_arrows.front_height = { mirror: false, coords: [{X: -174,Y: 5},{X: -174,Y: 1018}], style: "line", lift: false, color: arrowColor };
				measurement_arrows.sleeve = { mirror: false, coords: [{X: 174,Y: 0}, {X: 394,Y: 59},{X: 550,Y: 750}], style: "line", lift: true, midCircle: {X: 480, Y: 444}, color: arrowColor };
				break;
			case '3':	// pant waist 
				if (itemTypeStr[6] === '1') {	// elastic
					item_drawing.coords.push({X: 250,Y: 908, cp1X: 247, cp1Y: 402, cp2X: 247, cp2Y: 858},{X: 230,Y: 978},{X: 0,Y: 978}); 
					for ($i = 0; $i<15; $i++) {
						$x = Math.round(($i+0.5)*(230/15));
						item_drawing.accents.push({type: "line", coords: [{X: $x,Y: 918}, {X: $x,Y: 978}]});
					}
					measurement_arrows.pant_waist = { mirror: false, coords: [{X: -250,Y: 908}, {X: 250,Y: 908}], style: arcStyle, lift: false, color: arrowColor };
				} else {
					item_drawing.coords.push({X: 250,Y: 978, cp1X: 245, cp1Y: 402, cp2X: 245, cp2Y: 928},{X: 0,Y: 978}); 
					measurement_arrows.pant_waist = { mirror: false, coords: [{X: -250,Y: 978}, {X: 250,Y: 978}], style: arcStyle, lift: false, color: arrowColor };
				}
				break;			
			// case '4':	// hips
			default: 
				if (itemTypeStr[6] === '1') {	// elastic
					item_drawing.coords.push({X: 250,Y: 978, cp1X: 247, cp1Y: 402, cp2X: 247, cp2Y: 908},{X: 230,Y: 1038},{X: 0,Y: 1038}); 
					for ($i = 0; $i<15; $i++) {
						$x = Math.round(($i+0.5)*(230/15));
						item_drawing.accents.push({type: "line", coords: [{X: $x,Y: 988}, {X: $x,Y: 1038}]});
					}
					measurement_arrows.front_height.coords[1].Y = 1038;
					measurement_arrows.hips = { mirror: false, coords: [{X: -250,Y: 978}, {X: 250,Y: 978}], style: arcStyle, lift: false, color: arrowColor };
				} else {
					item_drawing.coords.push({X: 250,Y: 1038, cp1X: 245, cp1Y: 402, cp2X: 245, cp2Y: 978},{X: 0,Y: 1038}); 
					measurement_arrows.front_height.coords[1].Y = 1038;
					measurement_arrows.hips = { mirror: false, coords: [{X: -250,Y: 1038}, {X: 250,Y: 1038}], style: arcStyle, lift: false, color: arrowColor };
				}
				break;
		}
		
		break;	// case 1 shirts/coats

	case '2':	// trousers/shorts
		item_drawing.mirror = false; // for accents mainly
		item_drawing.coords.push({X: -232,Y: 0},{X: 222,Y: 0, cp1X: -100, cp1Y: 10, cp2X: 90, cp2Y: 10},{X: 263,Y: 171});
		
		switch (itemTypeStr[3]) { // sleeve
			case '1':	// very short 
			case '2':	// short
			case '3':	// short-medium
			case '4':	// medium
				item_drawing.coords.push({X: 291,Y: 626},{X: 71, Y: 651});
				break;
			case '5':  // semi-long 
			case '6':  // long
				item_drawing.coords.push({X: 302,Y: 1071},{X: 151, Y: 1084});
				break;
		}
		
		item_drawing.coords.push({X: 5,Y: 297},{X: -17,Y: 297});
		
		switch (itemTypeStr[3]) { // sleeve again as not mirror 
			case '1':	// very short 
			case '2':	// short
			case '3':	// short-medium
			case '4':	// medium
				item_drawing.coords.push({X: -71,Y: 651},{X: -291,Y: 626});
				measurement_arrows.outseam = { mirror: false, coords: [{X: 222,Y: 0},{X: 263,Y: 171},{X: 291,Y: 626}], style: "line", lift: true, color: arrowColor };
				measurement_arrows.knee_width = { mirror: false, coords: [{X: -291,Y: 626},{X: -71,Y: 651}], style: arcStyle, lift: false, color: arrowColor };
				break;
			case '5':  // semi-long 
			case '6':  // long
				item_drawing.coords.push({X: -152,Y: 1084},{X: -301,Y: 1071});
				break;
		}
		
		item_drawing.coords.push({X: -261,Y: 171});
		item_drawing.accents.push(	{type: "area", coords: [{X: -232,Y: 0}, {X: 222,Y: 0, cp1X: -100, cp1Y: 10, cp2X: 90, cp2Y: 10}, {X: -232,Y: 0, cp1X: 122, cp1Y: 40, cp2X: -132, cp2Y: 40}]},
									{type: "line", coords: [{X: -237,Y: 37}, {X: 229,Y: 37, cp1X: -137, cp1Y: 76, cp2X: 129, cp2Y: 76}]},
									{type: "line", coords: [{X: -14,Y: 19}, {X: -8,Y: 297, cp1X: 3, cp1Y: 114, cp2X: 0, cp2Y: 215}]},
									{type: "line", coords: [{X: -4,Y: 254}, {X: 29,Y: 64, cp1X: 34, cp1Y: 242, cp2X: 35, cp2Y: 188}]},
									{type: "line", coords: [{X: -233,Y: 160}, {X: -147,Y: 81, cp1X: -182, cp1Y: 157, cp2X: -152, cp2Y: 123}]},
									{type: "line", coords: [{X: 150,Y: 85}, {X: 236,Y: 164, cp1X: 158, cp1Y: 128, cp2X: 195, cp2Y: 160}]});
		if (itemTypeStr[6] === '4') {	// rope waistband
			item_drawing.accents.push(	{type: "line", coords: [{X: 9,Y: 49}, {X: 8,Y: 47, cp1X: -24, cp1Y: 168, cp2X: -69, cp2Y: 84}]},
										{type: "line", coords: [{X: 9,Y: 50}, {X: 8,Y: 49, cp1X: 47, cp1Y: 149, cp2X: 70, cp2Y: 99}]},
										{type: "line", coords: [{X: 9,Y: 49}, {X: 49,Y: 49, cp1X: 27, cp1Y: 59, cp2X: 36, cp2Y: 54}]},
										{type: "line", coords: [{X: 9,Y: 49}, {X: 9,Y: 64, cp1X: 11, cp1Y: 54, cp2X: 11, cp2Y: 54}]});
		} else {
			item_drawing.accents.push({type: "circle", coords: [{X: 9,Y: 48, R: 10}]});		
		}
											
		break; 	// case 2 trousers
		
		case '3':	// shoes for my friends
			item_drawing.mirror = false;
			item_drawing.coords = [	{X: 130,Y: 0},{X: 363,Y: 456, cp1X: 240, cp1Y: 8, cp2X: 345, cp2Y: 214},
									{X: 328,Y: 633, cp1X: 358, cp1Y: 532, cp2X: 328, cp2Y: 564},{X: 182,Y: 999, cp1X: 330, cp1Y: 732, cp2X: 327, cp2Y: 994},
									{X: 48,Y: 628, cp1X: 3, cp1Y: 994, cp2X: 48, cp2Y: 789},
									{X: 0,Y: 340, cp1X: 42, cp1Y: 447, cp2X: 0, cp2Y: 444},{X: 130,Y: 0, cp1X: 0, cp1Y: 114, cp2X: 72, cp2Y: 0} ];
			item_drawing.accents = [{type: "area", coords: [{X: 164,Y: 625}, {X: 266,Y: 716, cp1X: 270, cp1Y: 632, cp2X: 276, cp2Y: 638}, {X: 168,Y: 990, cp1X: 236, cp1Y: 982, cp2X: 208, cp2Y: 987},
									{X: 69,Y: 716, cp1X: 92, cp1Y: 978, cp2X: 83, cp2Y: 852}, {X: 164,Y: 625, cp1X: 64, cp1Y: 641, cp2X: 57, cp2Y: 628}]},
									{type: "line", coords: [{X: 103,Y: 431}, {X: 212,Y: 430, cp1X: 112, cp1Y: 404, cp2X: 203, cp2Y: 405}]},
									{type: "line", coords: [{X: 115,Y: 469}, {X: 200,Y: 469, cp1X: 121, cp1Y: 447, cp2X: 188, cp2Y: 450}]},
									{type: "line", coords: [{X: 115,Y: 506}, {X: 200,Y: 506, cp1X: 121, cp1Y: 484, cp2X: 188, cp2Y: 484}]},
									{type: "line", coords: [{X: 115,Y: 555}, {X: 200,Y: 555, cp1X: 121, cp1Y: 533, cp2X: 188, cp2Y: 533}]},
									{type: "line", coords: [{X: 164,Y: 539}, {X: 283,Y: 541, cp1X: 242, cp1Y: 523, cp2X: 279, cp2Y: 609}, {X: 164,Y: 539, cp1X: 277, cp1Y: 492, cp2X: 209, cp2Y: 515}]},
									{type: "line", coords: [{X: 164,Y: 539}, {X: 45,Y: 492, cp1X: 123, cp1Y: 517, cp2X: 34, cp2Y: 532}, {X: 164,Y: 539, cp1X: 65, cp1Y: 457, cp2X: 129, cp2Y: 509}]}
								];			
		break;	// case 3 shoes

		case '4':	// hats off
			switch (itemTypeStr[1]) { 
			case '1':	// bucket
				item_drawing.mirror = false;
				item_drawing.coords = [	{X: 300,Y: 0},
										{X: 522,Y: 214, cp1X: 452, cp1Y: 17, cp2X: 458, cp2Y: 61},
										{X: 599,Y: 311, cp1X: 594, cp1Y: 245, cp2X: 601, cp2Y: 283},
										{X: 293,Y: 437, cp1X: 597, cp1Y: 361, cp2X: 494, cp2Y: 433},
										{X: 0,Y: 306, cp1X: 87, cp1Y: 433, cp2X: 2, cp2Y: 355},
										{X: 92,Y: 209, cp1X: 1, cp1Y: 258, cp2X: 44, cp2Y: 227},
										{X: 300,Y: 0, cp1X: 156, cp1Y: 28, cp2X: 186, cp2Y: 16} ];
				item_drawing.accents = [
										{type: "line", coords: [{X: 222,Y: 48}, {X: 367,Y: 43, cp1X: 269, cp1Y: 29, cp2X: 288, cp2Y: 64}]},
										{type: "line", coords: [{X: 523,Y: 214}, {X: 544,Y: 280}, 
																{X: 63,Y: 278, cp1X: 376, cp1Y: 368, cp2X: 209, cp2Y: 373}, {X: 92,Y: 209}]} ];			
				break;
			}
		break;	// case 4 hats
									
	}
}


function getSliderHtml(systemsGo) {
	var sliderHtml = "";
	var basePosX = 0;
	var cellTitle = "";
	sliderHtml += "<div class='sizeme_slider'>";
	if (systemsGo) {
		sliderHtml += "<div class='slider_text slider_text_above'></div>";
		sliderHtml += "<div class='slider_container'>";
			sliderHtml += "<div class='slider_bar'>";
			sliderHtml += "</div>";
			if (sizeme_local_options.fitAreaSlider) {
                sliderHtml += "<div class='slider_area'></div>";
            }
 			sliderHtml += "<table class='slider_table'><tr>";
			for (var singleFit in FIT_RANGES) {
                if (FIT_RANGES.hasOwnProperty(singleFit)) {
                    if (singleFit > 1) {
                        if (basePosX !== 0) {
                            sliderHtml += "<td class='" + cellTitle + "'";
                            sliderHtml += " style='width: " + Math.round((singleFit - basePosX) * sliderScale) + "px;'>";
                            sliderHtml += LOCALIZED_STR[cellTitle];
                            sliderHtml += "</td>";
                        }
                        basePosX = (+singleFit);
                        cellTitle = FIT_RANGES[singleFit].text;
                        if (basePosX > sliderPosXMax) {
                            sliderPosXMax = basePosX;
                        }
                        if (basePosX < sliderPosXMin) {
                            sliderPosXMin = basePosX;
                        }
                    }
                }
			}
			sliderHtml += "</tr></table>";
		sliderHtml += "</div>";
	}
		sliderHtml += "<div class='slider_text slider_text_below'></div>";
		sliderHtml += "<div class='slider_text slider_text_more_below'></div>";
	sliderHtml += "</div>";

	return sliderHtml;
}

function sliderPos(fitValue, offset) {
	var returnPos = Math.round((Math.min(fitValue, sliderPosXMax) - sliderPosXMin) * sliderScale);
	returnPos = Math.max(0, returnPos);
	returnPos += offset;   // with +offset for graphics
	
	return returnPos;
}

function killExtraSlider() {
	$("#slider_secondary").remove();
	return true;
}

function drawExtraSlider(fitValue) {
	killExtraSlider(); // in case of hang arounds
	var sliderHtml = "<div class='slider_bar' id='slider_secondary'></div>";
	$(sliderHtml).hide().appendTo(".sizeme_detailed_view_window .slider_container").fadeIn(fadeLength);
	var newWidth = sliderPos(fitValue, 9);
	$("#slider_secondary").width(newWidth);
	return true;
}


function writeSliderFlag(fitValue, fitLabel, thisSize, thisId) {
	// first, out with the old
	var sliderFlagHtml = "<div class='sliderFlag' id='sm_sf_"+thisSize+"'";
	sliderFlagHtml += " style='width: "+sliderPos(fitValue, 0)+"px'>";
	sliderFlagHtml += "<a class='flagItself "+fitLabel+"' href='#'>"+thisSize+"</a>";
	sliderFlagHtml += "</div>";
	$(".slider_container").append(sliderFlagHtml);
	$(".sm_sf_"+thisSize).hover(function() {
		$(this).toggleClass("activeFlag");
	}).click(function() {
		$(thisId).prop("checked", true);
		$(sizeme_UI_options.sizeSelectionContainer+" label").removeClass('ui-state-active');
		$(thisId).next("label").addClass('ui-state-active');
		moveSlider(fitValue, true);
		return false;
	});
}

function moveSlider(fitValue, shouldAnimate) {
	var newWidth = sliderPos(fitValue, 9);
	if (shouldAnimate) { 
		$('.slider_bar').stop().animate({width: newWidth});
	} else {
		$('.slider_bar').width(newWidth);
	}
}

function moveAreaSlider(fitValue, matchMap, shouldAnimate) {
	var smallestFit = 9999;
	var biggestFit = 0;
    var endX, startX, newWidth, newMarginLeft;
	for(var measurement in matchMap) { 
		if (matchMap.hasOwnProperty(measurement)) {
			if (isImportant(matchMap[measurement].importance, matchMap[measurement].componentFit)) {
				if (matchMap[measurement].componentFit > 0 && matchMap[measurement].componentFit < smallestFit) {
                    smallestFit = matchMap[measurement].componentFit;
                }
				if (matchMap[measurement].componentFit > 0 && matchMap[measurement].componentFit > biggestFit) {
                    biggestFit = matchMap[measurement].componentFit;
                }
			}
		}
	}
	
	if (fitValue > smallestFit) {
		endX = sliderPos(fitValue, 3);
		startX = sliderPos(smallestFit, 3);
		newWidth = (endX - startX);
		newMarginLeft = startX;
	} else {
		endX = sliderPos(biggestFit, 3);
		startX = sliderPos(fitValue, 3);
		newWidth = (endX - startX);
		newMarginLeft = startX;
	}
	
	if (shouldAnimate) { 
		$('.slider_area').stop().animate({width: newWidth, marginLeft: newMarginLeft});
	} else {
		$('.slider_area').width(newWidth).css('marginLeft', newMarginLeft);
	}
}

function goWriteMessages(matchMap, missingMeasurements, accuracy) {
	var $message = "";	
	var $message_type = "";
	
	$(sizeme_UI_options.insertMessages).empty(); 

	var smallestFit = 9999;
	var largestFit = 0;
	
	for(var measurement in matchMap) { 
		if (matchMap.hasOwnProperty(measurement)) {
			if (matchMap[measurement].componentFit > 0) {
				if (matchMap[measurement].componentFit < smallestFit) {
                    smallestFit = matchMap[measurement].componentFit;
                }
				if (matchMap[measurement].componentFit > largestFit) {
                    largestFit = matchMap[measurement].componentFit;
                }
			}
		}
	}
	
	if (missingMeasurements[0]) {
		if (missingMeasurements[0].length > 0) {
			$message_type = "missingMeasurements";
			$message = "Add more measurements to your profile for increased accuracy";
		}
	}
	
	if (accuracy < accuracyThreshold) {
		$message_type = "noMeasurements";
		$message = "Add measurements to your profile for a size recommendation.";
	}
	
	if ($message_type) {
		$('<a></a>')
			.addClass("message_container "+$message_type)
			.text($message)
			.attr("href", linkToSelectedProfile)
			.attr("target", "_blank")
			.appendTo(sizeme_UI_options.insertMessages);
	}
}

function selectToButtons(element) {
	$(element+" select").hide();
	var numClass = "num_"+$(element+" option").length;
	var $content = $(document.createElement("div")).addClass("sm-buttonset "+numClass);
	$(element+" option").each(function() {
		var thisId = this.id;
		var thisLabel = sizeText($(this).text());
		var thisClass = $(this).attr("class");
		var thisVal = $(this).val();
		var $div = $('<div>')
			.addClass('sm-button '+thisClass)
			.attr("id", "button_"+thisId)
			.text(thisLabel)
			.on("click", function() {
					$(sizeme_UI_options.sizeSelectionContainer+" .sm-selectable").removeClass("sm-state-active");
					$(".element_for_"+thisVal).addClass("sm-state-active");
					$(sizeme_UI_options.sizeSelectionContainer+" select").val(thisVal);
					$(sizeme_UI_options.sizeSelectionContainer+" select").change();	// yell change
				});
		$content.append($div);
	});
	$(element).append($content);
}

function getMaxY(data) {
    var max = 0;
    for (var i = 0; i < data.coords.length; i++) { max = Math.max(max, data.coords[i].Y); }
    return max;
}

function getMaxX(data) {
    var max = 0;
    for(var i = 0; i < data.coords.length; i++) { max = Math.max(max, data.coords[i].X); }
    return max;
}

function getMinX(data) {
    var min = 99999;
    for(var i = 0; i < data.coords.length; i++) { min = Math.min(min, data.coords[i].X); }
    return min;
}

function getMinY(data) {
    var min = 99999;
    for(var i = 0; i < data.coords.length; i++) { min = Math.min(min, data.coords[i].Y); }
    return min;
}

function getArced(p1, p2) {
	var dX = p2.X - p1.X;
	p2.cp1X = p1.X + Math.round(dX / arcRadius); p2.cp1Y = p1.Y + Math.round(dX / arcRadius);
	p2.cp2X = p2.X - Math.round(dX / arcRadius); p2.cp2Y = p2.Y + Math.round(dX / arcRadius);
	return true;
}

function liftCoords(data) {
	data.nX = 0; data.nY = 0;
	if (data.lift) {
		for(var i = 1; i < data.coords.length; i++) { 	
			var dX = data.coords[i].X - data.coords[i-1].X;  
			var dY = data.coords[i].Y - data.coords[i-1].Y;  
			var angleA = Math.atan2(dY, dX);
			data.nX = Math.sin(angleA) * arrowLift;
			data.nY = -Math.cos(angleA) * arrowLift;
		}
	}
	return true;
}

function getMidPoints(data) {
	var dX = data.coords[1].X - data.coords[0].X;  var dY = data.coords[1].Y - data.coords[0].Y; 
	data.mid = {X: Math.round(dX / 2)+data.coords[0].X, Y: Math.round(dY / 2)+data.coords[0].Y };
	if (data.style === "arc") { data.mid.Y += Math.round(dX / arcRadius * 0.7); }
}

function plotItem(c, data, isArrow, scale, offsetX, offsetY, highlighted) {
	function pX(coord) { 
		return (coord*scale)+offsetX; 
	}
	function pY(coord) { 
		return (coord*scale)+offsetY; 
	}

    var i, j, lcp;

	c.beginPath();

	if (isArrow) {	// ARROW
		c.lineWidth = arrowLineWidth;
		if (highlighted) {
            c.lineWidth = arrowLineWidth + 2;
        }
		liftCoords(data);
		c.moveTo(pX(data.coords[0].X+data.nX), pY(data.coords[0].Y+data.nY));
		for(i = 1; i < data.coords.length; i++) {
			switch (data.style) {
				case "circle":
					getArced(data.coords[i-1], data.coords[i]);
					c.bezierCurveTo(pX(data.coords[i].cp1X+data.nX), pY(data.coords[i].cp1Y+data.nY), 
									pX(data.coords[i].cp2X+data.nX), pY(data.coords[i].cp2Y+data.nY), 
									pX(data.coords[i].X+data.nX), pY(data.coords[i].Y+data.nY));
					c.bezierCurveTo(pX(-data.coords[i].cp1X+data.nX), pY(-data.coords[i].cp1Y+data.nY), 
									pX(-data.coords[i].cp2X+data.nX), pY(-data.coords[i].cp2Y+data.nY), 
									pX(data.coords[0].X+data.nX), pY(data.coords[0].Y+data.nY));									
					break;
				case "arc":
					getArced(data.coords[i-1], data.coords[i]);
                    /* falls through */
				case "line":
					if (typeof data.coords[i].cp1X !== 'undefined') {
						c.bezierCurveTo(pX(data.coords[i].cp1X+data.nX), pY(data.coords[i].cp1Y+data.nY), pX(data.coords[i].cp2X+data.nX), pY(data.coords[i].cp2Y+data.nY), pX(data.coords[i].X+data.nX), pY(data.coords[i].Y+data.nY));
					} else {
						c.lineTo(pX(data.coords[i].X+data.nX), pY(data.coords[i].Y+data.nY));
					}
					break;
			}
		}
		c.stroke();
		
		if (data.style === "line") {
			// start and end circles
			c.beginPath(); c.arc(pX(data.coords[0].X+data.nX), pY(data.coords[0].Y+data.nY), arrowEndRadius, 0, Math.PI*2, true); c.fill();
			c.beginPath(); c.arc(pX(data.coords[data.coords.length-1].X+data.nX), pY(data.coords[data.coords.length-1].Y+data.nY), arrowEndRadius, 0, Math.PI*2, true);	c.fill(); 
		}
		
		// mid circle
		getMidPoints(data);
		if (typeof data.midCircle !== 'undefined') { data.mid.X = data.midCircle.X; data.mid.Y = data.midCircle.Y; }
		var rad = arrowNumberRadius;
		if (highlighted) {
            rad += 5;
        }
		c.beginPath(); c.arc(pX(data.mid.X+data.nX), pY(data.mid.Y+data.nY), rad, 0, Math.PI*2, true); c.fill();
		c.beginPath(); c.fillStyle = "#FFFFFF"; c.font = arrowNumberFont; c.textAlign = "center"; c.textBaseline = "middle";
		if (highlighted) {
            c.font = arrowNumberHighlightFont;
        }
		c.fillText(data.num, pX(data.mid.X+data.nX), pY(data.mid.Y+data.nY));

	} else {	// ITEM
		c.fillStyle = fillColor; c.strokeStyle = fillColor; c.lineWidth = 0.1;
	
		c.moveTo(pX(data.coords[0].X), pY(data.coords[0].Y));
	
		for(i = 1; i < data.coords.length; i++) {
			if (typeof data.coords[i].cp1X !== 'undefined') {
				c.bezierCurveTo(pX(data.coords[i].cp1X), pY(data.coords[i].cp1Y), pX(data.coords[i].cp2X), pY(data.coords[i].cp2Y), pX(data.coords[i].X), pY(data.coords[i].Y));
			} else {
				c.lineTo(pX(data.coords[i].X), pY(data.coords[i].Y));
			}
		}
		
		if (data.mirror) {
			lcp = [{X: null, Y: null}, {X: null, Y: null}];
		
			for(i = data.coords.length-1; i >= 0; i--) {
				if (lcp[0].X) { 
					c.bezierCurveTo(pX(lcp[0].X), pY(lcp[0].Y), pX(lcp[1].X), pY(lcp[1].Y), pX(-data.coords[i].X), pY(data.coords[i].Y));
				} else {
					c.lineTo(pX(-data.coords[i].X), pY(data.coords[i].Y));
				}
				
				if (typeof data.coords[i].cp1X !== 'undefined') { 
					lcp[0].X = -data.coords[i].cp2X; lcp[0].Y = data.coords[i].cp2Y; 
					lcp[1].X = -data.coords[i].cp1X; lcp[1].Y = data.coords[i].cp1Y; 
				} else {
					lcp = [{X: null, Y: null}, {X: null, Y: null}];
				}
			}
		}
		
		c.fill();
		c.stroke();
		
		// accents
		c.fillStyle = drawColor; c.strokeStyle = drawColor; c.lineWidth = itemLineWidth;
		c.lineCap = "butt"; c.lineJoin = "miter"; c.miterLimit = 1;
		
		for(i = 0; i < data.accents.length; i++) {
			c.beginPath();
			if (data.accents[i].type === "circle") {
				c.arc(pX(data.accents[i].coords[0].X), pY(data.accents[i].coords[0].Y), data.accents[i].coords[0].R*realCanvasWidth/1000, 0, Math.PI*2, true);
			} else {
				c.moveTo(pX(data.accents[i].coords[0].X), pY(data.accents[i].coords[0].Y));						
				for(j = 1; j < data.accents[i].coords.length; j++) {
					if (typeof data.accents[i].coords[j].cp1X !== 'undefined') {
						c.bezierCurveTo(pX(data.accents[i].coords[j].cp1X), pY(data.accents[i].coords[j].cp1Y), pX(data.accents[i].coords[j].cp2X), pY(data.accents[i].coords[j].cp2Y), pX(data.accents[i].coords[j].X), pY(data.accents[i].coords[j].Y));
					} else {
						c.lineTo(pX(data.accents[i].coords[j].X), pY(data.accents[i].coords[j].Y));
					}
				}
			}
			if (data.accents[i].type === "area") {
                c.fill();
            }
			c.stroke();
			
			if (data.mirror) {
				if (typeof data.accents[i].noMirror === 'undefined') {
					lcp = [{X: null, Y: null}, {X: null, Y: null}];
					c.beginPath();
					c.moveTo(pX(-data.accents[i].coords[data.accents[i].coords.length-1].X), pY(data.accents[i].coords[data.accents[i].coords.length-1].Y));					
					for(j = data.accents[i].coords.length-1; j >= 0; j--) {
						if (lcp[0].X) { 
							c.bezierCurveTo(pX(lcp[0].X), pY(lcp[0].Y), pX(lcp[1].X), pY(lcp[1].Y), pX(-data.accents[i].coords[j].X), pY(data.accents[i].coords[j].Y));
						} else {
							c.lineTo(pX(-data.accents[i].coords[j].X), pY(data.accents[i].coords[j].Y));
						}
						
						if (typeof data.accents[i].coords[j].cp1X !== 'undefined') { 
							lcp[0].X = -data.accents[i].coords[j].cp2X; lcp[0].Y = data.accents[i].coords[j].cp2Y; 
							lcp[1].X = -data.accents[i].coords[j].cp1X; lcp[1].Y = data.accents[i].coords[j].cp1Y; 
						} else {
							lcp = [{X: null, Y: null}, {X: null, Y: null}];
						}
					}
					if (data.accents[i].type === "area") {
                        c.fill();
                    }
					c.stroke();				
				}
			}		
		} // end for accents 
	}
}

function writeItemCanvas(canvas_id, matchMap, highlight) {

	if (document.getElementById(canvas_id).getContext) {
		var c = document.getElementById(canvas_id).getContext('2d');
		$("#"+canvas_id).attr("width", realCanvasWidth).attr("height", realCanvasHeight);
		
		// get scale and offsets
		var canvasWidth = realCanvasWidth * (1-(2*padding));
		var canvasHeight = realCanvasHeight * (1-(2*padding));
		
		var maxX = getMaxX(item_drawing) - getMinX(item_drawing);
		if (item_drawing.mirror) {
            maxX = getMaxX(item_drawing) * 2;
        }
		var maxY = getMaxY(item_drawing) - getMinY(item_drawing);
		var scale = 1;
		if (maxX !== 0) {
            scale = canvasWidth / maxX;
        }
		if (maxY !== 0 && (canvasWidth/canvasHeight) > (maxX/maxY)) {
            scale = canvasHeight / maxY;
		}
		
		var offsetX = (realCanvasWidth - ((getMaxX(item_drawing) + getMinX(item_drawing)) * scale)) / 2;
		if (item_drawing.mirror) {
            offsetX = realCanvasWidth / 2;
        }
		var offsetY = (realCanvasHeight - ((getMaxY(item_drawing) + getMinY(item_drawing))*scale)) / 2;		
		
		// item
		plotItem(c, item_drawing, false, scale, offsetX, offsetY, false);
		var inputKey = $(sizeme_UI_options.sizeSelectionContainer+" select").val();	
		
		// arrows
		if (matchMap) {
			// Detailed
			product.item.measurements[inputKey].each(function(measurement) {
				if (product.item.measurements[inputKey][measurement] > 0 && measurement_arrows[measurement]) {
					// var draw = (matchMap[measurement].componentFit > 0);
					var draw = true;
					if (draw) {
						c.strokeStyle = measurement_arrows[measurement].color;	
						c.fillStyle = measurement_arrows[measurement].color;			
						plotItem(c, measurement_arrows[measurement], true, scale, offsetX, offsetY, (measurement === highlight && highlight !== null));
					}
				}
			});
		} else {
			// Size Guider
			if (!inputKey) {
                inputKey = Object.keys(product.item.measurements)[0];
            }
			if (inputKey) {
				product.item.measurements[inputKey].each(function(measurement) {
					if (product.item.measurements[inputKey][measurement] > 0 && measurement_arrows[measurement]) {
						c.strokeStyle = measurement_arrows[measurement].color;	
						c.fillStyle = measurement_arrows[measurement].color;			
						plotItem(c, measurement_arrows[measurement], true, scale, offsetX, offsetY, (measurement === highlight && highlight !== null));
					}
				});
			}
		}
	}
}

function initOpentip() {
	Opentip.lastZIndex = 10000;
	Opentip.styles.myDefaultStyle = {
//		target: true,
//		tipJoint: "center top",
		group: "myTips"
	};
	Opentip.defaultStyle = "myDefaultStyle";
}

function hasNeckOpening() {
	var inputKey = $(sizeme_UI_options.sizeSelectionContainer + " select").val();
    if (!inputKey) {
        inputKey = Object.keys(product.item.measurements)[0];
    }
	return product.item.measurements[inputKey].neck_opening_width > 0;
}

function isInside() {
	var itemTypeStr = product.item.itemType.toString();
	return ( (itemTypeStr[0] === '3') || (itemTypeStr[0] === '4') );
}

function writeDetailedWindow(isSizeGuide) {
	// create detailed dialog window
	itemName = product.name;
	var txts = ["Detailed View for", "Detailed view of fit", "Detailed fit - overlaps"];
	var linkTarget = sizeme_UI_options.appendDetailedView;
	
	initOpentip();
	
	if (isSizeGuide) {
		txts = ["Size Guide for", "Size guide", "Actual item measurements"];
		linkTarget = sizeme_UI_options.appendSizeGuide;
	}
	
	var $dialog = $('<div id="sizeme_detailed_view_content"></div>')
		.dialog({
			position: { my: "center", at: "center", of: window },
			autoOpen: false,
			dialogClass: "sizeme_detailed_view_window",
			minHeight: 620,
			minWidth: 940,
			title: txts[0]+' <span class="name">'+itemName+'</span>'
		});
	
	// add toggle link to main page
	$("<a class='a_button sm_detailed_view"+(isSizeGuide ? " size_guide" : "")+"' id='popup_opener' href='#'>"+txts[1]+"</a>")
		.click(function() {
			$dialog.dialog('open');
			return false;
		})
		.appendTo(linkTarget);
			
	// write two columns
	$("<div class='dialog_col' id='col1'></div><div class='dialog_col' id='col2'></div>").appendTo("#sizeme_detailed_view_content");
	
	// add bottom title bar
	$("<div class='sm-bottombar ui-dialog-bottombar'></div>").appendTo("#sizeme_detailed_view_content");
		
	// write item image canvas to first column
	$("<div class='sizeme_detailed_section'></div>")
		//.append("<h2>Fit overview</h2>")
		.append("<canvas id='sizeme_item_view'></canvas>")
		.appendTo("#col1");
	
	// add shopping for selection to second (no cloning)
	if (!isSizeGuide) {
		$("<div class='sizeme_detailed_section'></div>")
			.append("<h2>Shopping for</h2>")
			.append("<div class='shopping_for'></div>")
			.appendTo("#col2");				
		
		// clone buttons to second
		var $clone = $(sizeme_UI_options.sizeSelectionContainer).clone(true, true);
		$clone.find("[id]").each(function() {
			this.id = "clone_"+this.id; 
			$(this).addClass("cloned");
			if (this.name) {
                this.name = "clone_"+this.name;
            }
		});
		$("<div class='sizeme_detailed_section'></div>")
			.append("<h2>Selected size</h2>")
			.append($clone)
			.appendTo("#col2");		

		// clone slider (without detailed view toggler and in content stuff)
		var $slider_clone = $(".sizeme_slider")
			.clone(true, true)
			.find(sizeme_UI_options.appendDetailedView).remove()
			.end();
			
		$("<div class='sizeme_detailed_section'></div>")
			.append("<h2>Overall fit</h2>")
			.append($slider_clone)
			.appendTo("#col2");
	}
		
	// write detailed table to col 2
	$("<div class='sizeme_detailed_section'></div>")
		.append("<h2>"+txts[2]+"</h2>")	
		.append("<table id='detailed_table'><tbody></tbody></table>")
		.appendTo("#col2");
		
	// bind hover event to run_highlights
	$("#detailed_table").on("mouseenter", ".run_highlight", function () {
		var highlight = $(this).data("measurement");
        $(this).find("td.cell_"+highlight).addClass("highlighted");
		var $matchMap = $(this).find("tbody").data("matchMap");
		writeItemCanvas('sizeme_item_view', $matchMap, highlight);	
		if (sizeme_local_options.fitAreaSlider && $matchMap) {
			if ($matchMap[highlight]) {
				if (($matchMap[highlight].componentFit > 0) && (isImportant($matchMap[highlight].importance, $matchMap[highlight].componentFit))) {
					drawExtraSlider($matchMap[highlight].componentFit);
				}
			}
		}
	}).on("mouseleave", ".run_highlight", function () {
		var highlight = $(this).data("measurement");
        $(this).find("td.cell_"+highlight).removeClass("highlighted");
		writeItemCanvas('sizeme_item_view', $(this).find("tbody").data("matchMap"), "");
		if (sizeme_local_options.fitAreaSlider) {
            killExtraSlider();
        }
	});
	
	// disclaimers
	if (isSizeGuide) {
		var $txt = "These measurements are measured <u>flat across the outside of the item</u>.";
		if (hasNeckOpening()) {
            $txt += "<br />Except for the collar measurement, which is measured around the inside of the collar.";
        }
		if (isInside()) {
            $txt = "These measurements are measured <u>inside the item</u>.";
        }
		$("<div class='sizeme_explanation'></div>")
			.append("<p>"+$txt+"</p>")
			.appendTo("#col2");			
		
		if (sizeme_options.service_status === "on") {
			$("<div class='sizeme_advertisement'></div>")
				.append("<p>This size guide is brought to you by <span id='sizeme_ad_link' class='logo' target='_blank'></span></p>")
				.appendTo("#sizeme_detailed_view_content");	
			$("#sizeme_ad_link").on("click", function() {
				eraseCookie("sizeme_no_thanks");
				$(".splash").fadeIn();
				return false;
			});
		}
	}
}

function isImportant(importance, componentFit) {
	return (importance === 1 || ((importance === -1) && (componentFit < 1000)));
}

function colorCell($cell, value, arrow) {
	if (arrow) {
        arrow.color = arrowColorInfo;
    }
	if (value) {
		var selectedFit = getFit(value.componentFit);
		if (isImportant(value.importance, value.componentFit)) {
			$cell.addClass(selectedFit.text);
			if (arrow) {
                arrow.color = selectedFit.arrowColor;
            }
		}
	}
	return $cell;
}

function inMissingMeasurements(missingMeasurements, measurement) {
	for(var $i = 0; $i < missingMeasurements.length; $i++) { 
		if (missingMeasurements[$i][0] === measurement) {
            return true;
        }
	}
	return false;
}

function isPinched(measurement) { return (PINCHED_FITS.indexOf(measurement) >= 0); }
function isLongFit(measurement) { return (LONG_FITS.indexOf(measurement) >= 0); }

function isPinchedTxt(measurement) {
	if (isPinched(measurement)) {
        return " when pinched";
    }
	return "";
}

function getStretchedTxt(stretch_value) {
	if (stretch_value > 0) {
		if (stretch_value < 25) {
			return "The item is stretched a little.  ";
		} else if (stretch_value < 75) {
			return "The item is stretched.  ";
		} else if (stretch_value < 95) {
			return "The item is stretched a lot.  ";
		} else {
			return "The item is stretched to the max.  ";
		}
	}
	return "";
}


function updateDetailedTable(matchMap, inputKey, missingMeasurements) {
	var $table = $("#detailed_table").find("tbody"),
        $row, $i, $cell, $tip, $txt;
	$table.empty();
	if (matchMap) {
		// *** Detailed View ***
		$table.data("matchMap", matchMap);

		$row = $(document.createElement("tr")).addClass("header_row");
		$i = 0;
		product.item.measurements[inputKey].each(function(measurement) {
			if (product.item.measurements[inputKey][measurement] > 0) {
				var $txt = '<span class="num">'+(++$i)+'</span>'+LOCALIZED_STR[measurement];
				if (measurement_arrows[measurement]) {
                    measurement_arrows[measurement].num = $i;
                }
				$row.append($(document.createElement("td")).html($txt).addClass("run_highlight cell_"+measurement).data("measurement", measurement)); 
			}
		});
		$table.append($row);		
		
		var $tip_txts = [];
		if (sizeme_local_options.writeOverlaps) {
			$row = $(document.createElement("tr")).addClass("data_row");
			product.item.measurements[inputKey].each(function(measurement) {
				var drawReason = 0;
				if (matchMap[measurement] && matchMap[measurement].componentFit > 0) {
                    drawReason = 1;
				}
				if (product.item.measurements[inputKey][measurement] > 0) {
                    drawReason = 2;
                }
				if (drawReason > 0) {
					var $txt = "";
					$tip_txts[measurement] = "The item's "+LOCALIZED_STR[measurement].toLowerCase()+" measurement ";
					
					if (matchMap[measurement]) {
						$txt = (matchMap[measurement].overlap/10).toFixed(1)+" cm";
						if (isPinched(measurement)) {
                            $txt = (matchMap[measurement].overlap/20).toFixed(1)+" cm";
                        }
						if ((matchMap[measurement].overlap <= 0) && (matchMap[measurement].componentFit >= 1000)) {
                            $txt = "0.0 cm";
                        }
						
						if (measurement === "sleeve") {
							var $sleeve_txt = "<div class='sleeve" + (matchMap[measurement].overlap < 0 ? " negative_overlap" : "") + "'>";
							var $sleeve_height = Math.round(29 + (75*(matchMap[measurement].percentage / 0.3)));	// zero-point + (wrist_to_finger * (overlap_percentage / normal_finger_ratio))
							$sleeve_height = Math.max(11, $sleeve_height);	// never under 11 (34 px)
							$sleeve_height = Math.min(105, $sleeve_height);	// never over overlap image height							
							
							var $meas_top = Math.round((($sleeve_height - 29) / 2)+29-9);
							if (($sleeve_height - 29) < 14) { // no fit in middle if no room
                                $meas_top = $sleeve_height+23;
                            }
							if (matchMap[measurement].overlap < 0) {
								$sleeve_txt += "<div class='meas' style='top:14px;left:-7px;'>"+$txt+"</div>";	// negative overlap in different place
								if (matchMap[measurement].componentFit >= 1000) {
                                    $sleeve_height = 29;
                                }
							} else {
								$sleeve_txt += "<div class='meas' style='top:"+$meas_top+"px;";
								if (matchMap[measurement].overlap >= 100) {
                                    $sleeve_txt += "left:-4px;";
                                }
								$sleeve_txt += "'>"+$txt+"</div>";	// mid point? 
							}
							
							$sleeve_txt += "<div class='sleeve_overlap' style='height:"+($sleeve_height+23)+"px;'></div>";	// sleeve + image bottom clearance
							$sleeve_txt += "</div>";
							$tip_txts[measurement] = $sleeve_txt + $tip_txts[measurement];
						}
						
						if (matchMap[measurement].overlap <= 0) {
							if (matchMap[measurement].componentFit >= 1000) {
								$txt = "0.0 cm";
								$tip_txts[measurement] += "is directly on you with no overlap.  ";
								$tip_txts[measurement] += getStretchedTxt(matchMap[measurement].componentStretch);
							} else {
								$tip_txts[measurement] += "is <u>smaller</u> than your matching measurement by ";
								$tip_txts[measurement] += $txt.replace("-","");
								$tip_txts[measurement] += isPinchedTxt(measurement)+".  ";
							}
						} else {
							if (isPinched(measurement)) {
								$tip_txts[measurement] = "<div class='pinched'><div class='meas'>"+$txt+"</div></div>" + $tip_txts[measurement];
							}
							
							$txt = "+"+$txt;
							$tip_txts[measurement] += "overlaps you by <b>"+$txt+"</b>"+isPinchedTxt(measurement);
							if (measurement === "sleeve") {
                                $tip_txts[measurement] += " when your arm and the item's sleeve are <u>completely straight</u>";
                            }
							$tip_txts[measurement] += ".  ";
						}
						
						if ((matchMap[measurement].componentFit > 0) && (isImportant(matchMap[measurement].importance, matchMap[measurement].componentFit))) {
							var $fitVerdict = LOCALIZED_STR[getFit(matchMap[measurement].componentFit).text];
							if (isLongFit(measurement)) {
                                $fitVerdict = LOCALIZED_STR_longs[getFit(matchMap[measurement].componentFit).text];
                            }
							$tip_txts[measurement] += "SizeMe considers this particular fit <b>"+$fitVerdict.toLowerCase()+"</b>.";
						}
						
					} else if (product.item.measurements[inputKey][measurement] > 0) {
						$txt = (product.item.measurements[inputKey][measurement]/10).toFixed(1)+" cm";
						$tip_txts[measurement] += "is "+$txt+".  ";
						if (missingMeasurements) {
							if (inMissingMeasurements(missingMeasurements, measurement)) {
								$tip_txts[measurement] += "Add this measurement to your profile to include it in the fit calculation.";
							}
						}
					}
					
					var $cell = $(document.createElement("td"))
								.text($txt)
								.attr("id","overlap_"+measurement)
								.addClass("run_highlight cell_"+measurement)
								.data("measurement", measurement); 
					$row.append(colorCell($cell, matchMap[measurement], measurement_arrows[measurement]));
					var $tipClassName = "";
					if (isPinched(measurement)) {
                        $tipClassName = "isPinched";
                    }
					if (measurement === "sleeve") {
                        $tipClassName = "sleeve";
                    }
					$tip = new Opentip($cell, $tip_txts[measurement], { className: $tipClassName } );
				}
			});
			$table.append($row);		
		}

		$row = $(document.createElement("tr")).addClass("data_row fit_label_row");
		product.item.measurements[inputKey].each(function(measurement, value) { 
			if (matchMap[measurement]) {
				if (matchMap[measurement].componentFit > 0) {
					$txt = LOCALIZED_STR[getFit(matchMap[measurement].componentFit).text];
					if (isLongFit(measurement)) {
                        $txt = LOCALIZED_STR_longs[getFit(matchMap[measurement].componentFit).text];
                    }
					$cell = $(document.createElement("td"))
								.html('<div>'+$txt+'</div>')
								.addClass("run_highlight")
								.data("measurement", measurement); 
					if (!isImportant(matchMap[measurement].importance, matchMap[measurement].componentFit)) {
						$cell.html("").addClass("info");
					}
					$row.append(colorCell($cell, matchMap[measurement], measurement_arrows[measurement]));
				} else if (product.item.measurements[inputKey][measurement] > 0) {
					$txt = "";
					$cell = $(document.createElement("td"))
								.html($txt)
								.addClass("info run_highlight cell_"+measurement)
								.data("measurement", measurement);
					$row.append($cell);
				}
			} else if (product.item.measurements[inputKey][measurement] > 0) {
				$txt = "";
				var $class = "";
				if (missingMeasurements) {
					if (inMissingMeasurements(missingMeasurements, measurement)) { 
						$txt = "<a target='_blank' href='"+linkToSelectedProfile+"&measurement="+measurement+"'>Add to profile</a>"; 
						$class = " add"; 
					}
				}
				$cell = $(document.createElement("td"))
							.html($txt)
							.addClass("info run_highlight cell_"+measurement+$class)
							.data("measurement", measurement);
				$row.append($cell);
			}
			if ($cell) {
                $tip = new Opentip($cell, $tip_txts[measurement]);
            }
		});
		$table.append($row);
		
	} else {
		// *** Size Guide ***
		$row = $(document.createElement("tr")).addClass("header_row");
		$i = 0;
		var $first = Object.keys(product.item.measurements)[0],
            $j, measurement;
		$row.append($(document.createElement("td")).html("Size").addClass("size_column")); 
		for ($j = 0; $j < FIT_ORDER.length; $j++) {
			measurement = FIT_ORDER[$j];
			if (product.item.measurements[$first][measurement] > 0) {
				$txt = '<span class="num">'+(++$i)+'</span>'+LOCALIZED_STR[measurement];
				if (measurement_arrows[measurement]) {
                    measurement_arrows[measurement].num = $i;
                }
				$row.append($(document.createElement("td")).html($txt).addClass("run_highlight cell_"+measurement).data("measurement", measurement)); 
			}
		}
		$table.append($row);
		
		for ($i=0;$i<sizeKeys.length;$i++) {
			var key = sizeKeys[$i].key;

			var $class = "data_row";			
			if (key === inputKey) {
                $class += " active";
            }
			
			$row = $(document.createElement("tr")).addClass($class);
			
			$row.append($(document.createElement("td")).html(sizeText(sizeKeys[$i].sizeLabel)).addClass("size_column")); 
			for ($j = 0; $j < FIT_ORDER.length; $j++) {
				measurement = FIT_ORDER[$j];
				if (product.item.measurements[key][measurement] > 0) {
					$txt = (product.item.measurements[key][measurement]/10).toFixed(1);
					$cell = $(document.createElement("td")).text($txt+" cm").addClass("run_highlight cell_"+measurement).data("measurement", measurement);
					$row.append(colorCell($cell, "", measurement_arrows[measurement]));
				}
			}
			$table.append($row);						
		}
	}

	writeItemCanvas('sizeme_item_view', matchMap, "");		

}

function updateDetailedSliderTip(thisSize, thisFit) {
	// tip for overall slider in detailed
	var $trigger = $("#sizeme_detailed_view_content").find(".slider_container");
	var $tip_txt = "The overall fit for <b>size "+sizeText(thisSize)+"</b>";
	$tip_txt += " is <b>"+LOCALIZED_STR[getFit(thisFit).text].toLowerCase()+"</b>";
	var $tip = new Opentip($trigger, $tip_txt);
}

function updateSlider(thisSize, thisData, isRecommended, detailedContainer, animateSlider) {
	var thisFit = thisData.totalFit;
	var thisLabel = thisData.fitRangeLabel;
	var matchMap = thisData.matchMap;
	moveSlider(thisFit, animateSlider);
	if (sizeme_local_options.fitAreaSlider) {
        moveAreaSlider(thisFit, matchMap, animateSlider);
    }
	if (sizeme_local_options.writeMessages) {
        goWriteMessages(matchMap, thisData.missingMeasurements, thisData.accuracy);
    }
	updateDetailedSliderTip(thisSize, thisFit);
	updateDetailedTable(matchMap, thisData.inputKey, thisData.missingMeasurements);
}

function getStandardHeader() {
	// *** SizeMe Header injection
    var headerHtml = "<div id='sizeme_header' class='" + sizeme_options.banner_location + "'>";
	headerHtml += "<div id='logo'></div>";
	headerHtml += "<div class='sizeme_header_content'>";
    headerHtml += "<div class='shopping_for'>Fetching profiles...</div>";
    headerHtml += "<div class='top_right'>";
 	headerHtml += "<div id='log_info'><span id='logged_in'></span></div>";
    headerHtml += "</div>";
	headerHtml += "</div>";
	return headerHtml; 	 
}

function getHeaderToggler() {
	// *** SizeMe Header toggler
    var headerHtml = "<div id='sizeme_header_toggler' class='" + sizeme_options.banner_location + "'>";
    headerHtml += "</div>";
	return headerHtml; 	 
}

function getSplashHeader() {
	// *** SizeMe Splash #1 injection (banner)
	var headerHtml = "<div id='sizeme_header' class='splash'>";
	headerHtml += "<div id='logo'></div>";
    headerHtml += "<div class='splash_text'>";
	headerHtml += "<h1>This store uses SizeMe&trade;</h1>";
	headerHtml += "<p>SizeMe is a service which helps you find your right clothes size each and every time. ";
	headerHtml += "It's easy to use and 100% free.</p>";
	headerHtml += "<p><a id='sizeme_btn_find_out_more' href='#'>Find out more about SizeMe</a></p>";
 	headerHtml += "</div>";
	headerHtml += "<div class='splash_choices'><table>";
	headerHtml += "<tr class='sign_in'><td><p>Yes, I'd like to create a free account</p></td><td><a href='http://www.sizeme.com/login.html' target='_blank' class='a_button' id='sizeme_btn_sign_up'>Sign up</a></td></tr>";	
	headerHtml += "<tr class='log_in'><td><p>I already have an account</p></td><td><a href='#' class='a_button' id='sizeme_btn_login'>Log in</a></td></tr>";
	headerHtml += "<tr class='no_thanks'><td><p>I'm not interested in this right now</p></td><td><a href='#' class='a_button' id='sizeme_btn_no_thanks'>No thanks</a></td></tr>";
    headerHtml += "</table></div>";
	return headerHtml; 	 
}

function getSplashDetailed() {
	// *** SizeMe Splash #2 injection (detailed)
	var headerHtml = "<div id='sizeme_detailed_splash' class='splash'>";
    headerHtml += "<p class='splash_text'>";
	headerHtml += "Take a few <b>measurements of yourself</b> and get personalized info on how this item would <b>fit you</b>.  ";
	//headerHtml += "It's called SizeMe and it's free and really easy to use.";
	headerHtml += "Create your <b>SizeMe</b> profile and relax!";
	headerHtml += "</p>";
	headerHtml += "<ul class='splash_choices'>";
	headerHtml += "<li class='sign_in'><a href='http://www.sizeme.com/login.html' target='_blank' class='a_button' id='sizeme_btn_sign_up'>Sign up</a><p>Yes, I'd like to create a free account</p></li>";	
	headerHtml += "<li class='log_in'><a href='#' class='a_button' id='sizeme_btn_login'>Log in</a><p>I already have an account</p></li>";
	headerHtml += "<li class='no_thanks'><td><a href='#' class='a_button' id='sizeme_btn_no_thanks'>No thanks</a><p>Maybe later</p></li>";
    headerHtml += "</ul></div>";
	return headerHtml; 	 
}

function findMaxMeasurement() {
	var maxVal = 0;
	product.item.measurements.each(function(key, measurement_set) {
		product.item.measurements[key].each(function(key_2, value) { maxVal = Math.max(value, maxVal); });
	});
	return maxVal;
}

// Load on ready for all pages
$(document).ready(function() {

	var systemsGo = true;
	var firstRecommendation = true;
	
	// check data
	if (typeof product === 'undefined') {
		systemsGo = false;
	} else if (product.item.itemType === 0) {
		systemsGo = false;	
	} else if (findMaxMeasurement() === 0) {
		systemsGo = false;
	}
	
	if (systemsGo) {
        loadArrows(false); // everyone needs arrows
    }

	//stuff we do anyway
	addIds(sizeme_UI_options.sizeSelectionContainer);

	// buttonize
	if (sizeme_options.buttonize === "yes") {
		selectToButtons(sizeme_UI_options.sizeSelectionContainer);
		$(sizeme_UI_options.sizeSelectionContainer+" #button_choose").remove();	
	}

	var getMatchResponseHandler = function(prodId, product) {
		if (!systemsGo) {
            return function() {};
        }
		return function(responseMap) {
			var smallestOffset = 9999,  // for recommendation
                thisVal, thisId, thisData, thisSize;
			$(sizeme_UI_options.sizeSelectionContainer+" .sm-fit_label").remove();
			
			responseMap.each(function(key, result) {
				var classKey = ".element_for_" + key;
				$(classKey)
					.removeClass('sm-too_small sm-slim sm-regular sm-loose sm-very_loose sm-huge sm-too_big')
					.addClass('sm-'+result.fitRangeLabel);

				// Analyze fit for recommendations
				var fitOffset = Math.abs(result.totalFit - OPTIMAL_FIT);
				if (fitOffset < smallestOffset) {
					smallestOffset = fitOffset;
					recommendedId = key;
					recommendedLabel = result.fitRangeLabel;
				}
				
				// check if there are results in the first place
				if (result.accuracy < accuracyThreshold) {
					$('.slider_bar, .slider_area').hide();
				} else {
					$('.slider_bar, .slider_area').show();
				}

				// write data to inputs
				$("#input_" + key).data("fitData", { totalFit: result.totalFit, 
													 fitRangeLabel: result.fitRangeLabel, 
													 matchMap: result.matchMap, 
													 missingMeasurements: result.missingMeasurements, 
													 accuracy: result.accuracy, 
													 inputKey: key });
			});
			
			// bind change to inputs
			$(sizeme_UI_options.sizeSelectionContainer+" select").change(function() {
				thisVal = $(this).val();
				thisId = '#input_'+thisVal;
				thisData = $(thisId).data("fitData");
				thisSize = $(thisId).text();
				if (thisVal) {
                    updateSlider(thisSize, thisData, (thisVal === recommendedId), sizeme_UI_options.detailedViewContainer, true);
                }
				// relay change to cloned and vice versa
				$(sizeme_UI_options.sizeSelectionContainer+" select").val(thisVal);
			});

			// remove existing recommendation
			$(sizeme_UI_options.sizeSelectionContainer+" .sm-selectable").removeClass('sm-recommended');
			
			// set selection to recommendation on first match
			if (firstRecommendation) {
				// select recommended
				$(sizeme_UI_options.sizeSelectionContainer+" select").val(recommendedId);
				// remove existing active
				$(sizeme_UI_options.sizeSelectionContainer+" .sm-selectable").removeClass('sm-state-active');
				// add class
				$(".element_for_" + recommendedId).addClass('sm-recommended sm-state-active');
                var recommendedInput = $("#input_" + recommendedId);
				if (recommendedInput.data("fitData")) {
					thisData = recommendedInput.data("fitData");
					thisSize = recommendedInput.text();
					updateSlider(thisSize, thisData, true, sizeme_UI_options.detailedViewContainer, true);
				}
				firstRecommendation = false;
			} else {
				thisId = '#input_'+$(sizeme_UI_options.sizeSelectionContainer+" select").val();
				if ($(thisId).data("fitData")) {
					thisData = $(thisId).data("fitData");
					thisSize = $(thisId).text();
					updateSlider(thisSize, thisData, true, sizeme_UI_options.detailedViewContainer, true);
				}				
			}
		};
	// end of function 	getMatchResponseHandler		
	};	
	
	var doProfileChange = function(newValue) {
		selectedProfile = newValue;
		linkToSelectedProfile = "http://www.sizeme.com/profile.html?id="+selectedProfile;
		$(".profileSelect").attr("value", selectedProfile);
		createCookie("sizeme_profileId", selectedProfile, cookieLifetime);
		$('#logged_in_link').attr("href", linkToSelectedProfile);
				
		if (typeof product !== 'undefined') {
			var prodId = null;
			sizeMe.match(new SizeMe.FitRequest(selectedProfile, product.item), getMatchResponseHandler(prodId, product));
		}
	// end of function  doProfileChange
	};
	
	var loggedInCb = function(username) {
		eraseCookie("sizeme_no_thanks");
		
		// remove existing (if exists)
		$("#sizeme_header").remove();
		$("#popup_opener").remove();
		$("#sizeme_detailed_view_content").dialog("destroy").remove();
		
		$(sizeme_UI_options.appendSliderTo).append(getSliderHtml(systemsGo));
		
		if (systemsGo) {
			writeDetailedWindow(false);
			moveSlider(OPTIMAL_FIT, false);
		}
		
		// Prepend header to body
		if (sizeme_options.banner_location === "in_content") {
			var $new = "<div id='sizeme_header_container'>"+getStandardHeader()+"</div>";
			$(sizeme_UI_options.appendInContentToggler).append($new);
			$("#sizeme_header.in_content").find("#logo").on("click", function() {
				$("#sizeme_header.in_content").toggleClass("opened");
			});
		} else {
			$(sizeme_UI_options.prependTopHeaderTo).prepend(getStandardHeader());	
		}
		
		// *** SizeMe Magic
		sizeMe.fetchProfilesForAccount(function(profileList) {
			var cookieProfile = readCookie("sizeme_profileId");
//			var selectedProfile = null;
			var activeProfile = null;
			$.each(profileList, function() {
				activeProfile = this.profileId;
				if (activeProfile === cookieProfile) {
					selectedProfile = activeProfile;
					return false;
				}
			});
			if (!selectedProfile) {
                selectedProfile = activeProfile;
            }
			
			var $i = 0;
			$(".shopping_for").empty().
				html("<span class='shopping_for_text'>Shopping for: </span>").
				append(function() {
					var select = document.createElement("select");
					select.className = "profileSelect";
					select.id = "id_profileSelect_" + (++$i);
					return select;
				});		
			$.each(profileList, function() {
				$("<option>").appendTo(".profileSelect")
					.attr("value", this.profileId)
					.text(this.profileName);
			});
            $('#logged_in').html("<a id='logged_in_link' href='#' target='_blank'>My Profiles</a>");
			$('.profileSelect')
                .attr("value", selectedProfile)
                .change(function() {
				    doProfileChange(this.value);
			    });
			
			// Yell change
			doProfileChange(selectedProfile);
		});
		
		$("#logout").click(function() { sizeMe.logout(loggedOutCb); });
		
	// end of function 	loggedInCb
	};
	
	var loggedOutCb = function() {
		// show splash introduction banner
		// remove sizeme functionality from store (if exists)
		$("#sizeme_header").remove();
        $(sizeme_UI_options.sizeSelectionContainer).children(sizeme_UI_options.visualSelectionElement).removeClass('sm_too_small sm_slim sm_regular sm_loose sm_very_loose sm_huge sm_too_big sm_recommended');
        $(sizeme_UI_options.sizeSelectionContainer).children(sizeme_UI_options.actualSelectionElement).removeClass('sm_too_small sm_slim sm_regular sm_loose sm_very_loose sm_huge sm_too_big sm_recommended');
        $("#popup_opener").remove();
        $("#sizeme_detailed_view_content").dialog("destroy").remove();
        $(".sizeme_slider").remove();
		
		if (systemsGo) {
            loadArrows(true);
        }

		// Size Guide for non-loving users
		if (systemsGo) {
			writeDetailedWindow(true);
			updateDetailedTable();
			// bind change to select
			$(sizeme_UI_options.sizeSelectionContainer+" select").change(function() {
				var thisVal = $(this).val();
				// relay change to cloned and vice versa
				$(sizeme_UI_options.sizeSelectionContainer+" select").val(thisVal);
				updateDetailedTable("", thisVal);
			});
		}
		
		if (sizeme_options.service_status === "on") {
            var splashContent;
			// Add splash content somewhere
			if (sizeme_options.banner_location === "in_content") {
				splashContent = getSplashDetailed();
				if (readCookie("sizeme_no_thanks") === 1) {
                    splashContent = $(splashContent).hide();
                }
				$("#sizeme_detailed_view_content").append(splashContent);
			} else {
				splashContent = getSplashHeader();
				if (readCookie("sizeme_no_thanks") === 1) {
                    splashContent = $(splashContent).hide();
                }
				$(sizeme_UI_options.prependTopHeaderTo).prepend(splashContent);	
			}
	
			// login button
			$("#sizeme_btn_login").on("click", function() {
				sizeMe.openLoginFrame(function(username) {
					loggedInCb(username);
				});						
				return false;			
			});							
			
			// no thanks button
			$("#sizeme_btn_no_thanks").on("click", function() {
				createCookie("sizeme_no_thanks", 1, cookieLifetime);
				$(".splash").hide();
				if (sizeme_options.banner_location !== "in_content") {
					$("#sizeme_header").slideToggle('slow', function() {
						//$(this).remove();
					});
				}
				return false;
			});
		} 		
		
	// end of function 	loggedOutCb				 
	};
	
	var sizeMe = new SizeMe();
	sizeMe.checkLoggedInStatus(loggedInCb, loggedOutCb);
	     
   // *** End   
}); 

// Cookie functions

function createCookie(name,value,days) {
    var expires;
	if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			expires = "; expires="+date.toGMTString();
	}
	else {
        expires = "";
    }
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)===' ') {
                c = c.substring(1,c.length);
            }
			if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length,c.length);
            }
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

})(jQuery);

/* globals jQuery: false */

var sizeme_UI_options = {
    prependTopHeaderTo: "body",
    appendInContentToggler: ".slider_text_below",
    actualSelectionElement: "option",
    visualSelectionElement: "div.sm-button",
    appendSliderTo: ".product-options-bottom",
    sizeSelectionContainer: ".product-box",
    afterDetailedLinkTo: ".product-options label.required",
    afterRemorseBoxTo: ".footer address",
    appendDetailedView: ".slider_text_below",
    insertMessages: ".slider_text_more_below",
    appendSizeGuide: "#detail"
};

jQuery.noConflict(true);