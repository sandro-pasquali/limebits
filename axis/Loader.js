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
 */
function Loader() 
  {
    /**
     * @constructor
     */
    this.__construct = function()
      {
        /*
         * all requests will go into _activeRequests until a locked request.
         * TODO: create locked requests, and request queueing
         */
        this._activeRequests  = [];
        
        AXIS.onDOMReady.subscribe({
          callback: function() {
            this.loadingPanel = document.body;
            this.createLoadingPanel();
          },
          scope: this
        });
          
        /*
         * 1:   Supported by all browsers
         * 2:   Supported by rfc2616 (Opera supports these)
         * 3:   Basic methods, supported by IE.
         * n:   Gecko(Firefox) supports all methods
         *
         * NOTE: methods of higher index include all lower indexed methods
         */
        this.supportedMethods = {
          GET:                1,
          POST:               1,
          HEAD:               2,
          PUT:                2,
          DELETE:             2,
          PROPFIND:           3,
          PROPPATCH:          3,
          MKCOL:              3,
          LOCK:               3,
          UNLOCK:             3,
          COPY:               3,
          MOVE:               3,
          REPORT:             3,
          SEARCH:             3,
          CHECKIN:            3,
          CHECKOUT:           3,
          UNCHECKOUT:         3,
          'VERSION-CONTROL':  3,
          TRACE:              3,
          BIND:               3,
          UNBIND:             3,
          REBIND:             3,
          MKREDIRECTREF:      3,
          OPTIONS:            3                                        
        };
      };
      
    /**
     * Use this method to initiate an XHR call, mainly if you simply want to 
     * fetch a resource using GET.  A more comprehensive API for sending various
     * types of HTTP calls can be found in AXIS#WebDAV.  A direct call using this
     * method would look like:
     *
     * AXIS.Loader.load({url: foo/bar.html});
     * 
     * NOTE: default method is GET; and TRUE is the default for .asynch property.
     */

    this.load = function(a)
      {  
        /*
         * Validate "core" attributes
         */
        if(!!a.url === false)
          {
            new AXIS.Errors.LoaderException('XHR_NO_URL_SENT');
            return false;  
          }
          
        a.method        = (a.method) ? a.method.toUpperCase() : 'GET';
        a.url           = a.url;
        a.breakCache    = !!a.breakCache;
        a.callback      = a.callback      || AXIS.F;
        a.onSuccess     = a.onSuccess     || AXIS.F;
        a.onFailure     = a.onFailure     || AXIS.F;
        a.onBeforeSend  = a.onBeforeSend  || AXIS.F;
        a.onAfterSend   = a.onAfterSend   || AXIS.F;
        a.callId        = a.callId        || AXIS.getUniqueId('xhr_');
        a.passThru      = a.passThru      || [];
        a.asynch        = (a.asynch === undefined) ? false : !!a.asynch;
        a.body          = a.body          || null;
        a.username      = a.username      || null;
        a.password      = a.password      || null;
        a.loadingMsg    = a.loadingMsg    || AXIS.defaultLoadingMsg;
        a.headers       = a.headers       || {};   
        
        /**
         * Keep a non-translated version of the request url in case we want
         * to fetch that info later
         */
        a.origRequestUrl = a.url;

        /**
         * To simplify matters for user, allow the sending of succ/fail codes in
         * basic array format ( [403,412,423] ).  However, we'll want to look
         * them up as keys (codes[200] === true).  So translate here.
         *
         * @see  XHR#build#main
         */
        a.failureCodes  = a.failureCodes  || [];
        for(var f=0; f<a.failureCodes.length; f++)
          {
            a.failureCodes[a.failureCodes[f]] = true;  
          }

        a.successCodes  = a.successCodes  || [];
        for(var f=0; f<a.successCodes.length; f++)
          {
            a.successCodes[a.successCodes[f]] = true;  
          }
          
        /*
         * If the method is not supported (either by the browser or
         * in general) send as a special query
         */
        if(!this.methodSupported(a.method))
          {
            var _oldOnBeforeSend = a.onBeforeSend;
            a.onBeforeSend = function() {
              _oldOnBeforeSend.apply(this, arguments);

              var auth = AXIS.Cookies.read("auth");
              auth = auth ? ("&auth=" + auth) : "";
                  
              a.url += "?webdav-method=" + a.method.toUpperCase() + auth;
              a.method = 'POST';
            };
            //alert('special load');
          }
          
        try
          {
           /*
             * Add to the displayed list of queued xhr objects
             */
            if(this.addRequest(a))
              {
                /**
                 * Start the loading.  There is some particular thinking here
                 * around how to treat synch/asynch calls.  In the case of
                 * asynch, we use the Queue to wait for a response, and
                 * to then handle callbacks and so forth.
                 * We could also use synch in this way, and the framework can
                 * handle that.  However, for those who use synch calls, it may
                 * be more appropriate for, instead of using callbacks, for 
                 * Loader#load to return the response directly.  As the 
                 * AXIS.XHR.send function will be executing the .httpHandle.send()
                 * XHR method, a synch call will block, and since we know that
                 * when the block is cleared we have the response object, simply
                 * call .main() (which does some processing on the response), and
                 * return the result.  Note as well, any callbacks that are set
                 * will still be called *prior* to this returning.  This should
                 * provide the best of both worlds, direct functional responses
                 * (for those who want blocking), and a callback structure (for
                 * those who would prefer a non-blocking, asynchronous model).
                 */
                         
                /**
                 * This gets back the fully formed call object, to be either
                 * queued or not, as described above.
                 */
                var ss = AXIS.XHR.send(a);

                if(a.asynch === false)
                  {
                    return ss.main();
                  }
                else
                  {
                    return AXIS.Queue.add(ss);  
                  }
              }
          }
        catch(e)
          {
            /*
             * The error is probably with the send attempt, so attempt to clear 
             * the View of any "Loading" messages tied to this attempt.
             */
            if(a && a.callId)
              {
                this.clearLoadingPanelItem(a.callId);   
              }
          }
        return false;
      };

    this.methodSupported = function(meth)
      {
        var sm = this.supportedMethods[meth];

        if(sm)
          {    
            if(sm < 2)                      return true;
            if(AXIS.isOpera && (sm < 3))    return true;
            if(AXIS.isIE && (sm < 4))       return true;
            if(AXIS.isMoz || AXIS.isGecko)  return true;
          }
          
        return false;
      };
      
    this.addRequest = function(r)
      {
        if(r.callId && this.notDuplicateCall(r.callId))
          {
            this.updateLoadingPanel(r.callId,r.loadingMsg); 
            this._activeRequests.push(r);
            return true;
          }
        return false;
      };
          
    this.notDuplicateCall = function(callId)
      {
        var aR  = AXIS.Loader._activeRequests;
        var i   = aR.length;
        while(i--)
          {
            if(aR[i].callId == callId)
              {
                return(false);
              }
          }
        return(true);
      };
          
    this.afterResponseCleanup = function(retOb)
      {
        var aR  = AXIS.Loader._activeRequests;
        var i   = aR.length;
        while(i--)
          {
            if(aR[i].callId == retOb.callId)
              {
                /*
                 * Clear acitve request
                 */
                aR.splice(i,1);
              }
          }
        AXIS.Loader.clearLoadingPanelItem(retOb.callId);

        //retOb.callback(retOb);
      };

    this.createLoadingPanel = function()
      {
        try
          {
            var b = document.createElement('div');
            b.id          = AXIS.loadingMsgContainerId;
    
            
            document.body.appendChild(b);
          }
        catch(e){}
      };
      
    this.updateLoadingPanel = function(id,msg)
      {
        if(AXIS.settings('showLoadingInfo'))
          {
            try
              {
                var e = document.createElement('div');
                e.setAttribute('id',id);
                e.className = AXIS.loadingMsgItemClass;
                e.appendChild(document.createTextNode(msg));
                 
                var f = document.getElementById(AXIS.loadingMsgContainerId);
                f.style.width     = '100%';    
                f.appendChild(e);
              }
            catch(e){}
          }
      };
      
    this.clearLoadingPanelItem = function(id)
      {
        var z = document.getElementById(id);
        if(z && z.parentNode)
          {
            var pn = z.parentNode;
            pn.removeChild(z);
    
            if(pn.childNodes.length == 0)
              {
                var f = document.getElementById(AXIS.loadingMsgContainerId).style;
                f.width = '0%';
              }
          }
      };
  };
