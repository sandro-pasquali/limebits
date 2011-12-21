/**
 * Begins the startup process for the AXIS.  Mainly, registers any extensions that
 * were passed as query args, executes anything stored in the AXIS <script> block,
 * restores any global vars overwritten in the load process, and tells the AXIS to start.
 *
 * @param    {Object}    [exts]      Extensions that need to be registered.    
 */

(function(){

var fi,oI,exts,libs,dlist;
var fs            = AXIS._framework;
var AP            = AXIS.PATH();
var extNames      = {};

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

    /**
     * If this file exists in the AXIS folder, then this is an extension.
     */
    if(fs[r].indexOf(AXIS.PATH() + fi)!=-1)
      {
        extNames[fi] = fs[r].src;
      }
  }

var rObs = extNames || {}; 

/**
 * If this is a combined AXIS, these extensions are already loaded.  They
 * won't exist.
 */
 
rObs.Util         = 1;
rObs.Cookies      = 1;
rObs.User         = 1;
rObs.Loader       = 1;
rObs.XHR          = 1;
rObs.WebDAV       = 1;
rObs.Login        = 1;

/**
 * Register the objects.  If Errors object is requested, register prior
 * to all other objects so that they may set error handlers.
 */
if(rObs.hasOwnProperty('Errors'))
  {
    AXIS.register('Errors');
    delete(rObs.Errors);  
  }
  
for(var n in rObs)
  {
    AXIS.register(n);
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

delete $AXIS.__TVAR;

AXIS.start();
    
})();