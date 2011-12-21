/**
 * Copyright 2008, 2009 Lime Labs LLC
 * @author Sandro Pasquali (spasquali@gmail.com)
 *
 * This file is part of AXIS.
 *
 * AXIS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * AXIS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with AXIS.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @fileoverview
 *
 * AXIS is the core framework that all other objects register with.  It is
 * inherited as the prototype of any class attached via its #register method.
 * This is an essential library, and nothing will work without it.  It is 
 * expected that the core of your build will be the AXIS supplemented by several
 * registered classes.  
 *
 * The goal of the library is to make the caretaking of large javascript applications
 * easier.  At the most basic level, this involves making it easy to add new code
 * as classes and objects without creating namespace conflicts, and to do so in a way
 * which is natural and easy to follow.  
 *
 * @throws  Error   AXIS_ERR_REG_FAIL
 * @throws  Error   AXIS_INCLUDE_SCRIPT_NO_SRC
 * @throws  Error   AXIS_INCLUDE_CSS_NO_HREF
 */ 

var $AXIS = function()
  {      
    /**
     * Check if this is a combined/minified version of the AXIS library.  The check
     * is for existence of XHR extension.  Loose, but unlikely that the combined
     * AXIS will not have this extension, as it is necessary for most everything.
     */
    this.minFName = (typeof XHR == 'function') ? 'AXIS.combined.js' : 'AXIS.js';
       
    /**
     * Set up environment info
     */
    this.uA =                 window.navigator.userAgent.toLowerCase();
    this.browserVersion =     parseFloat(this.uA.match(/.+(?:rv|it|ml|ra|ie)[\/: ]([\d.]+)/)[1]);
    this.isSafari =           /webkit/.test(this.uA);
    this.isOpera =            /opera/.test(this.uA);
    this.isIE =               /msie/.test(this.uA) && !/opera/.test(this.uA);
    this.isMoz =              /mozilla/.test(this.uA) && !/(compatible|webkit)/.test(this.uA);
    this.isWebKit =           /AppleWebKit/.test(this.uA);
    this.isGecko =            /Gecko/.test(this.uA) && (/KHTML/.test(this.uA) === false);
    this.isKHTML =            /KHTML/.test(this.uA);
    this.isMobileSafari =     !!this.uA.match(/Apple.*Mobile.*Safari/);
    
    this.isMac =              /mac/.test(this.uA);
    this.isWindows =          /win/.test(this.uA);
    this.isLinux =            /linux/.test(this.uA);
    this.isUnix =             /x11/.test(this.uA);
    
    this.isIPhone =           /iPhone/.test(this.uA);
    this.isIPod =             /iPod/.test(this.uA);

    /**
     * The shortcut path to the root directory of system (containing such key folders
     * as /css, /library, /home, libraries/ etc)
     */
    this.ROOT   = function()
      {
        return '/!lime/root/';
      };
      
    /**
     * Returns the path to a given script. 
     *
     * @param    {String}    [s]   The script filename.  Defaults to this.minFName
     * @type     {String}
     * @example: AXIS.PATH('AXIS.js')
     * @see      #initialize
     */
    this.PATH = function(s) {
      var script = s || this.minFName;
      var src = this.getScriptSrc(s);
      if(src) {
        return src.replace(new RegExp(script + ".*"), '');
      }
      
      /**
       * Script not found, path unknown
       */
      return '';
    };

    /**
     * Returns a reference to the SCRIPT element whose source contains
     * the string argument.
     *
     * @param    {String}    s     The string to search for in the .src attributes
     *                              of the SCRIPTS collection.  Normally, this would
     *                              be a js filename, like AXIS.js
     */
    this.getScriptSrc = function(s) {
      var script = s    || this.minFName;
        
      var scripts = document.getElementsByTagName("script");    
      for(var i=0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute("src");
        if(src && src.match(script)) {
          return src;
        }
      }
      return '';
    };
          
    /**
     * General null function, used variously.
     */
    this.F  = function()
      {
        return false;
      };
    
    /**
     * @see #attachEvent, #detachEvent
     */
    this.IE_EVENTS = [];
    
    /**
     * Interface to the Shell object, which handles ! requests.  The main purpose
     * is to allow the Shell object code itself to be loaded only when needed. Code
     * is loaded once first call to #run is received.
     *
     * @see #onHashChange
     * @see shell/Shell.js
     */
    this.Shell = 
      {
        run: function(cmd) 
          {
            var r = function()
              {
                AXIS.Shell._run(cmd || false);
              };
              
            if(AXIS.isUndefined(this._run))
              {
                AXIS.includeScript({
                  src:    AXIS.PATH() + '/shell/Shell.js',
                  onload: r
                });
              }
            else
              {
                r();
              }
          },
          
          log: function() {}
      };

    /**
     *
     * @private
     * @see #settings
     * @see #initialize
     */
    this._settings =         [];
    
    /**
     * Accessor for #_settings.
     *
     * @param      {String}    q   The query property
     * @returns                    The query property value, or false.
     * @type       {Mixed}
     */
    this.settings = function(q)
      {
        if(q && this._settings[q])
          {
            return this._settings[q];  
          }   
        return false;
      };
      
    /**
     * @private
     */
    this._notificationsEnabled  = true;
    
    /**
     * Site data file, used variously, mainly for Login
     *
     * @private
     * @see #initialize
     * @see __build__.js
     */  
    this._siteData  =           {};
   
    /**
     * The css files which every page gets
     *
     * @private
     */
    this._generalCSS  =         [this.ROOT() + 'css/AXIS.css'];
    
    /**
     * These are the objects which together w/ AXIS represent the base framework.  
     * You may add other scripts.
     * NOTE: order is important.  Be sure to leave Login.js as the very last.  
     *
     * In order to be included in AXIS.combined.js, be sure to put your script on a separate
     * line and have your line be of the form "this.PATH() + 'yourscript.js'".
     * 
     * Please do not remove the BEGIN LIMEBITS_.... line below.  It is used by our Rakefile
     * to identify where to start parsing out the names of the scripts to include in
     * AXIS.combined.js
     *
     * BEGIN LIMEBITS_SITE_AXIS_COMBINED_FRAMEWORK_LIST
     *
     * @private
     */
     
    this._framework =  [
      this.PATH() + 'Util.js',
      this.PATH() + 'Cookies.js',
      this.PATH() + 'User.js',
      this.PATH() + 'Loader.js',
      this.PATH() + 'XHR.js',
      this.PATH() + 'WebDAV.js',
      this.PATH() + 'Login.js'
     ];
    /* END LIMEBITS_SITE_AXIS_COMBINED_FRAMEWORK_LIST */
                      
    /**
     * Error handling/debugging for the AXIS is enabled by loading the
     * `Errors` extension.  Errors are reported in this system by adding
     * commands like: new AXIS.Errors.AXISException('exception info') to
     * your code.  It wouldn't be reasonable to expect these commands to
     * be removed from the code when not in debugging mode.  However, they
     * make no sense unless the Errors extension is loaded: if it is not
     * loaded, AXIS.Errors does not exist, resulting in an non-existent
     * method javascript error.  The below exists, therefore, to "catch"
     * those debug commands when the Errors extension is not enabled. 
     * Note that the methods of this dummy class do nothing.
     */
    this.Errors = 
      {
        createExceptionType:      function(ex) 
          {
            AXIS.Errors[ex] = function()
              { 
                this.report = function(){};
              };
          },
        registerCode:             this.F,
        setReportingLevel:        this.F
      };
    
    this.createCoreErrorTypes = function()
      {  
        /**
         * @see #Errors
         */
        AXIS.Errors.createExceptionType('AXISException');
        AXIS.Errors.createExceptionType('XHRException');
        AXIS.Errors.createExceptionType('LoginException');
        AXIS.Errors.createExceptionType('LoaderException');
        AXIS.Errors.createExceptionType('DAVException');
      };
      
    /**
     * Interface to the Shell object, which handles ! requests.  The main purpose
     * is to allow the Shell object code itself to be loaded only when needed. Code
     * is loaded once first call to #run is received.
     *
     * @see #onHashChange
     * @see shell/Shell.js
     */
    this.Shell = 
      {
        run: function(bang) 
          {
            var r = function()
              {
                /**
                 * Parse out the request. Simply want to ensure that the shell
                 * receives a string command, and an array of arguments. Format is:
                 * !command:arguments&split&on&ampersand.
                 *
                 * If arguments are sent, the regex match will return a captured group
                 * array, where command is [2] and arguments are [3]. No arguments or other
                 * failure of outer capturing group we get null, which means no args (no :)
                 */
                var i = bang.match(/^((.*):{1}(.*))$/);
                var c = i === null ? bang  : i[2];
                var a = i === null ? [] : i[3].split('&'); 
                
                AXIS.Shell._run(c,a);
              };
              
            if(AXIS.isUndefined(this._run))
              {
                AXIS.includeScript({
                  src:    AXIS.PATH() + '/shell/Shell.js',
                  onload: r
                });
              }
            else
              {
                r();
              }
          },
          
          log: function() {}
      };
      
    /**
     * A reference to every script include object is registered here, indexed by its .id.
     *
     * @private
     * @see #includeScript
     */                      
    this._registeredScripts =    [];
    
    /**
     * A reference to every css include object is registered here, indexed by its .id.
     *
     * @private
     * @see #includeCSS
     */                      
    this._registeredStyleSheets =    [];
        
    /**
     * The # of ms that an XHR request will poll for readystate 4 before dying.
     *
     * @private
     * @see Queue#add
     * @see XHR#build
     */
    this._maxXHRLifespan  =       15000;
    
    /**
     * The # of ms that a notification stays visible prior to fading.
     *
     * @private
     * @see #showNotification
     */
    this._notificationFadeDelay = 20000;

    /**
     * ID and CLASS attributes of the DOM containers for messages (both
     * notifications and loading messages).  These should be defined in base.css. 
     *
     * @see Loader#load
     * @see Loader#createLoadingPanel
     * @see Loader#updateLoadingPanel
     * @see Loader#clearLoadingPanelItem
     * @see #showNotification
     */
    this.loadingMsgContainerId  =           'AXIS_loading_panel';
    this.loadingMsgItemClass  =             'AXIS_loading_panel_item';
    this.defaultLoadingMsg  =               'Loading...';
    this.notificationContainerId  =         'AXIS_notification_container';
    this.notificationItemClass  =           'AXIS_notification';
    this.notificationCloseButtonClass =     'AXIS_notification_close_button';
    
    /**
     * Ms fade runs in #fadeTo
     *
     * @see #fadeTo
     */
    this.defaultFadeSpeed  =         500; 
    
    /**
     * Readable Node values
     */
    this.ELEMENT_NODE =                   1;
    this.ATTRIBUTE_NODE =                 2;
    this.TEXT_NODE =                      3;
    this.CDATA_SECTION_NODE =             4;
    this.ENTITY_REFERENCE_NODE =          5;
    this.ENTITY_NODE =                    6;
    this.PROCESSING_INSTRUCTION_NODE =    7;
    this.COMMENT_NODE =                   8;
    this.DOCUMENT_NODE =                  9;
    this.DOCUMENT_TYPE_NODE =             10;
    this.DOCUMENT_FRAGMENT_NODE =         11;
    this.NOTATION_NODE =                  12;
    
    /**
     * Escape CSS selector
     */
    this.escapeCSS = function(s) 
      {
        return s.replace(/([.:/%* >+~])/g, "\\$1");
      };
      
    /**
      merge properties of primary object with secondary 
      */
    this.merge = function(primary, secondary) 
      {
        var result = {};
        for(var p in primary) 
          {
            result[p] = primary[p];
          }
  
        for(var p in secondary) 
          {
            result[p] = secondary[p];
          }
  
        return result;
       };

    /**
     * Will parse any string sent as one having a possible querystring -- that a `?`
     * character exists after which there are query arguments, in the format one
     * would expect with standard http querystrings.  If such a querystring is found,
     * it will be parsed.  An example:
     *
     * general.js?specialArgs=one+two+three&moreArgs=foobar
     *
     * - `specialArgs` will be a new index in returned array;
     * - `+` is coverted to space ` `, so value of `specialArgs` is
     *   a string with spaces: `one two three`;
     * - `moreArgs` is another key in returned array, value `foobar`.
     *
     * @param      {String}      qst     A string.
     * @returns                          An array filled as described above.
     * @type       {Array}
     * @see      #initialize
     */
    this.fetchBuildArguments = function() 
      {
        var ret = [];
        var i, j, src, s, args;
        
        var scripts = document.getElementsByTagName("*");    
        for(i=0; i < scripts.length; i++) 
          {
            src = scripts[i].src;
            
            if(src && src.match(this.minFName)) 
              {
                args = scripts[i].getAttribute('arguments');
                args = args ? args.split('+') : [];
                ret.extensions  = scripts[i].getAttribute('extensions') || '';
                ret.libraries   = scripts[i].getAttribute('libraries') || '';
                
                for(j=0; j < args.length; j++) 
                  {
                    s = args[j].split('=');
                    ret[s[0]] = s[1] || true;
                  }
                
                this._settings = ret; 
                break;
              }
          }
      };

    /**
     * Extension of the AXIS is done by registering classes via this function. Any
     * class so registered inherits (via prototype chain) this method, allowing the
     * registered class to further register `subclasses`.
     *
     * @param   {String}  scr   A String representation of the class to be registered
     */
    this.register = function(scr) 
      {
        /**
         * Do not re-register. NOTE: The Errors extension is a special case.  AXIS
         * has a "dummy" Errors object, which handles bug reports quietly when
         * the actual Errors extension is not requested.  So, if the user has 
         * requested the Errors extension, given below, it won't actually be loaded,
         * as there already exists the mentioned dummy Errors object.  
         */
        if(AXIS.hasOwnProperty(scr) && (scr != 'Errors')) 
          {
            return this[scr];  
          }

        if(window[scr]) 
          {
            /**
             * Set prototype of object definition to caller
             */
            window[scr].prototype = this;    
            
            /**
             * Add new object to this collection
             */
            this[scr] = new window[scr];

            /**
             * If `createGlobals` has been passed via query, set global.  
             * NOTE: What you are doing by creating globals is creating a shortcut
             * to any registered framework object in the global namespace.  For example,
             * if you register an object `MyStuff`, which when registered is now 
             * accessbible via `AXIS.MyStuff`, you will also be able to access it
             * via `$$Mystuff`.  This should be ok, but in general globals can cause
             * conflicts, so it is up to you to make sure you aren't creating collisions.
             *
             * @see #PATH
             * @see #initialize
             */
            if(this.settings('createGlobals')) 
              {
                window['$$' + scr] = this[scr];
              }
    
            /**
             * Mark original class def for cleanup
             */
            window[scr] = null;
    
            /**
             * Call constructor, if any.
             */
            this[scr].__construct && this[scr].__construct();
    
            return this[scr];
          }
        
        return null;
      };

    /**
     * Namespace storage. 
     *
     * @param  {String}    ns      The namespace, form of `chain.like.this`, which 
     *                              creates $AXIS.chain.like.this namespace.
     * @type   {Mixed}             NS ref if successful; false if not.  
     */
    this.createNamespace  =  function(ns) 
      {              
        var a = arguments;
        var x, y, f, i, z;
        
        if(a.length === 0)
          {
            return false;  
          }
                
        /**
         * Allowing for multiple namespace strings to be sent
         */
        for(i=0; i < a.length; i++) 
          {
            x = a[i].split(".");
            y = $AXIS;
        
            for(z=0; z < x.length; z++) 
              {
                /**
                 * Simply adding to the chain, and repointing y to the new node.
                 * NOTE that pre-existing nodes are preserved.
                 */
                y = y[x[z]] = y[x[z]] || {};
              }
          }
        
        /**
         * Note that in case of multiple NS strings, only the first
         * resolved NS will be returned.
         */
        return eval('$AXIS.' + ns);
      };
        
    /**
     * Shows a notification message.  The behaviour is as follows:
     * 1. Show notification and set its fading behaviour.  The default of the
     *    AXIS is to have an absurdly large delay before fading (24 hours), which
     *    means the user will not miss the notification if away from desk.  You
     *    can change this value via .setNotificationDelay().
     * 2. Each notification is given a dismiss button ('OK') to its rightmost, and
     *    clicking this button will get rid of not only the current notice, but
     *    ALL notices. This follows the logic of next behaviour.
     * 3. Any click on the screen will terminate all existing notices.
     *
     * NOTE that the notification is only shown after content is ready.
     *
     * @param      {Object}      v       The notification info object:
     *    {
     *      content   {String}    The content of the message. Can be HTML.
     *      button    {Boolean}   Whether to show a close button. Default true.
     *      onDismiss {Function}  A function to execute when notification dismissed.
     *      type      {String}    The type of notification (TODO)
     *    }
     */
    this.showNotification = function(v) 
      {
        if(v && v.content && this._notificationsEnabled) 
          {
            AXIS.onDOMReady.subscribe({
              callback: function() 
                {
                  var b           = v.button || true;
                  var t           = v.type || 'default';
                  b               = b ? '<input class="' + AXIS.notificationCloseButtonClass + '" type="button" value="OK" onclick="this.parentNode.nClose()" />' : '';
                  var n           = AXIS.find(AXIS.notificationContainerId);
                  var d           = n.appendChild(document.createElement('div'));
                  d.id            = AXIS.getUniqueId('notification_');
                  d.className     = AXIS.notificationItemClass;
                  d.innerHTML     = v.content + b;
        
                  var f = AXIS.fadeTo({
                    'element':    d,
                    startDelay:   AXIS._notificationFadeDelay,
                    deleteOnEnd:  true
                  });
                      
                  d.nClose = function(e) { 
                    AXIS.detachEvent('click',d.nClose);
                    f.forceFade();  
                    v.onDismiss && v.onDismiss();
                  }
                      
                  /**
                   * This event will force a close of all visible notifications.
                   * You can change the event, or simply comment this out.
                   */  
                  AXIS.attachEvent('dblclick',d.nClose,n);
                }
            });
          }
      };

    /**
     * Creates a unique id, suitable for id="" usage, and elsewhere
     * @param   {String}  pref  An optional prefix.  defaults to 'id_'
     * @return  A unique id
     * @type    String
     */
    this.getUniqueId  = function(pref) 
      {
        var d = new Date;
        return (pref || 'id_') + parseInt(Math.random(d.getTime())*Math.pow(10,10));
      };

    /** 
     * onDOMReady
     * Copyright (c) 2009 Ryan Morr (ryanmorr.com)
     * Licensed under the MIT license.
     *
     * Cosmetic changes to cut bytes.  Also: Original code had legacy
     * browsers hijacking window.onload. This has been removed.
     */
    this._onContentReady = function()
      {
      	var ready, timer;
      	var D = document;
      	var hasFired = false;
      	
      	var onStateChange = function(e)
        	{
        	  // moz && opera
        		if(e && e.type == "DOMContentLoaded")
          		{
          			dR();
          		}
        		else if(D.readyState)
        		  {
        		    // safari & ie
          			if((/loaded|complete/).test(D.readyState))
            			{            			    
            				dR();
            			//IE, courtesy of Diego Perini (http://javascript.nwbox.com/IEContentLoaded/)
            			}
          			else if(!!D.documentElement.doScroll)
          			  {
            				try
              				{
              					ready || D.documentElement.doScroll('left');
              				}
            				catch(e)
              				{
              					return;
              				}

            				dR();
          			  }
        		  }
        	};
      	
      	var dR = function()
        	{
            if(!D.body)
              {
                return;  
              }	
        	  
        		if(!ready)
          		{
          			ready = true;
          			
          			/**
                 * Create the notification element.  
                 *
                 * @see #showNotification
                 */
                var n   = D.body.appendChild(D.createElement('div'));
                n.id    = AXIS.notificationContainerId;
                                  
                AXIS.onDOMReady.fire();
          			
          			/**
          			 * DOM cleanup
          			 */
          			if(D.removeEventListener)
          			  {
          				  D.removeEventListener("DOMContentLoaded", onStateChange, false);
          				}
          			D.onreadystatechange = null;
          			clearInterval(timer);
          			timer = null;
          		}
        	};
      	
      	// Mozilla & Opera
      	if(D.addEventListener)
      	  {
      		  D.addEventListener("DOMContentLoaded", onStateChange, false);
      		}
      	// IE
      	D.onreadystatechange = onStateChange;
      	// Safari & IE
      	//timer = setInterval(onStateChange, 5);
      };
    
    /**
     * Sets up a system whereby the hash fragment is watched, and any changes are
     * broadcast to subscribers of AXIS#onHashChange.  NOTE: To disable the watcher,
     * simply pass `disableHashWatcher` argument to AXIS.
     *
     * @see #initialize
     */
    this.createHashWatcher = function()
      {
        AXIS.onHashChange = AXIS.CustomEvent.create();
        
        AXIS.onHashChangeWatcher = AXIS.Queue.add({    
          currentHash:  null,  
          lastHash:     null,    
          command:      null,
          main:         function() {  
            var splt, cmd, z, x, s;
            
            var args          = {};
            var u             = AXIS.parseUrl();
            var hsh           = u.fragment;
            var bang          = u.url.lastIndexOf('!');
            this.currentHash  = hsh;
            
            if(AXIS.settings('disableHashWatcher')) 
              {
                return false;  
              }
            
            if(!!hsh && this.lastHash !== hsh)
              {
                /**
                 * Don't want to change lastHash if command.
                 */
                if(bang === -1)
                  {
              	    this.lastHash   = hsh;
                  }
                  
              	/**
              	 * We now have a command, and any arguments.  Pass
              	 * this to the hash handler.
              	 */
              	splt  = hsh.split('&');
              	cmd   = splt.shift();
              	
              	/**
              	 * Store, so that apps can use #onHashChangeWatcher reference
              	 * to check for latest command.
                 */
              	this.command = cmd;
                
                /**
                 * Create args object.
                 */
                for(x=0; x < splt.length; x++)
                  {
                    s = splt[x].split('=');
                    args[s[0]] = s[1];
                  }
              	  
              	/**
              	 * Commands that begin with a ! are internal.  Others
              	 * are passed on to listeners.
              	 */
              	if(bang !== -1)
              	  {
              	    /**
              	     * Because this framework may well run alongside other code that
              	     * itself might be checking for hash changes, want to clear away
              	     * the command, to avoid corrupting such data.
              	     */
		                window.location.replace(u.url.substring(0,bang));

		                /**
		                 * Now send command to shell.
		                 */
		                AXIS.Shell.run(u.url.substring(bang +1,u.url.length));  
              	  }
              	else
              	  {  
                  	AXIS.onHashChange.fire({
                  	  command:  cmd,
                  	  args:     args
                  	});
                  }
              }
            return true;
          }
        });
      };
      
    /**
     * Determines paths to files needed to satisfy AXIS directes `extensions` and
     * `libraries`. Expects an array reference to push these results onto.
     *
     * NOTE: The filenames given in attributes `libraries` and `extensions` are
     * by default expected to exist within the folder containing the AXIS.  It is likely
     * that you may want to create custom extensions and libraries which will not
     * exist in the AXIS folder.  To do that, you simply prepend a tilde(~) to the 
     * library/extension name, followed by the path (either relative, or absolute).
     * Such as:
     *          libraries="array+string+~mylibrary/foo/bar/file.js+~http://www.foo.com/bar.js
     *
     * @param   {Array}     ret   An array to push resolved paths onto  
     * @param   {String}    qN    A directive string ("foo+bar...");
     * @param   {String}    aP    Added subpath (ie 'libraries', which means axis/libraries/)
     * @see     #initialize
     */
    this.buildPathForDirective = function(ret,qN,aP) 
      {
        var f, i;
        var a       = qN ? qN.split('+') : [];
        var aPath   = aP ? aP + '/' : '';

        for(i=0; i < a.length; i++) 
          {
            if(a[i].charAt(0) == '~')
              {
                f = a[i].substring(1,a[i].length);
              }
            else
              {
                f = AXIS.PATH() + aPath + a[i] + '.js';  
              }
        
            ret.push(f); 
          }
      };

    /**
     * Upon instantiation of AXIS object (see bottom of file), a call to #initialize
     * is made, which:
     * - Sets a timeout to handle framework loading timeouts;
     * - Calls #PATH on AXIS.js, which is done to fetch any query args regarding
     *   requested extensions to AXIS;
     * - Add any extensions to the core #_framework array;
     * - Load all core files, including extensions, and when they are loaded, load
     *   the initialization script (__build__.js), which does registration of objects,
     *   fetches user domain data, fetches user data via google api, and calls #start.
     *   
     * @see          __build__.js
     * @throws       AXIS_FRAMEWORK_LOAD_TIMEOUT
     */
    this.initialize = function() 
      { 
        AXIS.createCoreErrorTypes();
        
        /**
         * Fired when the AXIS is loaded, initialized... ready
         *
         * @see AXIS#start
         */
        AXIS.onReady = AXIS.CustomEvent.create({
          name: 'onReady'
        });
          
        /**
         * Fires when the DOM is ready for manipulation
         *
         * @see AXIS#_onContentReady
         */
        AXIS.onDOMReady = AXIS.CustomEvent.create({
          name: 'onDOMReady'
        });
          
        /**
         * Fires when the window has loaded (window.onload)
         */
        AXIS.onWindowReady = AXIS.CustomEvent.create({
          name: 'onWindowReady'
        });
        
        /**
         * Fires just prior to the window being unloaded (user leaves or refreshes).
         * NOTE: Opera does not support this, and Chrome only seems to fire on refresh.
         */
        AXIS.onBeforeUnload = AXIS.CustomEvent.create({
          name: 'onBeforeUnload'
        });
        
        AXIS.attachEvent('beforeunload',function() {
          AXIS.onBeforeUnload.fire();
        }, window);
        
        /**
         * Fires when the window is resized NOTE how we are
         * attaching an event, below.
         */
        AXIS.onResize = AXIS.CustomEvent.create({
          name: 'onResize'
        });
        AXIS.attachEvent('resize',function() {
          AXIS.onResize.fire();
        },window);
        
        /**
         * Fires when the window is scrolled. NOTE how we are
         * attaching an event, below.
         */
        AXIS.onScroll = AXIS.CustomEvent.create({
          name: 'onScroll'
        });
        AXIS.attachEvent('scroll',function() {
          AXIS.onScroll.fire();
        },window);
          
        /**
         * We want to check here if this is minified.  When minified, the #_framework
         * files are NOT to be loaded.  However, the #_framework array is still needed,
         * as it will be added to, below, if there are extensions, etc, to load.  When
         * minified, the #_framework files are added to the top of this file (>cat). We
         * don't want to load them again.  So we clear the #_framework array if minified.
         * The check is for the XHR object; it could be any essential file.
         */
        if(typeof XHR == 'function') 
          {
            AXIS._framework = [];      
          }
          
        var AF = AXIS._framework;
          
        /**
         * Load any general CSS
         */
        for(var f=0; f < this._generalCSS.length; f++) 
          {
            this.includeCSS({
              id:   'css_' + f,
              href: this._generalCSS[f]
            });
          }
        
        /**
         * Get any query args first
         */
        AXIS.fetchBuildArguments();
          
        /**
         * Add the google api loader on request, simply by adding to the framework array. 
         * Note: need to pass `useGoogleAPI` to AXIS arguments.
         *
         * @see AXIS#Modules#load
         * @see AXIS#User#getUserGeoData
         */
        if(AXIS.settings('useGoogleAPI')) 
          {
            // ABQIAAAABH14nUM9IOGSATH59A8PIxTtVJmlcGkc8uAjvGT8FSkFC9SscxRd4KeXJgXC39BF8yapmiOggBEOdg

            AF.push('http://www.google.com/jsapi?key=ABQIAAAAL888oCL6bdlp-RuWkSBsthQXxHUepxJBTAuGj9Pcf4C4H-lDUxRnOXsQgDZxtSvcHhv84_sjei_pWQ');
          }
        
        /**
         * Uses the YUI reset css
         */
        if(AXIS.settings('CSSReset'))
          {
            this.includeCSS({
              id:   'CSS_RESET',
              href: this.ROOT() + 'css/reset.css'
            });
          }  
          
        /**
         * Check if user wants notifications turned off
         */
        if(AXIS.settings('disableNotifications')) 
          {
            AXIS._notificationsEnabled = false;
          }
          
        var AP  = AXIS.PATH();
        var lib = AXIS.settings('library');
            
        /**
         * Augment framework list with extensions, libraries.
         */        
        AXIS.buildPathForDirective(AF, AXIS.settings('extensions'));
        AXIS.buildPathForDirective(AF, AXIS.settings('libraries'),'libraries');
  
        /**
         * When loading an extension `Extension` there is expected to exist a file, `Extension.js`,
         * which contains a constructor function named `Extension`.  That `Extension` constructor
         * is intantiated and attached to the AXIS (via #register) as AXIS.Extension.  At which point
         * the constructor function `Extension` is "destroyed" by having its value set to null 
         * (Extension = null).  There is a possibility, though unlikely, that the name of a 
         * constructor function for an extension has already been defined in the DOM prior to 
         * the AXIS loading process. That is, what if `Extension` had already been defined prior 
         * to AXIS loading process?  In that case we want to store the original value, do our 
         * business with extensions, and then replace the original value once `Extension` has been 
         * instantiated.  So, prior to doing our object registrations, we store any existing values
         * here, and replace them after instantiation (in __build__.js).
         *
         * @see __build__.js
         */
        AXIS.createNamespace('__TVAR');
        $AXIS.__TVAR = [];
        for(var i=0; i < AF.length; i++) 
          {
            var nm  = AF[i].split('/');
            nm      = nm[nm.length-1].split('.')[0];
            $AXIS.__TVAR[nm] = window[nm] || false;            
          }
            
        var build = function() 
          {
            if((AXIS.minFName == 'AXIS.js') || (AXIS.isIE && AXIS._framework.length)) 
              {
                AXIS.includeScript(AP + '__build__.js');
              }
            else 
              {
                /* LIMEBITS_SITE_AXIS_INSERT_FILE __build__.js */
              }
          }
  
        /**
         * Final initialization of the framework is done by the code in
         * __build__.js.  This file will be loaded and executed following
         * successful inclusion of core script group.  
         */
        if(AF.length > 0) 
          {
            AXIS.includeScriptGroup(AF,function() {
              build();
            });
          }
        else 
          {
            build();
          }
          
        AXIS.createHashWatcher();
      };
      
    /**
     * Load any system css, various initializations. This starts the system.
     *
     * @see #initialize
     * @see #Queue
     */
    this.start  = function() 
      {  
        this._onContentReady();
          
        /**
         * Set window.onload handling
         */
        this.attachEvent('load',function() {
          AXIS.onWindowReady.fire();
        },window);
            
        this.Queue.start();
  
        this.onReady.fire();
      };
      
    /**
     * Allows the execution of a single function following the load of a
     * group of scripts.  Unlike #includeScriptChain, this method can load 
     * all scripts asynchronously (faster), with any code dependent on these 
     * scripts executing only following load of entire group.
     *
     * @param   {Boolean}   group   An array of scripts.
     * @see #_includeScript
     */
    this.includeScriptGroup = function(group, fc) 
      {
        var finalCall = fc || AXIS.F;
        if(AXIS.isArray(group) && (group.length > 0)) 
          {
            var grpCount = group.length;
            var grp = function() 
              {
                --grpCount;
                if(grpCount < 1) 
                  {
                    finalCall();
                  }   
              };
                  
            for(var i=0; i < group.length; i++) 
              {
                if(AXIS.isString(group[i])) 
                  {
                    this._includeScript({
                      src:      group[i],
                      onload:   grp
                    });
                  }
                else 
                  {
                    this._includeScript({
                      id:         group[i].id,
                      src:        group[i].src,
                      method:     group[i].method || false,
                      register:   group[i].register || false,
                      onload:     grp
                    });
                  }
              }
          }
        else 
          {
            /**
             * No members of group.  It is possible there will still be a finalCall() set.
             * This won't fire via normal operation, above, which relies on the group
             * being non-empty.  So, fire the finalCall() here, if any.
             */  
            finalCall();
          }
      };

    /**
     * Takes passed script array, and chains inclusions, so that
     * script[0] is certain to be loaded prior to script[1]...script[n].
     *
     * @param   {Boolean} chain   An array of scripts.
     * @see #_includeScript
     */
    this.includeScriptChain = function(chain) 
      {
        if(chain && (chain.constructor === Array) && (chain.length > 0)) 
          {
            /**
             * Shift off the first script object.  This gives us the current
             * script to load, and the remaining collection.  Get current script's
             * onload (if any), store it, and create a new onload handler that
             * fires stored onload handler (first!), and then simply passes the
             * remaining collection to this script, which forces ordering.
             * Then include current script.
             */
            var d     = chain.shift();
            var z     = d.onload || AXIS.F;
            d.onload = function() 
              {
                z();
                AXIS.includeScriptChain(chain);      
              }  
            
            AXIS._includeScript(d);  
          }
      };
      
    /**
     * Takes script definitions passed, and includes script in page. Public
     * interface to #_includeScript.  Mainly sorts argument types.
     *
     * @public
     * @param   {Mixed}   ob      The loading object
     * @see _includeScript
     */
    this.includeScript  = function(ob) 
      {
        if(ob) 
          {
            if(AXIS.isArray(ob) && (ob.length > 0)) 
              {
                for(var x=0; x < ob.length; x++) 
                  {
                    AXIS._includeScript(ob[x]);  
                  }
                return true;
              }
            
            else if(AXIS.isObject(ob)) 
              {
                AXIS._includeScript(ob);
                return true;
              }
            
            else if(AXIS.isString(ob)) 
              {
                AXIS._includeScript({
                  src: ob
                });
                return true;
              }
          }
        
        return false;
      };
    
    /**
     * Includes a script via DOM HEAD insert if the document is loaded
     * or via document.write if not.
     *
     * @param   {Object} ob - The loading object:
     *                          {
     *                            [id] -- The id for the <script> tag
     *                            src  -- The src value of the <script> tag
     *                            [type] -- Default is 'text/javascript'
     *                            [charset] -- character set, default utf-8
     *                            [onload] -- To fire when script loaded
     *                            [method] -- 'write' || 'insert'
     *                          }
     * @private
     * @see #contentReady
     * @throws  Error   AXIS_INCLUDE_SCRIPT_NO_SRC
     */
    this._includeScript = function(ob) 
      {   
        var onloadStr   = '';
        var rscr        = AXIS._registeredScripts;
        
        ob.onload       = ob.onload || AXIS.F;
        
        try 
          {  
            if(AXIS.isUndefined(ob.src) || ob.src.toString() == "") 
              {
                throw new AXIS.Errors.AXISException('AXIS_INCLUDE_SCRIPT_NO_SRC');  
              }
              
            /**
             * Check if we have already loaded this script, and if we have, exit.
             * NOTE that we still fire the onload handler for the script, if any.
             */
            for(var q in rscr)
              {
                if(rscr[q].src === ob.src)
                  {
                    ob.onload();
                    
                    return true;  
                  }
              }
              
            ob.id         = ob.id || AXIS.getUniqueId('script_'); 
            ob.charset    = ob.charset || 'utf-8';
            ob.type       = ob.type || 'text/javascript';
              
            /**
             * Get the basename, in case this is an extension that needs registration.
             * ie. 'foo/bar/file.js' > 'file'
             */
            ob.baseName = ob.src.substring(ob.src.lastIndexOf('/')+1, ob.src.lastIndexOf('.'));
              
            /**
             * If before DOM loaded, write directly (assume we are building the head).
             */
            if(ob.method === 'write' || (AXIS.onDOMReady.hasFired() === false)) 
              {
                
                if(ob.register) 
                  {
                    onloadStr += "AXIS.register('" + ob.baseName + "');";
                  }
              
                onloadStr +=   'AXIS._registeredScripts["' + ob.id + '"].onload();';
                
                /**
                 * We store a copy of the call object mainly to store the onload
                 * handler reference (if any) to be called when written script loads.
                 * Stored on DOM insert as well, below.
                 */
                AXIS._registeredScripts[ob.id] = ob;
            
                document.write('<' + 'script' + ' id="' + ob.id + '" type="' + ob.type + '" src="' + ob.src + '" charset="' + ob.charset + '"> </' + 'script' + '>' + '<' + 'script' + ' type="text/javascript">' + onloadStr + '</' + 'script' + '>');
            
                return true;
              }
              
            /**
             * If the DOM is loaded, append to HEAD script collection.
             */
            var hT    = document.getElementsByTagName('head')[0]; 
            var s     = document.createElement('script'); 
            s.id      = ob.id; 
            s.type    = ob.type;
            s.src     = ob.src; 
            s.charset = ob.charset;
          
            if(ob.onload) 
              {
            		s.onload = s.onreadystatechange = function() 
              		{
              			if( !this.__loaded__  
              			    && (  !this.readyState 
              			          || this.readyState == "loaded" 
              			          || this.readyState == "complete"
              			        )
              			  ) 
              			  {
              			    /**
              			     * A flag to indicate that this script has loaded... see
              			     * above for info on why.
              			     */ 
                			  this.__loaded__ = true;
                					      
                				/**
                				 * If this is an extension, and immediate registration is requested,
                				 * do that here, prior to firing onload.  
                				 */
                				if(ob.register) 
                  				{
                  				  AXIS.register(ob.baseName);
                  				}
                					      
                				ob.onload();
              		    }
              		};
              } 
                
            hT.appendChild(s);
            AXIS._registeredScripts[ob.id] = ob;
          }
        catch(e) 
          {
            e.report();
            return false;
          }
      };
    
    /**
     * Include CSS file (.css) in <head> of document.
     *
     * @param   {String}  ob - The include object
     *                          {
     *                            [id] -- The id for the <css> tag
     *                            href  -- The src value of the <css> tag
     *                            [media] -- Default is 'screen'
     *                          }
     * @throws  Error   AXIS_INCLUDE_CSS_NO_HREF
     */
    this.includeCSS = function(ob) 
      {
        var ss = AXIS._registeredStyleSheets;

        try 
          {
            if(ob && ob.href.toString() == "") 
              {
                throw new AXIS.Errors.AXISException('AXIS_INCLUDE_CSS_NO_HREF');  
              }
                                        
            var hT    = document.getElementsByTagName('head')[0]; 
            var css   = document.createElement('link'); 
            css.id    = ob.id || AXIS.getUniqueId('css_'); 
            css.rel   = 'stylesheet'; 
            css.type  = 'text/css';
            css.href  = ob.href; 
            css.media = ob.media || 'screen';
            
            /**
             * Don't reload the style sheet if already exists.
             */
            for(var q in ss)
              {
                if(ss[q].href === ob.href)
                  {
                    return true;  
                  }  
              }
    
            AXIS._registeredStyleSheets[css.id] = ob;
            hT.appendChild(css);
            return true;
          }
        catch(e) 
          {
            e.report();
            return false;
          }
      };


    /**
     * Regular Expressions library.  Used variously.     
     *
     */
    this.Regexes  = 
      {
        /**
         * #parseUrl Regex from the reverseHTTP javascript layer.
         * http://github.com/tonyg/reversehttp/blob/master/priv/www/httpd.js
         *
         * @sandro :  modified capturing group for .parseUrl fragment(#), changing:
         *              (#(\w*)) (matching on word characters)
         *      to :    (#(.*)) (any single character)
         *
         * @see #parseUrl
         */
        parseUrl:            /^((\w+):)?(\/\/((\w+)?(:(\w+))?@)?([^\/\?:]+)(:(\d+))?)?(\/?([^\/\?#][^\?#]*)?)?(\?([^#]+))?(#(.*))?/,
        text:           /^[\S\ ]{1,}$/, // a non null string, spaces included
        oneChar:        /^[^\s]{1,}$/, // a non null string, no spaces
        varchar:        /^[\S\ ]{0,1000}$/,
        datetime:       /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/,
        date:           /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9])$/,
        time:           /^([0-2][0-3]):([0-5][0-9]):([0-5][0-9])$/,
        integer:        /^\d+$/,
        year:           /^[+-]?\d+$/,
        email:        /^([\w_\-\.]+)@((\[[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.)|(([\w\-]+\.)+))([a-zA-Z]{2,4}|[\d]{1,3})(\]?)$/,
        zip:            /^[\d]{5}$/,
        zip4:           /^[\d]{5}-[\d]{4}$/,
        DBFieldName:    /^[_$a-zA-Z]\S{0,99}$/,
        
        allDigits:      /^\d+$/,
        allAlpha:       /^[a-zA-Z]+$/,
        username:       /^[A-Za-z-_!:~\w]{5,63}$/,
        password:       /^[A-Za-z-_!:~\w]{5,255}$/,
        JSONP:          /^[\s\u200B\uFEFF]*([\w$\[\]\.]+)[\s\u200B\uFEFF]*\([\s\u200B\uFEFF]*([\[{][\s\S]*[\]}])[\s\u200B\uFEFF]*\);?[\s\u200B\uFEFF]*$/
      };

    /**
     * Management class for the Queue
     */
    this.Queue  = 
      {   
        /**
         * This is the array which contains the queue.
         *
         * @private
         */  
        _queue:   [],
          
        /**
         * This is the reference to the timer which runs the queue.
         *
         * @see  #start
         */
        _timer:   null,
      
        /**
         * Adds an object to the Queue.  These objects must contain a .main()
         * method, which is called on each run of the queue.  If .main returns
         * true, it will be kept on and continue to run; returning false (or 
         * returning nothing) results in the object being popped off the queue.
         * Note the special attributes attached (and updated on each execution)
         * to the object.  These are accessed within your .main function via 
         * `this` operator. They are:
         * __TIMESTART__    : The time that the object was attached (timestamp).
         * __TIMECURRENT__  : The current time at execution.
         * __TIMELAST__     : The time of immediately previous execution.
         * __ITERATIONS__   : The number of times that the routine has run, inclusive.
         * __LASTXINDEX__   : The position of object in queue at current execution (zero(0)-base).
         *
         * @see AXIS#fadeTo.
         * @return  The modified and stacked object
         * @type    Object
         */
        add: function(obj) 
          {
            var ob = obj || {};
            var d                 = new Date();
            var gt                = d.getTime();
            ob.__TIMESTART__      = gt;
            ob.__TIMECURRENT__    = gt;
            ob.__TIMELAST__       = gt;
            ob.__ITERATIONS__     = 0;
            ob.__LASTXINDEX__     = null;
            ob.lifespan           = obj.lifespan        || 10000000000;
            ob.maxIterations      = ob.maxIterations    || 10000000000;
            ob.onBeforeDie        = ob.onBeforeDie      || AXIS.F;
            ob.main               = ob.main             || AXIS.F;
                
            /**
             * This is what to call should you want to terminate a process.
             */
            ob.die                = function(idx) 
              {
                this.onBeforeDie(this);
                AXIS.Queue.remove(idx || this);
              };
    
            /**
             * Execute the main method immediately, and if it is to remain
             * on the queue, add it.
             */
            ob.main() && AXIS.Queue._queue.unshift(ob);
    
            return ob;
          },
  
        /**
         * This is the queue walker.  Runs the #main of each object in queue,
         * handles the detachment (or not) and updates the internal special vars.
         *
         * @see #Queue#start
         */
        walk: function() 
          {  
            var q = AXIS.Queue._queue;
            var c = q.length;
            var d = new Date();
            var qc;
     
            while(c--) 
              {
                qc = q[c];
                qc.__ITERATIONS__++;
                qc.__TIMELAST__     = qc.__TIMECURRENT__;
                qc.__TIMECURRENT__  = d.getTime();     
                qc.__TIMETOTAL__    = qc.__TIMECURRENT__ - qc.__TIMESTART__;
                qc.__LASTXINDEX__   = c;
      
                /**
                 * Check for death conditions
                 */
                if( (qc.lifespan < qc.__TIMETOTAL__) || 
                    (qc.maxIterations < qc.__ITERATIONS__) || 
                    !!qc.main() === false) 
                  {
                    qc.die(c);  
                  }            
              }
          },
            
        /**
         * Used to check whether a particular object exists in the Queue
         * 
         * @param   {Object}  A Queue object reference
         * @type  Boolean
         */
        exists: function(r) 
          {
            var i = this._queue.length;
            while(i--) 
              {
                if(this._queue[i] === r) 
                  {
                    return true;  
                  }  
              }
            
            return false;
          },
  
        /**
         * Allows the killing of any objects with the given property/value.
         * Note that this will kill ALL objects which satisfy
         * the property/value condition!
         *
         * @param   {String}  p   The property name.
         * @param   {Mixed}   v   The property value.
         *
         * @return  The # killed.
         * @type  Number
         */
        killByPropertyValue: function(p,v) 
          {
            var q = this._queue;
            var i = q.length;
            var h = 0;
    
            while(i--) 
              {
                if(q[i][p] && q[i][p] === v) 
                  {
                    q[i].die();
                    ++h;
                  }  
              }
                  
            return h;
          },
           
        /**
         * Removes sent object instance, if any
         *
         * @param      {Mixed}     r     A Queue object, or a Queue index.
         * @type       {Boolean}
         */
        remove: function(r) 
          {
            /**
             * Removal involves marking for cleanup, not simply deleting. The aim
             * is to kill only via using the natural destructor, #die.
             */
            
            /**
             * If passed an index, use that. Note that we check if
             * the object at given index 
             */
            if(r && AXIS.isNumber(r)) 
              {
                try 
                  { 
                    this._queue[r].main = AXIS.F;
                    return true;  
                  } 
                catch(e) 
                  {
                    return false;
                  }
              }
            
            /**
             * Find and remove object
             */
            var i = this._queue.length;
            while(i--) 
              {
                if(this._queue[i] === r) 
                  {
                    this._queue[i].main = AXIS.F;     
                    return true;
                  }  
              }
            
            return false;
          },
          
        /**
         * Destroys all objects in the Queue
         */
        clear: function() 
          {
            var i = this._queue.length;
            for(var x = i; x >= 0; x--) 
              {
                this.remove(x);  
              }
            return i;
          },
            
        start: function() 
          {
            AXIS.Queue._timer = setInterval(AXIS.Queue.walk,1);
          },
            
        stop: function() 
          {
            clearInterval(AXIS.Queue._timer);
          }
      };

    /**
     * Object facilitating document.createElement() and similar
     * types of document element creation and manipulation needs.
     *
     * @param    {Mixed}     t     1. A DOM element;
     *                              2. A DOM element Id;
     * @param    {Object}    p     properties, all optional, in form:
     *                        {
     *                          html:   html to insert,
     *                          class:  class attribute,
     *                          style:  {
     *                                    width:  '20px',
     *                                    height: '5px'
     *                                  },
     *                          events: {
     *                                    'click':  function() {
     *                                                // do something
     *                                              }
     *                                  }
     *
     *                          // ...and any other DOM attributes.
     *                          id:     'idstring',
     *                          title:  'some title'
     *                        },                         
     */
    this.Element = 
      {
        extensions: [],
        
        create: function(t,p) 
          {
            if(!t || AXIS.onDOMReady.hasFired() === false) 
              {
                return false;
              }
                
          	/**
          	 * Build the element, attach it to the document.
          	 */
          	var el = AXIS.isString(t) ? document.createElement(t) : t;
          	  
            if(p) 
              {
                var pp, ob, tmp;
                for(var prop in p) 
                  {
                    pp = p[prop];
                    ob = AXIS.isObject(pp);
                    switch(prop) 
                      {
                        
                        case 'html':
                          el.innerHTML = pp;
                        break;
                                
                        case 'class':
                          el.className = pp;
                        break;
                        
                        case 'style':
                          if(ob) 
                            {
                              for(var s in pp) 
                                {
                                  el.style[s] = pp[s];  
                                }
                            }
                        break;
                        
                        case 'events':
                          if(ob) 
                            {
                              for(var e in pp) 
                                {
                                  AXIS.attachEvent(e, pp[e], el);
                                }
                            }
                        break;
                        
                        case 'append':
                          if(AXIS.isArray(pp)) 
                            {
                              for(var e in pp) 
                                {
                                  if(AXIS.isElement(pp[e]))
                                    {
                                      el.appendChild(pp[e]);
                                    }
                                }
                            }
                        break;
          
                        default:
                          try
                            {
                              el.setAttribute(prop, '' + pp);
                            }
                          catch(e)
                            {                      
                              el[prop] = pp;
                            }
                        break;  
                      }
                  }  
              }
            
            document.body.appendChild(el);
            
            return el;
          },
          
        extend: function(o) 
          {
            var ob    = o || {};
            var name  = !AXIS.isUndefined(o.name) && AXIS.isString(o.name) ? o.name : false;
            var fn    = !AXIS.isUndefined(o.func) && AXIS.isFunction(o.func) ? o.func : false;
            
            if(!name || !fn) 
              {
                return;  
              }

            this.extensions[name] = fn;  
            
            /**
             * Anything other than IE can use the HTMLElement prototype
             */
            if(AXIS.isIE === false) 
              {
                HTMLElement.prototype[name] = fn;
                return;
              }
    
            var _createElement = document.createElement;
            document.createElement = function(tag) 
              {
                var e = _createElement(tag);
                if(e) { e[name] = fn; }
              	
              	return e;
              }
            
            var _getElementById = document.getElementById;
            document.getElementById = function(id) 
              {
                var e = _getElementById(id);
              	if(e) { e[name] = fn; }
                return e;
              }
            
            var _getElementsByTagName = document.getElementsByTagName;
            document.getElementsByTagName = function(tag) 
              {
              	var a = _getElementsByTagName(tag);
              	var z = a.length;
              	while(z--) 
                	{
                		a[z][name] = fn;
                	}
              	
                return a;
              }
          }
      };
      
    /**
     * Creates a subscribable event.
     */
    this.CustomEvent = 
      {    
        /**
         * Going to store references to created events to allow the firing
         * of custom event objects without access to the original reference.  Note
         * that this is only done for created custom events that are passed a #name
         */
        events: [],
        
        /**
         * This is a special method that allows the firing of a custom event
         * identified by the #name attribute passed when the event was created.
         *
         * @see #create
         */
        fire: function(nm,aob) 
          {
            if(nm && this.events[nm]) 
              {
                this.events[nm].fire(aob || false);
              }
          },
        
        /**
         * This is a special method that allows the subscribing to a custom event
         * identified by the #name attribute passed when the event was created.
         *
         * @see #create
         */
        subscribe: function(nm,sob) 
          {
            if(nm && this.events[nm] && sob) 
              {
                this.events[nm].subscribe(sob);
              }
          },
        
        hasFired: function(nm, wlf) 
          {
            return  (nm && this.events[nm]) 
                      ? this.events[nm].hasFired(wlf || false) 
                      : null;
          },
          
        /**
         * Creates a custom event.  It is expected that the object returned by this
         * method will be stored somewhere permanent, and fired when necessary, ie:
         *
         * var myCustomEvent = AXIS.CustomEvent.create({...});
         * myCustomEvent.fire();
         *
         * By using the optional #name attribute, you can also identify this event
         * for use without having a permanent reference, ie:
         *
         * var myCustomEvent = AXIS.CustomEvent.create({name: 'myName'});
         * AXIS.CustomEvent.fire('myName');
         *
         * @param    {Object}      ob    Object of form:
         *              {
         *                {String}  [name]        Name of event.
         *                {Object}  [scope]       Scope to fire subscrber handler in. Default window.
         *                {Boolean} [forceWait]   See notes for #subscribe, below.
         *              }
         */
        create: function(ob) 
          {
            var d         = ob || {};
    
            var evOb = function() 
              {
                this._subscribers   = [];
                this._hasFired      = false;
                this._lastFiredArgs = false;
                this._scope         = d.scope || window;
                this._name          = d.name || '';
                this._forceWait     = d.forceWait || false;
              };
                  
            evOb.prototype = 
              {
                /**
                 * Subscribes to an event.
                 *
                 * @param      {Object}      ob    Object of form:
                 *                {
                 *                  {Function}  callback    Function to call when event fires.
                 *                  {Object}    [object]    An object which is available to #fire
                 *                  {Boolean}   [wait]      Wait for next firing (see docs below)
                 *                  {Mixed}     [scope]     Scope to fire subscrber handler in. Default window.
                 *                }
                 */
                subscribe: function(ob) 
                  {
                    var b         = ob || {};
                    b.callback    = b.callback  || AXIS.F;
                    b.object      = b.object    || {};
                    b.wait        = b.wait || false;
                    b.scope       = b.scope || this._scope;
                    
                    /**
                     * Prepare the scoped callback. See below and #fire.
                     */
                    b.callback    = AXIS.curry(b.callback, b.scope);  
                      
                    this._subscribers.push(b);  
        
                    /**
                     * At the point of subscription an event may have already fired.
                     * The default behaviour is, if already fired, to fire the 
                     * callback for this subscription immediately.  This is useful in 
                     * situations like DOMReady or WindowLoaded, which will fire
                     * once only, and if subscribed to multiple times it is expected
                     * the developer wants the subscription to immediately fire.  However,
                     * it is also the case that some subscriptions want to wait for 
                     * the next event, and are indifferent to, or misled by, immediate
                     * firing.  In the latter case, the subscriber can set the .wait
                     * property of the subscription argument to true, avoiding immediate
                     * firing.  NOTE: The #create method also allows forcing a wait on
                     * on subscriptions, which forces second behaviour of second case.
                     *
                     * @see #create
                     */
                    if(this._hasFired && (b.wait === false && this._forceWait === false)) 
                      {
                        b.callback({
                          name:   this._name,
                          data:   this._lastFiredArgs,
                          object: b.object
                        });

                        return true;
                      }
                    return false;
                  },
                
                /**
                 * Destroys all subscribers with given callback.
                 *
                 * @param    {Function}    cb    The callback function for given subscriber.
                 * @param    {Object}      [ob]  The options object subscribed with.
                 * @returns                      The number of unsubscribes done.
                 * @type     {Number}
                 */
                unsubscribe: function(cb,ob) 
                  {
                    var fnd = 0;
                    if(cb) 
                      {
                        for(var f=0; f < this._subscribers.length; f++) 
                          {
                            if(this._subscribers[f].callback === cb) 
                              {
                                /**
                                 * Filter by subscriber object, if requested
                                 */
                                if(ob && this._subscribers[f].object.toString() !== ob.toString()) 
                                  { 
                                    continue;
                                  }
                                
                                ++fnd;
                                this._subscribers.splice(f,1); 
                              }
                          }
                      }
                    return fnd;
                  },
                
                /**
                 * Destroys all subscribers for this event
                 */
                unsubscribeAll: function() 
                  {
                    this._subscribers = [];
                    return true;
                  },
                  
                fire:           function(a) 
                  {
                    var ss;
                  
                    /**
                     * @see  #subscribe
                     * @see  #hasFired
                     */
                    this._hasFired        = true;
                    this._lastFiredArgs   = a;
                     
                    for(var f=0; f < this._subscribers.length; f++) 
                      {
                        ss = this._subscribers[f];
                        
                        ss.callback({
                          name:   this._name,
                          data:   this._lastFiredArgs,
                          object: ss.object
                        });
                      }
                  },
                
                /**
                 * Whether or not this event has fired at least once.  By
                 * passing wLastF argument, will still return false if has
                 * not fired, but will pass the arguments passed by the last
                 * #fire execution, if any.  As this is still truthy, it's 
                 * a simple way to get more info in one call, but be careful.
                 */
                hasFired: function(wlf) 
                  {
                    return wlf ? this._lastFiredArgs : this._hasFired;  
                  }
              };
            
            var ce = new evOb;
            
            /**
             * If we're passed a #name, store the custom object for later reference
             */
            if(AXIS.Regexes.oneChar.test(ce._name)) 
              {
                if(this.events[ce._name]) 
                  {
                    new AXIS.Errors.AXISException('CUST_EVENT_NAME_DUPLICATE');
                    return;
                  }
                
                AXIS.CustomEvent.events[ce._name] = ce;
              }
            
            return ce;
          }
      };

    /**
     * An accurate way of checking whether a given value is an Array.
     *
     * @param     {Mixed}     a     The value to check
     * @type      {Boolean}
     */
    this.isArray  = function(a) 
      {
        return  !!a && Object.prototype.toString.apply(a) === '[object Array]';
      };
      
    /**
     * Whether a given value is an Object.
     *
     * @param     {Mixed}     a     The value to check
     * @type      {Boolean}
     */
    this.isObject = function(a) 
      {
        return !!a && Object.prototype.toString.call(a) === '[object Object]';  
      };
      
    /**
     * Whether a given value is a Function.
     *
     * @param     {Mixed}     a     The value to check
     * @type      {Boolean}
     */
    this.isFunction = function(a) 
      {
        return !!a && a.constructor === Function;  
      };
      
    /**
     * Whether a given value is a String.
     *
     * @param     {Mixed}     a     The value to check
     * @type      {Boolean}
     */
    this.isString = function(a) 
      {
        return  typeof a !== 'undefined' && 
                a !== null && 
                a.constructor === String;  
      };
      
    /**
     * Whether a given value is a Number.
     *
     * @param     {Mixed}     a     The value to check
     * @type      {Boolean}
     */
    this.isNumber = function(a) 
      {
        return  typeof a !== 'undefined' && 
                a !== null && 
                a.constructor === Number;  
      };
    
    /**
     * Whether a given value is a Boolean.
     *
     * @param     {Mixed}     a     The value to check
     * @type      {Boolean}
     */
    this.isBoolean = function(a) 
      {
        return  typeof a !== 'undefined' && 
                a !== null && 
                a.constructor === Boolean;  
      };
      
    /**
     * Whether a given value is a Regular Expression.
     *
     * @param     {Mixed}     a     The value to check
     * @type      {Boolean}
     */
    this.isRegExp = function(a) 
      {
        return !!a && a.constructor === RegExp;  
      };
      
    /**
     * Whether a given value is an DOM element.
     *
     * @param     {Mixed}     a     The value to check
     * @type      {Boolean}
     */
    this.isElement = function(a) 
      {
        return  typeof HTMLElement === 'object' 
                ? !!a && a instanceof HTMLElement 
                : !!a && typeof a === 'object' && 
                  a.nodeType === 1 && 
                  typeof a.nodeName === 'string';
      };
      
    /**
     * Whether a given value is undefined.
     *
     * @param     {Mixed}     a     The value to check
     * @type      {Boolean}
     */
    this.isUndefined = function(a) 
      {
        return typeof a === 'undefined';
      };
    
    /**
     * Breaks a url into its component parts.
     *
     * @param   {String}    [url]   The url to parse. Default is document location.
     */
    this.parseUrl = function(url)
      {
        url = url || window.location.href;
        var m = url.match(AXIS.Regexes.parseUrl);

        return {
          'url'         : m[0],
          'protocol'    : m[2],
          'username'    : m[5],
          'password'    : m[7],
          'host'        : m[8]  || "",
          'port'        : m[10],
          'pathname'    : m[11] || "",
          'querystring' : m[14] || "",
          'fragment'    : m[16] || ""
         };
      };
    
    this.clone = function(obj, deep)
      {
        var c;
        
        /**
         * Non objects aren't passed by reference, so just send it back.
         */
        if(obj === null || typeof obj !== 'object')
          {
            return obj;
          }
          
        c = new obj.constructor(); 
    
        for(var p in obj)
          {
            c[p] = deep ? this.clone(obj[p]) : obj[p];
          }
        
        return c;
      };
    
    /** 
     * document.getElementById() shortcut. 
     * @param       {String}    id    An id attribute of a document element
     * @returns                       element or null
     */
    this.find     = function(id) 
      {
        return id ?  document.getElementById(id) : null;  
      };
    
    /** 
     * Returns the text inside of an element, if any. 
     * @param       {Mixed}    el     An element id string, or an element reference.
     * @type        {String}
     */
    this.getText  = function(el) 
      {
        var t =   AXIS.isString(el) 
                  ? AXIS.find(el) 
                  : AXIS.isElement(el) 
                    ? el 
                    : false;
        if(t) 
          {
            return el.innerText || el.textContent;
          }
        
        return '';
      };
            
    /**
     * A general event attaching script.  
     *
     * @param   {String}    ev    The event name -- NOTE: sans 'on': `onclick` == `click`
     * @param   {Function}  f     A function to attach as event handler
     * @param   {Object}    ob    An element to attach to. Default to `document`
     */
    this.attachEvent  = function(ev,f,ob) 
      {
        var obj = ob || document;
        if(obj.addEventListener) 
          {
            obj.addEventListener(ev, f, false);
          }
        else
          {  
            /**
             * IE needs some special treatment.  There are three things.
             * First, we need to attach any DOM Element extensions which
             * have been registered: @see #Element#extend. Other browsers 
             * allow modification of HTMLElement.prototype, so this is not 
             * necessary for them.  Second, IE doesn't properly provide the 
             * `this` context to an event handler, so we create a `wrapper` 
             * function that will properly contextualize the handler.
             * Related to second point, we also set the `target` property of the
             * event object returned to handler (ie. handler(e){}) to the 
             * element to maintain consistency with the common .target property
             * provided by other browser implementations. And finally, we need
             * to store this new handler wrapping function so that when a
             * #detachEvent request is made, we can use this lookup to find
             * the relevant wrapper function which was used.
             *
             * @see #detachEvent
             * @see #Element#extend
             */
            var nf = function(el) 
              {
                el.target = window.event.srcElement || document;
                for(var w in AXIS.Element.extensions)
                  {
                    el.target[w] = AXIS.Element.extensions[w];
                  }  

                f.call(ob,el);
              }
            
            AXIS.IE_EVENTS['IE' + ev + f] = nf;
            obj.attachEvent('on'+ev, nf);
          } 
      };  

    /**
     * A general event detaching script.  
     *
     * @param   {String}    ev    The event name -- NOTE: sans 'on': `onclick` == `click`
     * @param   {Function}  f     A function to remove as event handler
     * @param   {Object}    ob    The element to detach from. Default to `document`
     */
    this.detachEvent  = function(ev,f,ob) 
      {
        var obj = ob || document;

        if(obj.removeEventListener)
          {                                       
            obj.removeEventListener(ev, f, false);
          }
        else
          { 
            /**
             * @see #attachEvent
             */
            var id = 'IE' + ev + f;
            f = AXIS.IE_EVENTS[id] || f;   
            obj.detachEvent('on'+ev, f);  
            delete AXIS.IE_EVENTS[id];                  
          } 
      };
      
    /**
     * Fires a bound event on a given element.  
     *
     * @param   {String}    ev    The event name -- NOTE: sans 'on': `onclick` == `click`
     * @param   {Function}  f     A function to remove as event handler
     * @param   {Object}    ob    The scope of the element. Default to `document`
     */
    this.fireEvent = function(ev,el,ob)
      {
        var obj = ob || document;
        if(document.createEvent)
          {
            var evt = obj.createEvent("HTMLEvents");
            evt.initEvent(ev, true, true );
            return !el.dispatchEvent(evt);
          }
        else
          {
            var evt = obj.createEventObject();
            el.fireEvent('on' + ev, evt);
          }
      };
      
    /**
     * Stops event from triggering any event handlers set on surrounding elements.
     * NOTE: This does *not* stop the default action for the event, if any.
     * 
     *  @param {Event} e   The event object
     */
    this.stopPropagation = function(e)
      {
        e.cancelBubble = true;
        if(e.stopPropagation) 
          {
            e.stopPropagation();
          }
      };
      
    /**
     * Stops the default behaviour of the event from happening.  For example,
     * if you have a checkbox with an onclick handler, you could handle the
     * click, then .preventDefault(), and the checkbox would not be checked
     * (which is the default behaviour of clicking on a checkbox).
     * NOTE: This does *not* stop propogation of the event.
     * 
     *  @param {Event} e   The event object
     */
    this.preventDefault = function(e)
      {
        e.returnValue = false;
        if(e.preventDefault) 
          {
            e.preventDefault();
          }
        return false;
      };
       
    /**
     * Curry a function.
     *
     * @param    {Function}    fnc     The function to curry.
     * @param    {Object}      [scp]   The scope to execute in. Defaults to window.
     *
     * @return   The curried function, or null function on error.
     * @type     {Function} 
     */
    this.curry  = function(fnc, scp) 
      {
        if(fnc) 
          {
            var _scp = scp || window;
            var args = [].slice.call(arguments,2)
            return function() {
              return fnc.apply(_scp, args.concat([].slice.call(arguments,0)));
            };  
          }
        else 
          {
            return AXIS.F;  
          }
      };
      
    /**
     * Changes the opacity of an element over time.
     *
     * @param   {Object}  ob   Object in this form:
     *                          element -- Either an object reference, or element id.
     *                          [startOpacity]  The opacity to set the object to
     *                          [endOpacity]  The opacity to be achieved
     *                          [time]  Ms fade runs for
     *                          [startDelay] Ms prior to beginning of fade
     *                          [deleteOnEnd] Whether to remove the object from DOM
     *                                        collection when endOpacity is reached.    
     */
    this.fadeTo = function(ob) 
      {
        var el                = (typeof ob.element == 'object') 
                              ? ob.element : document.getElementById(ob.element);
        var startOpacity      = (ob.startOpacity === undefined) ? 100 : ob.startOpacity;
        var endOpacity        = (ob.endOpacity === undefined) ? 0 : ob.endOpacity;
        var time              = (ob.time === undefined) ? -AXIS.defaultFadeSpeed : -ob.time;
        var delta             = Math.abs(startOpacity - endOpacity);
        var startDelay        = (ob.startDelay === undefined) ? 0 : ob.startDelay;
        var deleteOnEnd       = (ob.deleteOnEnd === undefined) ? false : !!ob.deleteOnEnd;
        var onComplete        = ob.onComplete || AXIS.F;
          
        var curOp             = startOpacity;
        
        /**
         * Lose any previous fades on this element
         */
        AXIS.Queue.killByPropertyValue('_fade_el',el);
          
        var doOpacity = function(newop) 
          {
            curOp              = Math.abs(newop);
            el.style.opacity   = curOp/100;
            el.style.filter    = 'alpha(opacity=' + curOp + ')';
          };
          
        doOpacity(startOpacity);
          
        return AXIS.Queue.add({
          _forceFade:   false,
          _fade_el:     el,
          forceFade:    function() 
            {
              /**
               * Forcing a fade.  As there will normally be a start delay,
               * we need to eliminate that, starting as if the fade
               * is starting right now.  Set start time to now and delay to zero.
               */
              var d                 = new Date();
              this.__TIMESTART__    = d.getTime();
              startDelay            = 0;
              this._forceFade       = true;
            },
            
          main: function() 
            { 
              var elapsed = this.__TIMECURRENT__ - this.__TIMESTART__;
    
              if(this._forceFade || (elapsed > startDelay)) 
                {
                  var dec   = ((elapsed - startDelay) / time) * delta;
      
                  doOpacity(startOpacity + dec);
      
                  if(Math.abs(dec) >= Math.abs(startOpacity - endOpacity)) 
                    {
                      doOpacity(endOpacity);
                              
                      if(deleteOnEnd === true && el.parentNode) 
                        {
                          el.parentNode.removeChild(el);
                        }
                      onComplete();  
                      return false;  
                    }
                }            
              return true;
            }
        });
      };
  };
  
/**
 * Build custom library creation API into AXIS prototype.  
 */
$AXIS.prototype = new function()
  { 
    /**
     * @see #store
     */      
    this.$$     = [];
      
    /**
     * The iff/endiff truth state
     *
     * @see #iff
     * @see #endiff
     */
    this.$$if   = true;
    
    /**
     * An if/iff construct. Can be passed one or two arguments, each of which may 
     * be of any type, including functions.  Two cases, 1 or 2 arguments, A or B:
     * 
     * A: A Function argument is evaluated in the scope of AXIS.$, or used as sent.
     *    The processed argument  is then "cast" to a boolean,  creating the truth 
     *    condition for an `if` block.
     * B: Function arguments are evaluated in the scope of AXIS.$, or used as sent.
     *    No casting is done; the truth condition of an `iff` block is
     *    the result of comparison (arg1 === arg2).
     *
     * @see #$elsif
     * @see #$endif
     */
    this.$if = function()
      {
        var a = arguments;
        var f = function(arg)
          {
            return  AXIS.isFunction(arg)
                    ? arg.apply(AXIS.$)
                    : arg;
          };
          
        var t1 = f(a[0]);
        var t2 = f(a[1]);
        
        AXIS.$$if = (a.length === 1) 
                    ? !!t1
                    : (a.length === 2)
                      ? t1 === t2
                      : false;
                      
        return this;
      }; 
    
    /**
     * @see #$if
     */
    this.$elsif = function()
      {
        return this.$$if === false ? this.$if(arguments[0],arguments[1]) : this;  
      };
    
    /**
     * @see #$if
     */
    this.$endif = function()
      {
        AXIS.$$if = true;
        
        return this;
      };

    this.scope  = function(sc, build)
      {
        AXIS.$ = build ? new window[sc] : sc;
        
        return this;
      };
    
    /**
     * Stores a value at a given namespace.  If no key value is given,
     * will store value at ns.$.  If nothing is sent, stored this.$$.
     * 
     * @example   f('my.namespace.here','that') === $AXIS.my.namespace.here.that;
     *            f('other.namespace')          === $AXIS.other.namepspace.$;
     *            f()                           === AXIS.$$
     * @param     {String}    [nm]  A namespace.
     * @param     {String}    [k]   An specific key in the namespace.
     */
    this.store = function(nm,k)
      { 
        if(arguments.length === 0)
          {
            AXIS.$$ = AXIS.clone(AXIS.$);
          }
        else if(nm)
          {
            var ns = AXIS.createNamespace(nm);
            ns[k || '$'] = AXIS.clone(AXIS.$);
          }
        
        return this;
      };
      
    this.restore = function()
      {
        AXIS.scope(AXIS.$$);
        
        return this;
      };
  
    this.run = function(f)
      {
        var e;
        f = AXIS.isArray(f) ? f : [f];
        
        for(var w=0; w < f.length; w++)
          {
            e = f.apply(AXIS.$, Array.prototype.slice.call(arguments, 0));
            if(e !== undefined)
              {
                AXIS.$ = e;  
              }
          }
          
        return this;
      };

    this.extend = function(a)
      {
        if( AXIS.isObject(a) === false ||  
            AXIS.isString(a.name) === false || 
            AXIS.isFunction(a.func) === false)
          {
            alert("AXIS.extend() Arguments malformed. Probably no #name, no #func, or both missing.");
            return false;
          }

        var methName    = a.name;
        var chainType   = a.expects || 'Array';
        var func        = a.func;
        var ns          = a.namespace || false;
        
        var cts         = '[object ' + chainType + ']';
        var cins        = new window[chainType];
        var op          = Object.prototype.toString;
        var ap          = Array.prototype.slice;
        
        var onBefore    = AXIS.isFunction(a.onBefore) ? a.onBefore : false;
        var onAfter     = AXIS.isFunction(a.onAfter) ? a.onAfter : false;

        var args, callDesc, R, lastR;
        
        if((ns && ns.charAt(0) === '$') || methName.charAt(0) === '$')
          {
            alert("AXIS.extend() Method or Namspace names cannot begin with dollar sign($)");
            return false;  
          }
        
        /**
         * This is the business function, attached to a namespace if requested.
         */
        var aFunc = function()
          { 
            args = ap.call(arguments,0);
            
            /**
             * If we're in a failed `iff` condition, return this.
             *
             * @see #iff
             * @see #endiff
             */
            if(AXIS.$$if === false)
              {
                return this;  
              }

            /**
             * Unscoped? Create one based on chainType
             */
            !AXIS.$ && AXIS.scope(chainType,1);
            
            callDesc = 
              {
                'name':     methName,
                'func':     func,
                'scope':    AXIS.$,
                'args':     args
              };
            
            onBefore && onBefore.call(null, callDesc);
            
            /**
             * Ensure that the function executes in the scope it expects.
             * Only update scope value if something is returned.
             */
            var R = func.apply(op.apply(AXIS.$) === cts ? AXIS.$ : cins, args); 
            
            if(R !== undefined)
              {
                /**
                 * If the last operation was destructive, we store the
                 * current (pre-change) $, so it can be recovered.
                 */
                if(lastR !== R)
                  {
                    lastR = AXIS.$$ = AXIS.clone(AXIS.$);
                  }
                
                AXIS.$ = R;
              }
            
            onAfter && onAfter.call(null, callDesc);
            
            return this;
          };
        
        /**
         * Check if a namespace was sent, create it if it doesn't exist,
         * and add named(methName) method to the namespace collection.  Notice
         * how if no namespace is sent, `this` (AXIS) is the namespace.
         */
        if(ns)
          {
            if(this[ns] === undefined)
              {
                var f           = function(){}
                f.prototype     = this;
                this[ns]        = new f;
                this[ns].$if    = this.$if; 
                this[ns].$elsif = this.$elsif; 
                this[ns].$endif = this.$endif; 
              } 
              
            if(this[ns].hasOwnProperty(methName))
              {
                alert('AXIS.' + ns + '.' + methName + ' < Method exists.  No changes made.');
                return false;
              }
              
            this[ns][methName] = aFunc;
          }
        else
          {
            if(this[methName])
              {
                alert('AXIS.' + methName + ' < Method exists.  No changes made. Try creating a namespace.');
                return false;
              }
            this[methName] = aFunc;  
          }
        return true;
      };
  };


/**
 * Create AXIS object, and initialize.
 *
 * @see AXIS#createNamespace
 */
var AXIS  = new $AXIS;
/**
 * Now we re-use $AXIS var, as a namespace container.
 * @see AXIS#createNamespace
 */
$AXIS = {};

AXIS.initialize();

