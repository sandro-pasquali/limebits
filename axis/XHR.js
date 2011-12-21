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
 * The main routines for XHR.  The main purpose is to provide methods to build 
 * and enhance the transport package, make the call, check status and throw
 * transport errors. 
 *
 * @throws   Error     XHR_401
 * @throws   Error     XHR_423
 * @throws   Error     XHR_500
 * @requires AXIS
 */
function XHR()
  {
    /**
     * @constructor
     */
    this.__construct = function()
      {
        /**
         * The headers that will be sent with every request, unless overridden
         *
         * @see #send
         */
        this.defaultHeaders = 
          {
            'X-Requested-With':   'XMLHttpRequest',
            'Accept':             'text/javascript, text/plain, text/html, text/xml, application/javascript, application/json,  application/xml, */*'
          };

        /**
         * Caching information and storage for GET calls.
         * 
         * @see #send
         * @see #build#main
         */
        this.cache            = {};
        
        
        /**
         * The receipt of a status code *not* present in this list results
         * in the call being treated as failed.
         *
         * NOTE: the `reshuffling` done on this Array following definition.
         *
         * @see #build
         */
        this.statusCodes = 
          [
            100, // Continue
            102, // Processing (WebDAV) (RFC 2518)  
            
            200, // OK
            201, // Created
            202, // Accepted
            203, // Non-Authoritative Information (since HTTP/1.1)
            204, // No Content
            205, // Reset Content
            206, // Partial Content
            207, // Multi-Status (WebDAV)
            208, // Already reported.
            300, // Multiple Choices
            301, // Moved Permanently
            302, // Found
            303, // See Other (since HTTP/1.1)
            304, // Not Modified
            305, // Use Proxy (since HTTP/1.1)
            307, // Temporary Redirect (since HTTP/1.1)
            
            400, // Bad Request
            401, // Unauthorized
            402, // Payment Required
            403, // Forbidden -- Note Opera will often return this instead of 401
            404, // Not Found  
            405, // Method Not Allowed
            406, // Not Acceptable
            407, // Proxy Authentication Required
            408, // Request Timeout
            409, // Conflict
            410, // Gone
            411, // Length Required
            412, // Precondition Failed
            413, // Request Entity Too Large
            414, // Request-URI Too Long
            415, // Unsupported Media Type
            416, // Requested Range Not Satisfiable
            417, // Expectation Failed
            422, // Unprocessable Entity (WebDAV) (RFC 4918)
            423, // Locked (WebDAV) (RFC 4918)
            424, // Failed Dependency (WebDAV) (RFC 4918)
            426, // Upgrade Required (RFC 2817)
            449, // Retry With
            
            500, // Internal Server Error
            501, // Not Implemented
            502, // Bad Gateway
            503, // Service Unavailable
            504, // Gateway Timeout
            505, // HTTP Version Not Supported
            506, // Loop detected (Bind Draft)
            507, // Insufficient Storage (WebDAV) (RFC 4918)
            509, // Bandwidth Limit Exceeded
            510  // Not Extended (RFC 2774)
          ];
          
        /**
         * Create another accessor, creating object properties from values
         * (allowing checks for statusCodes[sc])
         */
        var i = this.statusCodes.length;
        while(i--)
          {
            this.statusCodes[this.statusCodes[i]] = this.statusCodes[i];  
          }
      };
      
    /**
     * It is often the case that an API will set status code handlers
     * for HTTP responses (on404, on200, etc).  As well, it is common
     * for several of these to be set per response.  This function aims
     * to make that process easier, allowing the developer to send a status
     * code and either a handler function or an AXIS.Errors code (which is
     * then translated into a function which fires an error notification).  As
     * well, the developer can set more than one of these to set at a time. 
     * Function must be called status:function||code pairs, such as:
     *           AXIS.XHR.setStatusHandlerForResponse(xmlhttprespobj,
     *             {
     *               200: function(){ // do something },
     *               404: 'AXIS_ERROR_CODE'
     *             }
     * Notice as well that should there already is a handler, it is not overridden.
     *
     * @param    {Object}  o   The returned object from AXIS#XHR#send
     * @param    {Object}  i   The handler info
     *
     * @see AXIS#WebDAV
     */
    this.setStatusHandlerForResponse = function(o,i)
      {
        var f = i || {};
        
        var n = function(t,ns,nf)
          {
            t['on' + ns]  = t['on' + ns] || (AXIS.isString(nf[ns]) ? function()
              {
                new AXIS.Errors.XHRException(nf[ns]).report();    
              } : nf[ns]);
          }
        
        for(var s in f)
          {
            n(o || {},s,f);
          }
      };
    
    /**
     * Use this to override the default headers for XHR object, or to set others.
     */
    this.setRequestHeader = function(xhr,nm,hd)
      {
        xhr.httpHandle.setRequestHeader(nm, hd);
      };
    
    /**
     * Will set default headers for the call object (see #XHR). NOTE that
     * should an equivalent header be set in the call object, the default will
     * of course not override it.
     */        
    this.setDefaultHeaders = function(xhr) 
      {
        var ch = xhr.headers;
        
        for(var h in this.defaultHeaders)
          {
            if(!ch[h])
              {
                this.setRequestHeader(xhr, h, this.defaultHeaders[h]);
              }
          }
      };
    
    /**
     * Constructs an XHR object.  It is built to be attached to AXIS#Queue
     *
     * {@link AXIS#Queue}
     * @return    An extended XHR object
     * @type      Object
     */
    this.build = function(a)
      {
        var xob = 
          {
            httpHandle: window.ActiveXObject ? new ActiveXObject("Msxml2.XMLHTTP") : new XMLHttpRequest(),

            /**
             * Interprets the .status property of this.httpHandle, adjusting
             * for various quirks, only allowing acceptable codes, warning if
             * errors happen.
             *
             * @see     #main
             * @return  False on error, a number if successful
             * @type    Mixed
             */
            getStatus: function()
              {
                var hh = this.httpHandle;
                var st = hh.status;

                /*
                 * TODO: testing xbrow
                 */
                if((!st && location.protocol == 'file:') || st)
                  {
                    
                    /**
                     * Check for IE oddity of creating status `1223` when
                     * correct is `204`. Simply return reset value
                     */
                    if(st == 1223)
                      {
                        return 204;  
                      }
                    
                    /** 
                     * An unfortunate hack for Safari && Opera.
                     * Safari sets a status of 404 when receiving 401 responses.  
                     * Opera will set a status of 403 when receiving 401.
                     * Safari also destroys headers.
                     * Our auth (401) pages send HTML w/ `<title>401</title>`. 
                     * The solution is to determine if, based on responseText,
                     * we have received a 401.  Override whatever status is
                     * sent should this be the case.  This is done for all
                     * browsers, to avoid ongoing browser-specific forking. As
                     * Chrome's implementation of Webkit doesn't have the same
                     * bug, the hope is that it is known and will go away.
                     */
                    if((st == 404 || st == 403) && hh.responseText.indexOf('<title>401</title>') !== -1)
                      {
                        return 401;     
                      }

                    /**
                     * Only return on acceptable status codes
                     */
                    if(AXIS.XHR.statusCodes[st])
                      {
                        return st;
                      }
                  }
                return false;
              },
              
            getResponseHeader: function(h)
              {
                if(h && AXIS.isString(h))
                  {
                    var rh = this.httpHandle.getResponseHeader(h);  
                    
                    /**
                     * Special case: In cases where the returned body is gzipped, the 
                     * server will append a suffix '-gzip' to the Etag.  This causes 
                     * trouble if this suffixed Etag is used later to run update checks,
                     * such as when we want to check if a file has been updated since the
                     * current local representation was loaded. If we set a header precondition
                     * (If-Match: Etag) on a PUT, the Etag reported to PUT will *not* have a 
                     * suffix, and as such will *always* be different than the original 
                     * suffixed Etag, even if the file itself has not changed.  So... we strip
                     * out '-gzip' from Etag requests.
                     */
                    if(rh !== null && h == 'Etag')
                      {
                        return rh.replace('-gzip','');  
                      }
                      
                    return rh;
                  }
                return null;
              },
            
            lifespan:         a.lifespan || AXIS._maxXHRLifespan,
            onBeforeTimeout:  a.onBeforeTimeout || function()
              {
                new AXIS.Errors.XHRException('XHR_REQUEST_TIMEOUT');  
              },
            
            /**
             * The XHR object should be attached to the AXIS.Queue, and
             * will wait for the readyState to hit `4`.
             *
             * .readyState values:
             * 0: uninitialized
             * 1: loading
             * 2: loaded
             * 3: interactive
             * 4: complete
             * 
             * {@link Queue}
             * @type  Boolean
             */
            main: function(inf)
              { 
                if(this.httpHandle.readyState === 4) 
                  {     
                                    
                    var T = this;
                    AXIS.Shell.log('axis','debug','Received ', T);
                    /**
                     * Ensure that we snip this instance off the queue, in case
                     * of some error happening where the main function fails
                     * to return false. NOTE: relevant only to asynch calls (Queue)
                     */
                    this.die && this.die();

                    /**
                     * Handles the loading notifications cleanup
                     */
                    AXIS.Loader.afterResponseCleanup(T);
       
                    var stat = T.getStatus();

                    T.responseText = T.httpHandle.responseText || ''; 
                    T.responseXML = '';
                    
                    if(T.httpHandle.responseXML)
                      {
                        T.responseXML = T.httpHandle.responseXML;
                        T.serializedXML = function()
                          {
                            return AXIS.isIE ? T.responseXML.xml : (new XMLSerializer()).serializeToString(T.responseXML);
                          }
                      }
                    if(stat == 304)
                      {
                        /**
                         * Not modified response is 304; in those cases we want to send back
                         * the cached version, if any, to the callback.  So we first make sure we handle
                         * the 304 (to replace current response with cached response).  The callback also
                         * needs to be modified, in order to provide caching for fresh responses.
                         */
                         //alert('304: '+T.url);

                         try
                           {
                             var cac              = AXIS.XHR.cache[T.url];
                             
                             T.responseText       = cac.responseText;
                             T.responseXML        = cac.responseXML;
                           }
                         catch(e)
                           {
                             alert('cache error');
                           }
                      }
                    else if(stat === 200 && T.method === 'GET') // only cache successful GET's
                      {                        
                        /**
                         * On first load, cache info.
                         * Fetch the Etag and use to store match flag.
                         * Unfortunately response header not always available on all browsers.
                         */
                        try
                          {
                            T.__ETAG__ = T.getResponseHeader("Etag");
                          }
                        catch(e)
                          {
                            T.__ETAG__ = '"0"'; 
                          }
                          
                        AXIS.XHR.cache[T.url]  = T;
                      }
                    
                    /**
                     * Call the response processor, if any.  Note that this will be returned
                     * as the second argument of a response handler.  
                     */ 
                    var procResp =  T.responseProcessor 
                                    ? T.responseProcessor.call(T.scope, T) 
                                    : false;
                      
                    /**
                     * NOTE how we call onXXX handlers prior to other response handlers.
                     */
                    T['on' + stat] && T['on' + stat].call(T.scope, T, procResp);

                    /**
                     * If a status code that the user has defined as a failure code is
                     * caught, fire the #onFailure handler.  If status is not returned or
                     * a > 400 level Http status code is returned, we understand this
                     * as being a failure, and we fire the #onFailure handler.
                     */
                    if(T.failureCodes[stat] || stat === false || stat > 400) 
                      {
                        T.onFailure.call(T.scope, T, procResp);
                      }
                    /**
                     * If not a failure, check success status, and fire any 
                     * relevant success handlers.
                     */
                    else if(  ((stat > 199)
                            &&(stat < 209))
                            || stat == 304
                            || T.successCodes[stat])
                      { 
                        T.onSuccess.call(T.scope, T, procResp);
                      }

                    /**
                     * NOTE: .callback is always called whether success or failure, useful
                     * for creating a single handler.
                     */
                    T.callback.call(T.scope, T, procResp);
   
                    return procResp || T;  
                  } 
                return true;
              }
          };

        /**
         * Now attach request args to the returned object
         */
        for(var p in a)
          {
            xob[p] = a[p];  
          }

        /**
         * 204's in IE cause trouble... mainly, an httpHandle.send does
         * not return at point of send. So we force the readystate handler
         * into the duty of calling #main.
         */
        xob.httpHandle.onreadystatechange =   AXIS.isIE && 
                                              a.asynch === false && 
                                              a.method === 'PUT' 
                                                ? function() { xob.main() } 
                                                : AXIS.F;
        
        return(xob);
      };
    
    this.send = function(a)
      {
        var CB        = this.build(a);
        var targUrl   = CB.url;
        AXIS.Shell.log('axis','debug','Sending ',CB);
        /**
         * To break cache we're just adding a random query. Check if
         * request has query fragment, and if so, append, if not, create.
         */
        if(CB.breakCache)
          {
            targUrl = (CB.url.indexOf('?') !== -1) 
                      ? CB.url + AXIS.getUniqueId('&') 
                      : CB.url + AXIS.getUniqueId('?');
          }

        /**
         * This scope will be applied to the response handlers, if any.
         * Default scope is the call object itself.
         *
         * @see #build#main
         */
        CB.scope = CB.scope || CB; 

        CB.httpHandle.open(CB.method, targUrl, CB.asynch, CB.username, CB.password);
        
        this.setDefaultHeaders(CB);
        
        /*
         * GET requests should not send content-type header
         */
        if(CB.method == 'GET') 
          {
            if(CB.headers["Content-Type"]) 
              {
                delete CB.headers["Content-Type"];
              }

            /**
             * Using Etag to check for changes in file, for cacheing.  See #build#main
             */
            if(this.cache[CB.url])
              {
                CB.headers["If-None-Match"] = this.cache[CB.url].__ETAG__;
              }
          }

        /**
         * Override default headers with any sent in call object
         */
        if(CB.headers)
          {
            for(var z in CB.headers)
              {
                this.setRequestHeader(CB, z, CB.headers[z]);
              }
          }
        
        CB.onBeforeSend.call(CB.scope,CB);

        CB.httpHandle.send(CB.body);  

        CB.onAfterSend.call(CB.scope,CB);

        return(CB);
      };       
  };
