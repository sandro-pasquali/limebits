/**
 * Copyright 2009 Lime Labs LLC
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
 * CustomEvents
 *
 * Allows the creation of custom events which can be subscribed to and fired.
 *
 * @requires AXIS
 */




/**
 * Register core components and start the framework. Create a namespace for these 
 * functions.  The main goals here are to register any necessary files.  
 */
AXIS.createNamespace('__I');

/**
 * Begins the startup process for the AXIS.  Mainly, registers any extensions that
 * were passed as query args, executes anything stored in the AXIS <script> block,
 * restores any global vars overwritten in the load process, and tells the AXIS to start.
 *
 * @param    {Object}    [exts]      Extensions that need to be registered.    
 */
$AXIS.__I.start = function(exts)
  {    
    var rObs = exts || []; 
    
    /**
     * Add forced dependencies (objects written into main AXIS file) in
     * case of using crunch method (ie. these objects have been appended 
     * to the top of this file).
     */
    rObs['CustomEvents'] = 1;
    rObs['Util'] = 1;
    rObs['Cookies'] = 1;
    rObs['User'] = 1;
    rObs['Loader'] = 1;
    rObs['XHR'] = 1;
    rObs['WebDAV'] = 1;
    rObs['Login'] = 1;
    
    /**
     * Register the objects
     */
    for(var n in rObs)
      {
        AXIS.register(n);
      }

    /**
     * A custom event to be fired when the AXIS is loaded, initialized... ready
     *
     * @see AXIS#start
     */
    AXIS.onReady = AXIS.CustomEvent.create({
      name: 'onReady'
    });

    /**
     * This allows the inclusion of executable code immediately in the original script block which
     * includes the AXIS.js.  
     */
    var scripts = document.getElementsByTagName('*');
    for(var i=0; i < scripts.length; i++) 
      {
        var src = scripts[i].src;
        if(src && src.match('AXIS.js')) 
          {
            eval(scripts[i].innerHTML);
            break;
          }
      }
               
    /**
     * Replace any vars that have been replaced
     *
     * @see #initialize
     */
    for(var p in $AXIS.__TVAR)
      {
        window[p] = $AXIS.__TVAR[p] || null;
      }   

    delete $AXIS.__I;
    delete $AXIS.__TVAR;
    
    AXIS.start();
  };

$AXIS.__I.init = function()
  {
    var fi,oI,exts,libs,dlist;
    var fs            = AXIS._framework;
    var AP            = AXIS.PATH();
    var finD          = [];
    var extNames      = [];
    var allNames      = [];
    /*
    var _depAdd = function(dL,aP)
      {
        var aPath = aP ? aP + '/' : '';
    
        for(var d=0; d < dL.length; d++)
          {
            if(dL[d] in allNames)
              {
                continue;
              }
            else
              {
                finD.push(AP + aPath + dL[d] + '.js'); 
              }
          }
      };
    */
    
    /**
     * Go through the framework list, strip out paths and such, 
     * and get an array of object names.  At this point, check for dependencies.
     * After we have established dependencies, initiate the load of those, if any,
     * and when we have all our shizzle ready, register the objects and start
     * the AXIS.
     */
    for(var r=0; r < fs.length; r++)
      {
        /**
         * Strip out the filename; lose all path info, and extension.
         */
        fi = fs[r].substring(fs[r].lastIndexOf('/')+1, fs[r].lastIndexOf('.'));

        if(fi.charAt(0) != '_')
          {
            /**
             * If this file exists in the AXIS folder, then this is an extension.
             */
            if(fs[r].indexOf(AXIS.PATH() + fi)!=-1)
              {
                extNames[fi] = fs[r].src;
              }
              
            if(fs[r].indexOf(AXIS.PATH())!=-1)
              {
                allNames[fi] = fs[r];
              }
          }
      }

    /*
    for(var dd in extNames)
      {
        try
          {
            window[dd].prototype = AXIS;
            oI = new window[dd];
            oI = oI.__dependencies || false;
            if(oI)
              {
                libs    = oI.libraries || [];
                exts    = oI.extensions || [];  
        
                _depAdd(libs,'libraries');
                _depAdd(exts);
              }
          } catch(e){}
      };
    */
    /**
     * If there are any additional dependencies to load, load those now and
     * #start when they are loaded.  Note that this means that until the 
     * dependencies are loaded, the AXIS will not start.
     */
     
    if(finD.length > 0)
      {
        AXIS.includeScriptGroup(finD,function() {
          $AXIS.__I.start(extNames);
        });
      }
    else
      {
        $AXIS.__I.start(extNames);
      }
  };

$AXIS.__I.init();
