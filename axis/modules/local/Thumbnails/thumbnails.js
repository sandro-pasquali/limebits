/**
 * thumbnailsjs - JavaScript interface to retrieve thumbnails from PageGlimpse.com
 * http://925html.com/code/webpage-thumbnails/
 * 
 * Copyright (c) 2009 Eric Ferraiuolo - http://eric.ferraiuolo.name
 * MIT License - http://www.opensource.org/licenses/mit-license.php
 */

(function(){
	
	/**
	 * Retrieves thumbnails of webpages via the Page Glimpse service
	 * 
	 * @class Thumbnails
	 * @param {Object} config Configuration
	 * @constructor
	 */
	var Thumbnails = function (config) {
		
		// make the constructor an optional factory
		if ( ! (this instanceof arguments.callee) ) {
			return new arguments.callee(config);
		}
		
		/**
		 * Your PageGlimpse API deveoper key. All requests to PageGlimpse service require a devkey.
		 * 
		 * @property devkey
		 * @type String
		 * @default null
		 */
		this.devkey = config.devkey || null;
		
		/**
		 * The size of thumbnail. Available sizes are: small, medium, large.
		 * 
		 * @property size
		 * @type String
		 * @default 'small'
		 */
		this.size = config.size || 'small';
		
		/**
		 * Indicates if the thumbnails for the domain root should be displayed.
		 * The root thumbnail image will only be used if an interior page's thumbnail hasn't been resolved.
		 * 
		 * @property root
		 * @type Boolean
		 * @default true
		 */
		this.root = config.root === false ? false : true;
		
		/**
		 * If the thumbnail for the website is not yet taken, the URL for this property will be used.
		 * If this parameter is not set a PageGlimpse default image will be returned.
		 * 
		 * @property nothumb
		 * @type String
		 * @default null
		 */
		this.nothumb = config.nothumb || null;
		
	};
	
	/**
	 * Base URL of Page Glimpse RESTful HTTP API
	 * 
	 * @property Thumbnails.BASE_URL
	 * @type String
	 * @static
	 */
	Thumbnails.BASE_URL = 'http://images.pageglimpse.com/v1/thumbnails';
	
	Thumbnails.prototype = {
		
		/**
		 * Retrieves the thumbnail for a URL with the current configuration settings
		 * 
		 * @method get
		 * @param {String | Array} url Location of webpage(s)
		 * @param {Function} callback Function to pass the webpage URL and image Node once fully downloaded
		 * @chainable
		 */
		get : function ( url, callback ) {
			
			var urlIsArray = Object.prototype.toString.call(url) === '[object Array]',
				urls, i;
			
			if ( this.devkey && url ) {
				
				urls = urlIsArray ? url : [url];
				for ( i = 0; i < urls.length; i++ ) {
					this._loadImg( urls[i], this._createSrcUrl(urls[i]), callback );
				}
				
			}
			
			return this;
			
		},
		
		/**
		 * Generates the image's src URL by combining the Page Glimpse API base URL with the query-string parameters
		 * 
		 * @method _createSrcUrl
		 * @param {String} url Location of the webpage
		 * @return {String} src URL of the image on Page Glimpse
		 * @protected
		 */
		_createSrcUrl : function (url) {
			
			var queryString = [
			
				'?', 'devkey=', this.devkey,
				'&', 'url=', url,
				'&', 'size=', this.size,
				'&', 'root=', ( this.root ? 'yes' : 'no' ),
				'&', 'nothumb=', ( this.nothumb ? this.nothumb : '' )
				
			].join('');
			
			return Thumbnails.BASE_URL + queryString;
			
		},
		
		/**
		 * Create the image Node and wait until it has fully downloaded before calling the callback function
		 * via Luke Smith (http://lucassmith.name): http://lucassmith.name/2008/11/is-my-image-loaded.html
		 * 
		 * @method _loadImg
		 * @param {String} url Location of the webpage
		 * @param {String} src URL of the image on Page Glimpse
		 * @param {Function} callback Function to pass the webpage URL and image Node once fully downloaded
		 * @protected
		 */
		_loadImg : function ( url, src, callback ) {
			
			var img = new Image(),
				prop = img.naturalWidth ? 'naturalWidth' : 'width';
			
			img.src = src;
			
			if ( callback ) {
				
				if ( img.complete ) {
					callback( url, img[prop] ? img : null );
				} else {
					img.onload = function(){
						callback( url, img );
					};
					img.onerror = function(){
						callback.call( url, null );
					};
				}
				
			}
			
		}
		
	};
	
	$AXIS.Modules.local.Thumbnails.Thumbnails = Thumbnails;
	
})();
