/**
 * theme822 javascript core
 *
 * - Provides frequently used extensions to base javascript objects
 * - jQuery browser detection tweak
 * - Define functions used in events
 */

// Add String.trim() method
String.prototype.trim = function(){
	return this.replace(/\s+$/, '').replace(/^\s+/, '');
}

// Add Array.indexOf() method
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (obj, fromIndex) {
    if (fromIndex == null) {
      fromIndex = 0;
    } else if (fromIndex < 0) {
      fromIndex = Math.max(0, this.length + fromIndex);
    }
    for (var i = fromIndex, j = this.length; i < j; i++) {
      if (this[i] === obj){
        return i;
      }
    }
    return -1;
  };
}

// jQuery Browser Detect Tweak For IE7
jQuery.browser.version = jQuery.browser.msie && parseInt(jQuery.browser.version) == 6 && window["XMLHttpRequest"] ? "7.0" : jQuery.browser.version;

// Console.log wrapper to avoid errors when firebug is not present
// usage: log('inside coolFunc',this,arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function() {
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if (this.console) {
    console.log(Array.prototype.slice.call(arguments));
  }
};

// init object
var theme822 = theme822 || {};

/**
 * Image handling functions
 */
theme822.image = { _cache : [] };

// preload images
theme822.image.preload = function() {
  for (var i = arguments.length; i--;) {
    var cacheImage = document.createElement('img');
    cacheImage.src = arguments[i];
    theme822.image._cache.push(cacheImage);
  }
}
;
jQuery(window).bind('load', function() {
	jQuery('.foreground').toggle('slow');
});



jQuery(function(){
	jQuery('.isotope-element .views-field-field-portfolio-image a').hover(function(){
		jQuery(this).find('img').stop().animate({opacity:'.4'})
	},

	function(){
		jQuery(this).find('img').stop().animate({opacity:'1'})
	})
});


(function($) {
	jQuery(document).ready(function($) {
		if(jQuery(".portfolio-grid").length){
			var $container = jQuery('#isotope-container'),
				filters = {},
				items_count = jQuery(".isotope-element").size();
			
			$container.imagesLoaded( function(){	
				setColumnWidth();
				$container.isotope({
					itemSelector : '.isotope-element',
					resizable : false,
					transformsEnabled : true,
					layoutMode: 'fitRows'
				});		
			});
			
			function getNumColumns(){
				
				var $folioWrapper = jQuery('#isotope-container').data('cols');
				
				if($folioWrapper == '1col') {
					var winWidth = jQuery("#isotope-container").width();		
					var column = 1;		
					return column;
				}
				
				if($folioWrapper == '2cols') {
					var winWidth = jQuery("#isotope-container").width();		
					var column = 2;		
					if (winWidth<380) column = 1;
					return column;
				}
				
				else if ($folioWrapper == '3cols') {
					var winWidth = jQuery("#isotope-container").width();		
					var column = 3;		
					if (winWidth<380) column = 1;
					else if(winWidth>=380 && winWidth<788)  column = 2;
					else if(winWidth>=788 && winWidth<940)  column = 3;
					else if(winWidth>=940) column = 3;
					return column;
				}
				
				else if ($folioWrapper == '4cols') {
					var winWidth = jQuery("#isotope-container").width();		
					var column = 4;		
					if (winWidth<380) column = 1;
					else if(winWidth>=380 && winWidth<788)  column = 2;
					else if(winWidth>=788 && winWidth<940)  column = 3;
					else if(winWidth>=940) column = 4;		
					return column;
				}
			}
			
			function setColumnWidth(){
				var columns = getNumColumns();		
			
				var containerWidth = jQuery("#isotope-container").width();		
				var postWidth = containerWidth/columns;
				postWidth = Math.floor(postWidth);
		 		
				jQuery(".isotope-element").each(function(index){
					jQuery(this).css({"width":postWidth+"px"});				
				});
			}
				
			function arrange(){
				setColumnWidth();		
				$container.isotope('reLayout');	
			}
				
			jQuery(window).on("debouncedresize", function( event ) {	
				arrange();		
			});
		
		
		
 		};
	});
})(jQuery)
;
/*
 * debouncedresize: special jQuery event that happens once after a window resize
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery-smartresize
 *
 * Copyright 2012 @louis_remi
 * Licensed under the MIT license.
 *
 * This saved you an hour of work? 
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 */
(function($) {

var $event = $.event,
	$special,
	resizeTimeout;

$special = $event.special.debouncedresize = {
	setup: function() {
		$( this ).on( "resize", $special.handler );
	},
	teardown: function() {
		$( this ).off( "resize", $special.handler );
	},
	handler: function( event, execAsap ) {
		// Save the context
		var context = this,
			args = arguments,
			dispatch = function() {
				// set correct event type
				event.type = "debouncedresize";
				$event.dispatch.apply( context, args );
			};

		if ( resizeTimeout ) {
			clearTimeout( resizeTimeout );
		}

		execAsap ?
			dispatch() :
			resizeTimeout = setTimeout( dispatch, $special.threshold );
	},
	threshold: 150
};

})(jQuery);;
/**
 * jQuery Mobile Menu 
 * Turn unordered list menu into dropdown select menu
 * version 1.0(31-OCT-2011)
 * 
 * Built on top of the jQuery library
 *   http://jquery.com
 * 
 * Documentation
 *   http://github.com/mambows/mobilemenu
 */
(function($){
$.fn.mobileMenu = function(options) {
 
 var defaults = {
   defaultText: 'Navigate to...',
   className: 'select-menu',
   subMenuClass: 'sub-menu',
   subMenuDash: '&ndash;'
  },
  settings = $.extend( defaults, options ),
  el = $(this);
 
 this.each(function(){
  // ad class to submenu list
  el.find('ul').addClass(settings.subMenuClass);

  // Create base menu
  $('<select />',{
   'class' : settings.className
  }).insertAfter( el );

  // Create default option
  $('<option />', {
   "value"  : '#',
   "text"  : settings.defaultText
  }).appendTo( '.' + settings.className );

  // Create select option from menu
  el.find('a,.separator').each(function(){
   var $this  = $(this),
     optText = $this.text(),
     optSub = $this.parents( '.' + settings.subMenuClass ),
     len   = optSub.length,
     dash;
   
   // if menu has sub menu
   if( $this.parents('ul').hasClass( settings.subMenuClass ) ) {
    dash = Array( len+1 ).join( settings.subMenuDash );
    optText = dash + optText;
   }
   if($this.is('span')){
    // Now build menu and append it
   $('<optgroup />', {
    "label" : optText,
   }).appendTo( '.' + settings.className );
   }
   else{
    // Now build menu and append it
   $('<option />', {
    "value" : this.href,
    "html" : optText,
    "selected" : (this.href == window.location.href)
   }).appendTo( '.' + settings.className );
   }

  }); // End el.find('a').each

  // Change event on select element
  $('.' + settings.className).change(function(){
   var locations = $(this).val();
   if( locations !== '#' ) {
    window.location.href = $(this).val();
   }
  });
  $('.select-menu').show();

 });
 return this;
};
})(jQuery);
jQuery(function(){
   jQuery('#superfish-1').mobileMenu();
  })
;
