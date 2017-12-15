'use strict';

// A wheel-of-fortune spinner component.
//
// +----------------------------------------------------------------+
// | (c)2017 Allen Holub. All rights reserved (http://holub.com).   |
// |                                                                |
// | This code is licensed according to the "Free BSD" license as   |
// | follows:                                                       |
// |                                                                |
// | Redistribution and use in source and binary forms, with or     |
// | without modification, are permitted provided that the          |
// | following Conditions are met:                                  |
// |                                                                |
// | 1. Redistributions of source code must retain the above        |
// |    copyright notice AND URL, this list of conditions and the   |
// |    following disclaimer.                                       |
// |                                                                |
// | 2. Redistributions in binary form must reproduce the above     |
// |    copyright notice, this list of conditions and the           |
// |    following disclaimer in the documentation and/or            |
// |    other materials provided with the distribution.             |
// |                                                                |
// | THIS SOFTWARE IS PROVIDED BY ALLEN HOLUB "AS IS," AND          |
// | ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT          |
// | LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY          |
// | AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.           |
// | IN NO EVENT SHALL ALLEN HOLUB BE LIABLE FOR ANY                |
// | DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR           |
// | CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,          |
// | PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF           |
// | USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)               |
// | HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER         |
// | IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING              |
// | NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE         |
// | USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE                   |
// | POSSIBILITY OF SUCH DAMAGE.                                    |
// +----------------------------------------------------------------+
//
// JQuery is required. Put the following above the script element that calls in
// the current code:
//
// 		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js">
// 		</script>
//
//  All divs that have the class holub-spinner are automatically turned into
//  spinners,  so you rarely have to instantiate this class in javascript.
//  for example:
//
//	<div class="holub-spinner"
//		 img="img/reverseCompassRose.png"
//		 style="width:200px;"
//		 id = "spinnerID"
//		 onComplete="spinCompleted( this.rotation );"
//	 ></div>
//	 
//	 The img= specifies the image to spin, and the image is scaled to the width
//   of the div. The id is optional. The onComplete= code is exected when the
//   spin completes. The code within the onComplete attribute can use 
//   this.rotation to get the rotation amount (degrees clockwise from 12 o'clock;
//   0-359). Use the following everywhere else: 
//
//		var r2 = Number(  $("#spinnerId").attr("rotation")  );
//
//    Note that attr returns a string, thus the Number conversion in this example.
//
// CSS Classes:
//
//	.holub-spinner		All divs that specify this class are treated as spinners.
//						The following attributes on the div are recognized:
//
//			 			img="img/reverseCompassRose.png" 		  // image to spin
//			 			onComplete="spinComplete(this.rotation);" // execute on spin complete.
//
//  .holub-spinner-img					Spinner img element.
//  .holub-spinner-pointer-container 	Holds the pointer div
//	.holub-spinner-pointer				Div that holds the pointer.
//
// The constructor throws Error if no image is specified either here or in
// the target div.
//======================================================================

var holub = holub || {};
holub.Spinner = class Spinner {

	constructor(
		  container,	// If a string, is the  of the div that holds the
						// 		spinner (without the #). Can also be a
						// 		JQuery Element.	The div width controls the
						// 		width of the spinner: the image is scaled
						// 		to fit. eg $(#myDiv)
		  imageURL,		// url of the image (optional if img="" specified
						// in target Div, which takes precedence).
		  onComplete )  // Optional spin-completed callback:
						// 		onComplete(offsetFrom0deg)
	{
		this.rotation = 0;

		// If it's not a jQuery object, turn it into one
		//
		if( !(container instanceof jQuery) )
			container = $("#" + container);

		this.container = container;

		var pointerDiv = $('<div />', {
			"class" : "holub-spinner-pointer-container"
		}).appendTo( container );

		var pointer = $('<div />', {
			"class": "holub-spinner-pointer"
		}).appendTo( pointerDiv );

		// There is a second argument and it's the callback
		// rather than an image
		//
		if( imageURL && jQuery.isFunction(imageURL) ){
			onComplete = imageURL;
			imageURL   = null;
		}

		// If there was a img tag in the div, then use it;
		// otherwise, use the one that was passed into this
		// method.
		//
		var imageURLInDiv = container.attr("img");
		if( imageURLInDiv ) {
			imageURL = imageURLInDiv;
		}

		if( !imageURL )
			throw new Error("No image specified for Spinner)");

		this.imgElement = $('<img />', { //create elements, put inside container
			"class" : "holub-spinner-img holub-spinner-speed",
			"css"   : { "width" : "100%" },
			"src"   : imageURL,
			"click" : ()=>{ this.spin(); } //function(a){...}
		}).appendTo( container );

		this.imgElement.on( 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
						(e)=> {
							onComplete && onComplete.call(this, this.rotation % 360 );
						});
	}

	spin() {
		function getRandomIntBetween(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min ; 
		}

		var newPosition = getRandomIntBetween(0, 360) ;

		this.rotation = ( this.rotation > 720 )	// Make sure it spins one or more times
			? newPosition
			: newPosition + 720
			;

		this.container.attr("rotation", this.rotation % 360);
		
		this.imgElement.removeAttr('-webkit-transform');
		this.imgElement.css       ('-webkit-transform', 'rotate(' + this.rotation + 'deg)' );
		this.imgElement.removeAttr('transform');
		this.imgElement.css       ('transform', 'rotate(' + this.rotation + 'deg)' );
	}
}

// Figure out the segment of the wheel corresponding to the rotation in degrees
// The wheel is assumed to have a segment boundary at 12 o'clock, and for
// equally-spaced segments to be number clockwise, starting at the one to the
// right of the line at 12 o'clock. This is a 'static' method, in the sense
// that you don't need a Spinner object around to call it. Just use:
//  		Spinner.getSegment(...)
//
holub.Spinner.getSegment = 
	function( rotationInDegrees,// as is passed to onComplete function
			  numberOfSegments,	// number of divisions on wheel
			  repeat ) 		    // times the number repeats. For example,
								// the wheel could have 6 segments
								// labeled 1,2,3,1,2,3. The
								// numberOfSegments is 6 and the repeat is 2
								// If there's no repetition, specify 1 or omit;
{
	 if( !repeat ) repeat = 1;
	 rotationInDegrees = 360 - (rotationInDegrees % 360);
	 var maxCount		  = numberOfSegments / repeat;
	 var wedge			  = 360/numberOfSegments;
	 return Math.floor((rotationInDegrees / wedge) % maxCount) + 1;
}

// On load, search the page for divs marked with the holub-spinner class
// and turn them into spinners.
//
$( function() { //replace window.onload with these
	$(".holub-spinner").each( function(index, element) { //might do something like this

		var onCompleteCode = $(element).attr("onComplete");
		var onComplete = onCompleteCode ? new Function(onCompleteCode) : null;
		new holub.Spinner( $(element), $(element).attr("img"), onComplete );
	});
})

// You'll have to comment out the following line if you're testing locally
// without using Browserify to handle exports.
//
// module.exports = holub.Spinner;
