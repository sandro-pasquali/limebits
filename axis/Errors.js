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
 * @requires AXIS
 */

function Errors()
  {
    this.__construct = function()
      {        
        /**
         * This value is adjusted by #setReportingLevel.  The value's significance
         * is interpreted by whichever #report method has been assigned to an
         * error object. What '2' or '7' or '125' means is up to the developer. 
         *
         * @see #setReportingLevel
         */
        this._reportingLevel = 1;
        
        /**
         * This is a little strange, but the Errors extension (this extension) is not
         * always present.  We can't have developers constantly check if the Error extension
         * exists prior to creating exceptions objects, or throwing them.  So the AXIS
         * itself has a "dummy" #Errors object which creates core error types and provides
         * other dummy methods which allow the developer to behave as if AXIS#Errors was
         * present.  Instead of rewriting the exception creation code, we just run it again
         * now, as AXIS#Errors now points here.
         *
         * @see AXIS#Errors
         * @see AXIS#createCoreErrorTypes
         */
        AXIS.createCoreErrorTypes();
        
        /**
         */
        this.errorCodes =
          {
            AXIS_REG_FAIL:    
              ["AXIS.register() Object Registration Error"],
            AXIS_FRAMEWORK_LOAD_TIMEOUT:    
              ["AXIS.initialize() Some file loading has timed out.  Things may not work correctly. Internet available? Tube clogged?"],  
            AXIS_INCLUDE_SCRIPT_ERROR:
              ["AXIS.includeScript() Attempt to include script failed."],
            AXIS_INCLUDE_SCRIPT_NO_SRC:
              ["AXIS.includeScript() No src given."],
            AXIS_INCLUDE_CSS_ERROR:
              ["AXIS.includeCSS() Attempt to include CSS failed."],
            AXIS_INCLUDE_CSS_NO_HREF:
              ["AXIS.includeCSS() No href given."],
            CUST_EVENT_NAME_DUPLICATE:
              ["AXIS.CustomEvent.create() Event already exists with given .name attribute."],
            DAV_PUT_NO_BODY:
              ["WebDAV.PUT() No body to put. You must provide a .body for a PUT."],
            DAV_BAD_PROPSET_ARGS:
              ["WebDAV.setProperty() Malformed arguments. Probably missing one or more."],
            DAV_BAD_PROPREMOVE_ARGS:
              ["WebDAV.removeProperty() Malformed arguments. Probably missing one or more."],
            DAV_MOVE_NO_DESTINATION:
              ["WebDAV.MOVE() No destination filename given. You must provide a .destination for a MOVE."],
            DAV_MOVE_403:
              ["WebDAV.MOVE() 403: Forbidden.  The source and destination may be the same."],
            DAV_MOVE_404:
              ["WebDAV.MOVE() 404: Failed.  Source file not found."],
            DAV_MOVE_409:
              ["WebDAV.MOVE() 409: Conflict. Intermediate collection(s) possibly missing."],
            DAV_MOVE_412:
              ["WebDAV.MOVE() 412: Failed. Probably destination exists and .overwrite is `F`."],
            DAV_COPY_NO_DESTINATION:
              ["WebDAV.COPY() No destination filename given. You must provide a .destination for a COPY."],
            DAV_COPY_403:
              ["WebDAV.COPY() 403: Forbidden. Are the source and destination files the same?"],
            DAV_COPY_404:
              ["WebDAV.COPY() 404: Copy failed.  Source file not found."],
            DAV_COPY_409:
              ["WebDAV.COPY() 409: Conflict. Intermediate collection(s) possibly missing."],
            DAV_COPY_412:
              ["WebDAV.COPY() 412: Failed. Probably destination exists and .overwrite is `F`."],
            DAV_DELETE_404:
              ["WebDAV.DELETE() 404: Deletion failed.  File not found."],
            DAV_LOCK_412:
              ["WebDAV.LOCK() 412: Failed, sent URL(resource) probably does not exist."],
            DAV_UNLOCK_400:
              ["WebDAV.UNLOCK() 400: Unlock failed. No lock token sent."],
            DAV_UNLOCK_403:
              ["WebDAV.UNLOCK() 403: The current principal is not authorized to remove this lock."],
            DAV_UNLOCK_409:
              ["WebDAV.UNLOCK() 409: Conflict.  The file is probably locked, or does not exist"],
            DAV_NO_RANGE:
              ["WebDAV.getByteRange() No byte range sent."],
            DAV_MKCOL_405:
              ["WebDAV.MKCOL() 405: Unable to make collection.  Probably already exists."],
            XHR_REQUEST_TIMEOUT:
              ["XHR request has timed out. This is probably a bad thing. Is the internet plugged in?"],
            XHR_NO_URL_SENT:
              ["Loader.load() No Url sent; unable to begin request."],
            XHR_SET_HEADER_FAIL:  
              ["XHR.build.setRequestHeader() Unable to set header."],
            XHR_401:
              ['XHR.send() 401: You are not logged in.  Some functionality on this page is denied to you as a result.  <a href="login.html">Click here</a> to log in.'],
            XHR_403:
              ['XHR.send() 403: You have not been given permission to perform operations on this resource.'],
            XHR_404:
              ['XHR.send() 404: The resource was not found.'],
            XHR_423:
              ["Resource locked."],
            XHR_500:
              ['XHR.send() 500: The server has reported an internal error.  This may or may not be critical.  You can try again, or send us an <a href="mailto:support@limebits.com">email</a>'],
            XHR_501:
              ['XHR.send() 501: An unsupported WebDAV method has been sent.  This may or may not be critical.  You can try again, or send us an <a href="mailto:support@limebits.com">email</a>'],
            XHR_502:
              ["XHR.send() 502: Bad Gateway. Probably an attempt to perform an operation on a server outside of this domain."],
            XHR_503:
              ["XHR.send() 503: Service Unavailable.  The server is probably busy. Try again in a few minutes."],
            XHR_504:
              ["XHR.send() 504: Gateway Timout. The server is probably busy.  Try again in a few minutes."],
            XHR_505:
              ["XHR.send() 505: HTTP Version Not Supported."],
            XHR_506:
              ["XHR.send() 506: Loop Detected."],
            XHR_507:
              ['XHR.send() 507: Insufficient Storage.  You are probably out of space. You can try again, or send us an <a href="mailto:support@limebits.com">email</a>'],
            XHR_509:
              ["XHR.send() 509: Bandwidth Limite Exceeded."]
          };
      }
      
    this.setReportingLevel = function(r)
      {
        this._reportingLevel =  (typeof r == 'undefined' || AXIS.isNumber(r) === false) 
                                ? this._reportingLevel 
                                : r;  
      };
    
    /**
     * Allows the registration of an error code, which code can be passed to
     * an exception instead of a lengthy string.  Such as:
     *
     * new AXIS.Errors.MyException('MY_ERROR_CODE').report()
     *
     * @param     {String}      cd        An error code.
     * @param     {String}      v         The message to show for this error.
     */
    this.registerCode = function(cd, v)
      {
        if(cd && v)
          {
            /**
             * Already exists?
             */
            if(this.errorCodes[cd])
              {
                AXIS.showNotification({
                  content: 'Error Code already registered > ' + cd + ' <br />with message: ' + this.errorCodes[cd] + '.<br />New message/code ignored: ' + v
                });  
              }
            else
              {
                this.errorCodes[cd] = v;
              }
          }  
      };
    
    /**
     * Create custom exception types.  Such as:
     *
     * AXIS.Errors.createExceptionType('MyException');
     *
     * now:
     *
     * throw new AXIS.Errors.MyException('error message')           ||
     * throw new AXIS.Errors.MyException('error message').report()  ||
     * new AXIS.Errors.MyException('error message')                 ||
     * new AXIS.Errors.MyException('error message').report()
     */
    this.createExceptionType = function(ex)
      {
        if(ex && typeof this[ex] === 'undefined')
          {
            this['on' + ex] = AXIS.CustomEvent.create({
              forceWait: true // don't want to fire if event has already fired
            });
            
            this[ex] = this._error(ex);
          }
      };
    
    /**
     * A factory method which returns a constructor.  This constructor is what will
     * be instantiated when an error is generated, such as in: 
     *
     * new AXIS.Errors.XHRException('ERROR_CODE')
     *
     * ...where AXIS.Errors.XHRException == the constructor built here.
     *
     * @see #createExceptionType
     */
    this._error = function(exName)
      {
        /**
         * This is ultimately the constructor function that the developer 
         * instantiates when throwing an error.  Note that he can send a message
         * in several forms, as well as a reporting function.
         */
        return function(excepInfo,rep)
          {
            this.name           = exName || 'N/A';
            this.reportingLevel = AXIS.Errors._reportingLevel;
                        
            /**
             * Error information is passed to the error constructor.  The may be
             * an array of lines of error info, or it may be an error code, or it
             * may simply be a string.  Error codes are string codes.  So we check types 
             * here. Arrays get passed along as is. An error code String is replaces
             * with its AXIS#Errors#errorCodes value. Any other string is inserted into
             * an Array, and passed along. Anything else is turned into an array
             * with an "Unspecified Error" message.  #this#eInfo is now available to
             * the #report function.
             */
            if(AXIS.isArray(excepInfo))
              {
                this.eInfo = excepInfo;  
              }
            else if(AXIS.isString(excepInfo))
              {
                /**
                 * Able to send ~~ after error code to tack on info.  It is likely
                 * that [0] is an error code, and [1] is some additional info.
                 */
                var ns = excepInfo.split('~~');
                
                /** 
                 * Either an error code, or just a string. Either case, we're building
                 * now an array.  
                 * If an error code:  [0] = Error code message, 
                 *                    [1] = Added info, or ''
                 * If not:            [[0],[1]] just use the array we formed.
                 */
                if(AXIS.Errors.errorCodes[ns[0]])
                  {
                    this.eInfo = [AXIS.Errors.errorCodes[ns[0]],ns[1] || ''];
                  }
                else
                  {
                    this.eInfo = [excepInfo];
                  }  
              }
            else
              {
                this.eInfo = "Unknown Error";  
              }
                                  
            /**
             * @see #createExceptionType
             */
            AXIS.Errors['on' + this.name].fire(this);
            
            /**
             * Note that you may send your own reporting function, which is
             * executed in `this` scope, having available to it:
             * this.name
             * this.reportingLevel
             * this.eInfo
             *
             * @param       {Mixed}       [e]       Whether to show error stack.       
             */
            this.report       = rep ? AXIS.curry(rep,this) : function(e)
              {                  
                var cS, eName, eFile, eLine, url, pth;
                var BR      = '<br />';
                var cSOut   = '';
                var eMess   = '';
                var rsp     = this.name + BR;
                var NA      = 'Not Available';
                  
                /**
                 * Simply creates an underline the length of the error name.
                 */
                var u =   new Array(rsp.length);
                rsp +=    u.join('-') + '<br />';

                for(var p=0; p < this.eInfo.length; p++)
                  {
                    rsp += this.eInfo[p] + '<br />';  
                  } 
               
                /**
                 * Do something with any error objects.  
                 */
                if(e instanceof Error)
                  { 
                    eMess   = e.message     || NA;
                    eName   = e.name        || NA;
                    eFile   = e.fileName    || NA;
                    eLine   = e.lineNumber  || NA;
                                          
                    if(AXIS.isIE)
                      {
                        eMess =  e.description + ' :: ' + e.number;
                      } 
                    
                    rsp +=  BR + 'Message: '  + eMess + BR
                            + 'Name: '        + eName + BR
                            + 'File: '        + eFile + BR
                            + 'Line: '        + eLine + BR;
                  }
                  
                if(e)
                  {

                    cS = AXIS.Errors.callStack()();
                    
                    cSOut += '----------<br />CallStack<br />----------' + BR;
                    
                    for(var x=0; x < cS.length; x++)
                      {
                        cSOut += cS[x] + BR;  
                      }
                  }
                  
                rsp += cSOut;
                
                /**
                 * Trim constant repetition of full path.
                 */
                url = AXIS.parseUrl();
                pth = new RegExp(url.url.replace(url.pathname,''), "g");
                rsp = rsp.replace(pth,'[...]');

                AXIS.showNotification({
                  content: rsp
                });
              };
          }  
      };

    /**
     * Will attempt to construct a readable representation of the
     * call stack for any errors, to be reported to user.
     *
     * @private
     * @author Found here: http://pastie.org/253058
     * @see #_handleException
     * @return  An accessor to the call stack, which function returns an Array.
     * @type  Function
     */
    this.callStack = function()
      {
        var mode;
        try {(0)()} catch (e) 
          {
            mode = e.stack ? 'Firefox' : window.opera ? 'Opera' : 'Other';
          }
        
        switch(mode) 
          {
            case 'Firefox': 
              return function() 
                {
                  try {make = error} catch(e) 
                    {
                      return e.stack.replace(/^.*?\n/,'').
                                     replace(/(?:\n@:0)?\s+$/m,'').
                                     replace(/^\(/gm,'{anonymous}(').
                                     split("\n");
                    }
                  return '';
                };
            
            case 'Opera': 
              return function() 
                {
                  try {(0)()} catch(e) 
                    {
                      var lines = e.message.split("\n"),
                        ANON = '{anonymous}',
                        lineRE = /Line\s+(\d+).*?in\s+(http\S+)(?:.*?in\s+function\s+(\S+))?/i,
                        i,j,len;
        
                      for(var i=4,j=0,len=lines.length; i<len; i+=2) 
                        {
                          if(lineRE.test(lines[i])) 
                            {
                              lines[j++] = (RegExp.$3 ?
                                RegExp.$3 + '()@' + RegExp.$2 + RegExp.$1 :
                                ANON + RegExp.$2 + ':' + RegExp.$1) +
                                ' -- ' + lines[i+1].replace(/^\s+/,'');
                            }
                        }
                      lines.splice(j,lines.length-j);
                      return lines;
                    }
                  return '';
                };
        
            default: 
              return function() 
                {
                  var curr  = arguments.callee.caller,
                    FUNC  = 'function', ANON = "{anonymous}",
                    fnRE  = /function\s*([\w\-$]+)?\s*\(/i,
                    stack = [],j=0,
                    fn,args,i;
        
                  while(curr) 
                    {
                      fn    = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
                      args  = stack.slice.call(curr.arguments);
                      i     = args.length;
        
                      while(i--) 
                        {
                          switch(typeof args[i]) 
                            {
                              case 'string'  : args[i] = '"'+args[i].replace(/"/g,'\\"')+'"'; break;
                              case 'function': args[i] = FUNC; break;
                            }
                        }
        
                      stack[j++] = fn + '(' + args.join() + ')';
                      curr = curr.caller;
                    }
        
                  return stack;
                };
             break;
          }
      };
  };