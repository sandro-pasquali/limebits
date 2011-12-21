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
 * The Observer implements something like a command pattern, while offering the ability
 * to properly manage browser history (allowing movement through commands using a 
 * browser's BACK|FORWARD buttons.
 *  
 * @requires AXIS
 * @throws   Error OBSERVER_BAD_ARGS
 */

function History()
  {
    /*
     * @constructor
     * @see    #start
     */
    this.__construct = function()
      {
        AXIS.Errors.createExceptionType('HistoryException');
        AXIS.Errors.registerCode('COMMAND_BAD_ARGS','Missing or malformed arguments passed to History.set()');
        
        /**
         * Set up subscribable events
         */
        this.onChange = AXIS.CustomEvent.create({
          name:   'HistoryChange',
          scope:  this
        });

        /**
         * The history tracking is done via a Queue method, which watches
         * for changes in the location hash. 
         */
        AXIS.onDOMReady.subscribe({
          scope:    this,
          callback: function() {

            /**
             * We store this Queue Object as #instance, so we have a reference
             * when needed to stop, etc.
             */
            this.watcher = AXIS.onHashChangeWatcher;
            
            /**
             * Unfortunately, for IE need this.  IE will not update the history
             * record via location.replace with a #.  That actually makes sense,
             * in a way, but not good for our purposes.  So we create a history
             * frame, whose manipulation creates a history record.
             *  
             * However, a nice and as it turns out desired consequence of waiting for
             * the content is that the hash is read and executed on init -- which means
             * that if you bookmark a page with the hash, that hash instruction will
             * execute on page load.
             *
             * @see History#set
             */
  
            if(AXIS.isIE)
              {
                this.HFrame = AXIS.Element.create('iframe',{
                  id:     '__history',
                  name:   '__history',
                  src:    'about:blank',
                  style:  {
                    display:  'none'  
                  }
                });
              }
          }
        });
      };
      
    this.getArguments = function()
      {
        var x, s;
        var fArgs = {};
        var frag  = AXIS.parseUrl().fragment;
        var args  = frag.split('&');
        
        /**
         * Lose command
         */
        args.shift();
        
        for(x=0; x < args.length; x++)
          {
            s = args[x].split('=');
            fArgs[s[0]] = s[1];
          }
        
        return fArgs;
      };
      
    /**
     * This will change the # of the current page location in browser.  Pass it any
     * number of arguments, which will simply be added to the # of the current location,
     * separated by `^` character.  NOTE: It is up to you to worry about escaping characters, 
     * if that is an issue.
     *
     * @param      {Object}        d       Info object:
     *    {
     *      [args]  {Object}       A collection of key = value pairs.
     *    }
     */
		this.set = function(d)
		  {			
		    if(d && (d.command || this.watcher.command))
		      {
		        var h, hd, k, z;
		        var hArgs   = d.args || {}; 
		        var cmd     = d.command || this.watcher.command
		        var twL     = AXIS.parseUrl();
		        var cArgs   = this.getArguments();

		        /**
		         * This is going to be the newly constructed hash.
		         */
    		    var hsh     = '#' + cmd;   

            /**
             * Update any change requests in argument list.
             */
            for(z in hArgs)
              {
                cArgs[z] = hArgs[z];  
              }

            /**
             * Build new hash, &k=v
             */
    		  	for(k in cArgs)
    		  	  {
    		  	  	hsh += '&' + k + '=' + cArgs[k];
    		  	  }

            /*
             * Update history object.  Note that we don't do anything if the current
             * hash matches generated hash.
             */          
            if(twL.fragment != hsh)
              { 
                /**
                 * Form the fully formed url + hash
                 */
                h = twL.url.split('#')[0] + hsh;

                /**
                 * IE needs to do this in order to create a history entry.
                 *
                 * @see #__construct
                 */
                if(AXIS.isIE)
                  {
                    hd = this.HFrame.contentWindow.document;
                		hd.open();
                		hd.write('<script>parent.window.location.replace("'+ h +'");</script>');
                		hd.close();
                  }
                else
                  {
                    window.location.href = h;
                  }
        		  }
          }
        else
          {
            new AXIS.Errors.HistoryException('COMMAND_BAD_ARGS').report(); 
          }
		  };
		
		/**
		 * Unsets arguments. Will take the list of arguments sent and remove those values.
		 * ie. consider fragment: #command&old=argment&foo=bar
		 * After: #unset(['old']);
		 * fragment = #command&foo=bar.
		 *
		 * If you simply want to clear a value, use #set ''.
		 *
		 * @param   {Array}   u   An array of string values corresponding to arguments.   
		 */
		this.unset = function(u)
		  {
		    var args  = u || [];
		    var url   = AXIS.parseUrl();
		    var frag  = url.fragment;
		    var f     = frag.split('&');
		    var ns    = [];
		    
		    for(var a=0; a < args.length; a++)
		      {
		        for(var y=0; y < f.length; y++)
		          {
		            if(f[y].indexOf(args[a] + '=') === -1)
		              {
		                ns.push(f[y]);
		              }
		          }
		      }
		      
		    url = url.url.replace(frag,'') + ns.join('&');
		    window.location.replace(url);
		  };
		  
		this.clear = function()
		  {
		    var u = AXIS.parseUrl();
		    window.location.replace(u.url.replace('#' + u.fragment,'#'));
		  };
  };