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
 * @requires AXIS
 * @throws MODULE_LOAD_FAIL
 */

function Modules() {
  /**
   * @constructor
   */
  this.__construct = function() 
    {
      AXIS.Errors.createExceptionType('ModulesException')
      AXIS.Errors.registerCode('MODULE_LOAD_FAIL','Modules.load() Bad arguments. Must send a provider and a module name.'); 
      AXIS.Errors.registerCode('MODULE_DEPENDENCY_FILE_NOT_FOUND','Modules.load() Unable to find dependencies.json file.'); 
      AXIS.Errors.registerCode('MODULE_MALFORMED_DEPENDENCY_FILE','Modules.load() Malformed dependencies.json file. Unable to parse.'); 
    };
    
  /**
   * Will parse any string sent as one having a possible querystring -- that a `?`
   * character exists after which there are query arguments, in the format one
   * would expect with standard http querystrings.  If such a querystring is found,
   * it will be parsed.  An example:
   *
   * general.js?specialArgs=one+two+three&moreArgs=foobar
   *
   * - `specialArgs` will be a new index in returned array, value of 'one';
   * - `+` is coverted to space ` `, so value of `specialArgs` is
   *   a string with spaces: `one two three`;
   * - `moreArgs` is another key in returned array, value `foobar`.
   *
   * @param      {String}      qst     A string.
   * @returns                          An array filled as described above.
   * @type       {Array}
   */
  this.parseQueryString = function(qst) 
    {
      var str     = qst || '';
      var query   = AXIS.parseUrl(str).querystring;                  
      var ret     = [];
      var z       = query.split(/[&;]/);
      var v, w, kv, k;
          
      for(w=0; w < z.length; w++) 
        {
          kv = z[w].split('=');
          
          if(!!kv.length) 
            { 
              k = decodeURIComponent(kv[0]);
                      
              /**
               * Query args don't necessarily have to have a value; there
               * may be no kv[1]
               */
              if(kv[1]) 
                {
                  v = decodeURIComponent(kv[1]);
                
                  /**
                   * Change `+` to space
                   */
                  v = v.replace(/\+/g, ' ');
                }
              else 
                {
                  v = true;
                }
              
              ret[k] = v;
            }
        }
      
      return ret;
    };
    
  /**
   * Module definitions.  
   *
   * @private
   */
  this._modules = {};
    
  this.extend  = function(ob) 
    {
      if(ob.group && ob.module) 
        {
          var m = this._modules[ob.group] = {};
          m[ob.module] = 
            {
              css:    ob.css || [],
              js:     ob.js || [],
              init:   ob.init || AXIS.F
            }
        }
    };

  /**
   * Public method allowing users to load various libraries.
   *
   * @param   {Object}  ob  The load argument object:
   *    {
   *      provider: {String}    `google`, `yahoo`, etc.  
   *      module:   {String}    Name of module.
   *      version:  {String}    Module version. Default `1`
   *      options:  {Object}    Optional parameters.
   *      onload:   {Function}  Function to call when module is fully loaded and ready. This
   *                            is optional but encouraged, as modules will pass some sort
   *                            of API or other useful object to any onload callback.
   *    } 
   *
   * @return  Whether load call successful
   * @type    Boolean
   */
  this.load = function(ob) 
    {        
      if(AXIS.isUndefined(ob) || !ob.provider || !ob.module) 
        {  
          new AXIS.Errors.ModulesException('MODULE_LOAD_FAIL').report(); 
          return false;
        }
        
      var mod, idprefix, lScripts, lCss, useInit, u, 
          buildF, buildData, qs, cOb, loadInitializer, localize;
      
      /**
       * This will be filled with any library/extension dependencies +
       * the actual javascript files included with this module.
       */
      var scriptGroup = [];
            
      /**
       * If dependencies.json has an init file, this will be where it is stored. If
       * not, this remains false, and no init file is loaded.
       */
      var initFile    = false;
      
      /**
       * Path to modules
       */
      var modPath     = AXIS.PATH() + 'modules/' + ob.provider + '/' + ob.module;
       
      /**
       * Determine the path to a module file. The default is to expect these
       * files to exist directly underneath the main module folder.  However, the
       * user can also use external files simply by adding 'http://' to the filename.
       * This will apply to css/js/init files (see below).
       */
      var localize = function(url)
        {
          return  url.match(/^http\:\/\/\S+$/) === null
                  ? modPath + '/' + url   
                  : url;
        }; 

      ob.onload         = ob.onload || AXIS.F;
      ob.version        = ob.version || 1;
      ob.options        = ob.options || {};
                  
      /**
       * We always create a namespace for the new module, based on
       * calling args provider, module
       */
      AXIS.createNamespace('Modules.' + ob.provider + '.' + ob.module);
              
      /**
       * Google has own api handling.  We include it here to have
       * a consistent system for loading modules.  However, it works 
       * differently, and is handled differently.  NOTE: @see AXIS#initialize
       * for info on enabling the google api.
       *
       * @href http://code.google.com/p/gdata-javascript-client/
       */
      if(ob.provider == 'google') 
        {
          try 
            {
              google.load(ob.module, ob.version, ob.options);
              google.setOnLoadCallback(function() {
                ob.onload(google);
              });
            }
          catch(e) 
            {
              /**
               * Prob. developer needs to enable google api...
               */
              AXIS.showNotification({
                content: "The google API has not been enabled, or is somehow broken.  Be sure to pass argument `useGoogleAPI` to the AXIS.<br />The requested module > " + ob.module + " < has not loaded."
              });  
            }
          
          return true;
        }
        
      /**
       * Now load the dependencies file. 
       */
      buildF = AXIS.WebDAV.GET({
        url:        modPath + '/dependencies.json',
        asynch:     false
      });

      /**
       * Failed to find file.
       */
      if(buildF.getStatus() !== 200)
        {
          new AXIS.Errors.ModulesException('MODULE_DEPENDENCY_FILE_NOT_FOUND').report(); 
          return false;
        }

      /**
       * Ok, fetch the json, and init module data.
       */
      try
        {
          mod       = window.JSON 
                      ? JSON.parse(buildF.responseText) 
                      : AXIS.Util.json.safeEval(buildF.responseText);
        }
      catch(e)
        {
          new AXIS.Errors.ModulesException('MODULE_MALFORMED_DEPENDENCY_FILE').report(); 
          return false;
        }
        
      idprefix  = 'module_' + ob.provider + '_' + ob.module + '_';
      lScripts  = mod.js || [];
      lCss      = mod.css || [];

      /**
       * Check for and prep initialization. Note that the init file can
       * be remote, as with other files.
       */
      useInit   = !AXIS.isUndefined(mod.init);
      if(useInit)
        {
          initFile = localize(mod.init);
        }

      /**
       * Load any css files.
       */
      for(var i=0; i < lCss.length; i++) 
        {
          /**
           * Get any query arguments for the css files
           */
          qs      = this.parseQueryString(lCss[i]);
          cOb     = {};
          
          /**
           * Special IE only css; ignore if not IE.
           */
          if(qs.ieonly && (AXIS.isIE === false)) 
            {
              continue;
            }
          
          cOb.id      = qs.id     || AXIS.getUniqueId(idprefix + 'css_');
          cOb.rel     = qs.rel    || 'stylesheet';
          cOb.type    = qs.type   || 'text/css';
          cOb.media   = qs.media  || 'screen';
          
          /**
           * Lose any query before we make the css file request -- this prob wouldn't
           * be a problem, but would rather avoid some future bug. This simply captures
           * everything before a `?` into backreference $1, assigning that result as href.
           */
          cOb.href  = lCss[i].match(/^([^\?]+)\??/)[1];
          cOb.href  = localize(cOb.href);

          AXIS.includeCSS(cOb);   
        }
        
      /**
       * Augment scripts list with extensions, libraries.
       */        
      AXIS.buildPathForDirective(scriptGroup, mod.extensions);
      AXIS.buildPathForDirective(scriptGroup, mod.libraries, 'libraries');
        
      /**
       * Load scripts. Prepare a script group call, ensuring that
       * the full loading of a script group prior to callback.  
       */
      for(var i=0; i < lScripts.length; i++) 
        {
          scriptGroup.push({
            id:   AXIS.getUniqueId(idprefix + 'js_'),
            src:  localize(lScripts[i])
          });
        }      
              
      /**
       * This function will call and run the initializer function.  As the 
       * ordering of when this should be loaded depends on whether or not there
       * are further scripts to be initialized, we keep it as a separate function
       * to be called as needed.
       */
      loadInitializer = function() 
        { 
          AXIS.includeScript({
            src:          initFile,
            onload:       function() 
              {
                /**
                 * We need to check if we loaded any extension directives, and
                 * if so, register these extensions prior to starting module.
                 */
                if(mod.extensions)
                  {
                    var ext = mod.extensions.split('+');
                    for(var s=0; s < ext.length; s++)
                      {
                        if(ext[s].charAt(0) !== '~')
                          {
                            AXIS.register(ext[s]);  
                          }  
                      }
                  }
                  
                /**
                 * Once initializer script is loaded, an attempt will be made
                 * to call an initializer function.  The name of the function
                 * *must* be __init, within the namespace for this module, as
                 * defined above.  For example, for a module with provide 'yahoo'
                 * and module 'Layout' your initialization function would be
                 * defined: $AXIS.Modules.yahoo.Layout.__init = function(){ ... }
                 * Anything this function returns is sent to the callback requested
                 * by the original #load call.  This return value should be something
                 * useful, like an API for using the code the module has loaded.
                 *
                 * It is not obligatory to have an initialization function.
                 *
                 */
                var ns = $AXIS.Modules[ob.provider][ob.module];
                    
                if(ns.__init) 
                  {
                    var r = ns.__init(ob.options);
                    $AXIS.Modules[ob.provider][ob.module] = r;
                  }
                
                /**
                 * Fire onload for module
                 */
                ob.onload(r || ns);
              }
          }); 
        };
      
      /**
       * Load scripts for this module.  Note that initializer won't run until
       * these scripts are loaded.
       */
      if(scriptGroup.length > 0) 
        {
          AXIS.includeScriptGroup(scriptGroup, function() 
            {
              if(useInit) 
                {
                  /**
                   * Modules are ALWAYS included after the content is ready. Modules
                   * are functional elements, for users, and as such will always
                   * require a document.
                   */
                  AXIS.onDOMReady.subscribe({
                    callback: function() {
                      loadInitializer();
                    }
                  });
                }
              else 
                {
                  ob.onload({});  
                }
            });
        }
      else 
        {
          AXIS.onDOMReady.subscribe({
            callback: function() {
              useInit ? loadInitializer() : ob.onload;
            }
          });  
        }
      
      return true;
    }; // end #load
};
