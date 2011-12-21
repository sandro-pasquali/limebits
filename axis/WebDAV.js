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
 * This is a collection of WebDAV methods.  This is a core class, part of the
 * AXIS framework.  All functions or calls which have to do with WebDAV operations
 * are included here.
 *
 * @href  http://greenbytes.de/tech/webdav/rfc4918.html 
 * 
 * Dead Properties
 * ---------------
 * creationdate
 * displayname
 * getcontentlanguage
 * getcontentlength
 * getcontenttype
 * getetag
 * getlastmodified
 * lockdiscovery
 * resourcetype
 * supportedlock
 *
 * @requires   AXIS
 * @requires   Loader
 * @throws     DAV_MOVE_403
 * @throws     DAV_MOVE_404
 * @throws     DAV_MOVE_409
 * @throws     DAV_MOVE_412
 * @throws     DAV_COPY_403
 * @throws     DAV_COPY_404
 * @throws     DAV_COPY_409
 * @throws     DAV_COPY_412
 * @throws     DAV_PUT_NO_BODY
 * @throws     DAV_DELETE_404
 * @throws     DAV_BAD_PROPSET_ARGS
 * @throws     DAV_BAD_PROPREMOVE_ARGS
 * @throws     DAV_LOCK_412
 * @throws     DAV_UNLOCK_400
 * @throws     DAV_UNLOCK_403
 * @throws     DAV_UNLOCK_409
 * @throws     DAV_NO_RANGE
 *
 */

function WebDAV()
  {
    /**
     * @constructor
     */
    this.__construct = function()
      {
        /**
         * namespaces that should be useful to users
         * use like AXIS.WebDAV.ns.lb
         */
        this.ns = {
          d: 'DAV:',
          lb: 'http://limebits.com/ns/1.0/',
          bm: 'http://limebits.com/ns/bitmarks/1.0/'
        };

        this.currentProperties  = [];

        /**
         * In seconds.
         * 
         * @see #LOCK
         */
        this._defaultLOCKTimeout      = 86400;
        
        /**
         * Only write is supported.
         * 
         * @see #LOCK
         */
        this._defaultLOCKType         = 'write';
        
        /**
         * @see #LOCK
         */
        this._defaultLOCKScope        = 'exclusive';
        
        /**
         * @see #LOCK
         */
        this._defaultLOCKDepth        = 'infinity';
        
        this.PRINCIPAL_ALL =                '1';
        this.PRINCIPAL_AUTHENTICATED =      '2';
        this.PRINCIPAL_UNAUTHENTICATED =    '3';
        this.PRINCIPAL_SELF =               '4';
        this.PRINCIPAL_PROPERTY =           '5';
        this.PRINCIPAL_USER =               '6';
        this.PRINCIPAL_GROUP =              '7';
        this.PRINCIPAL_HREF =               '8';
        
        
        AXIS.Errors.registerCode('DAV_ACE_CONFLICT', "An ace conflict occured");
        AXIS.Errors.registerCode('DAV_ACE_INVALID_PRIVILEGES', "Privileges argument is invalid.");
        AXIS.Errors.registerCode('DAV_ACL_CANNOT_REMOVE_INHERITED_ACE', "Inherted aces can only be removed on the ancestor.");
        AXIS.Errors.registerCode('DAV_ACL_CANNOT_REMOVE_PROTECTED_ACE', "Protected aces cannot be removed.");
        AXIS.Errors.registerCode('DAV_ACL_CORRUPTED', "The acl has been corrupted. Have you been editing it directly? ");
        AXIS.Errors.registerCode('DAV_ACL_CHANGED', "The resource's acl has changed since you last fetched it. Try again and use a lock if possible.");

            var search = this.SEARCH;
            search._prop_to_xml = function (prop) {
                if (prop.constructor != Array) {
                    prop = [prop];
                    prop.unshift("DAV:") // set dav as default if no namespace is present
                }
                return '<R:' + prop[1] + ' xmlns:R="' + prop[0] + '"/>';
            };
            // logical operators
            var logicalOps = ["and", "not", "or"];
            var logialGenerator = function(oper) {
                search[oper] = function() {
                    return "<" + oper +">" + Array.prototype.join.call(arguments, "")  + "</" + oper + ">";
                }
            }
            for (var i=0; i < logicalOps.length; i++) {
                logialGenerator(logicalOps[i])
            };
  
            // comparison operators
            var comparisonOps = ["gt", "lt", "eq", "gte", "lte", "gti", "lti", "like", "is_defined", "is_collection", "is_bit"];
            var comparisonGenerator = function(oper) {
                // OK, so the search only searches for <prop>s. We need to add search support based on bitmarks
                // searchCriteria currently has two members: @name : name of the tag whose value is to be searched
                //                                          @ns : namespace for the tag
                search[oper] = function(prop, literal, searchCriteria) {
                    if(searchCriteria) {
                        startTag = "S:" + searchCriteria.name + " xmlns:S='" + searchCriteria.ns + "'";
                        endTag = "S:" + searchCriteria.name;
                    }
                    else {
                        startTag = "prop";
                        endTag = "prop";
                    }
                    
                    if (oper === "is_defined")
                        return "<is-defined><" + startTag + ">" + search._prop_to_xml(prop) + "</" + endTag + "></is-defined>"; 
                    if (oper === "is_collection")
                        return "<is-collection/>";
                    if (oper == "is_bit") 
                        return "<is-bit/>";
                    if (literal !== undefined) {
                        if (oper.indexOf("i") === (oper.length - 1)) {
                            oper = oper.slice(0, -1);
                            literal = '<typed-literal xsi:type="xs:integer" \
                                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \
                                xmlns:xs="http://www.w3.org/2001/XMLSchema">' + literal + "</typed-literal>";
                        } else {
                            literal = "<literal>" + literal + "</literal>";
                        }
                    }
                    return "<" + oper + "><" + startTag + ">" + search._prop_to_xml(prop) + "</" + endTag + ">" + literal + "</" + oper + ">";
                }
            }
            for (var i=0; i < comparisonOps.length; i++) {
                comparisonGenerator(comparisonOps[i])
            };
      };

    /**
     * MAIN WEBDAV METHODS         
     * These methods are passed an argument object, defined below.  The only absolute
     * requirement for ALL methods is .url.  See individual methods for specifics.
     *
     * url          ::  {String} a resource url, and MKCOL name.
     * targetUrl    ::  {String} target, when MOVEing or COPYing.
     * asynch       ::  {Boolean} if true, an asynchronous call; defaults to false.
     * callId       ::  {String} a unique id for this call.  defaults to a random id.
     *                    NOTE: The main purpose of this id is to prevent multiple identical
     *                    xhr calls -- until a call with id[x] has returned, subsequent
     *                    calls with id[x] will simply be ignored.
     * callback     ::  {Function} a handler to receive the xhr result object.
     * headers      ::  {Array} an assoc array of name/value pairs. [See XHR for defaults].
     * propName     ::  {String} with .propPatch, propFind, name of property being accessed.
     * propValue    ::  {String} with .propPatch, propFind, value of property being accessed.
     * body         ::  {String} content body to be sent with request (PUT).
     * acl          ::  {Array}  acl to be set in this request (.setACL).
     */
    
    /**
     * Locks a resource.  
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_LOCK
     * @throws   DAV_LOCK_412
     */
    this.LOCK = function(dav)
      {
        var d = dav || {};
        
        d.url           = d.url       || false;
        d.method        = 'LOCK';
        d.timeout       = d.timeout   || 'Second-' + this._defaultLOCKTimeout;
        d.depth         = d.depth     || this._defaultLOCKDepth;
        d.lockscope     = d.lockscope || this._defaultLOCKScope;
        d.locktype      = d.locktype  || this._defaultLOCKType;
        d.ifExists      = d.ifExists === undefined ? false : true;
        
        d.headers       = {
                            Timeout:          d.timeout,
                            Depth:            d.depth
                          };
                          
        /**
         * If-Match will stop a lock from being taken on an unmapped
         * url -- which would normally create an locked, empty, resource.
         */
        if(d.ifExists)
          {
            d.headers['If-Match'] = '*';
          }
          
        /**
         * Create the <owner> block.  If the user is logged in,
         * this becomes '/home/usernamehere'; otherwise, it is unauthenticated.
         */
         
        var user = AXIS.User.username();
        var ublk = (user) ? '<D:owner>/home/' + user + '</D:owner>' : '<D:unauthenticated>';
        
        d.owner   = (user) ? '/home/' + user : 'unauthenticated';
        
        d.body          = 
          '<?xml version="1.0" encoding="utf-8" ?>\
            <D:lockinfo xmlns:D="DAV:">\
              <D:lockscope>\
                <D:' + d.lockscope + '/>\
              </D:lockscope>\
              <D:locktype>\
                <D:' + d.locktype + '/>\
              </D:locktype>\
              ' + ublk + '\
            </D:lockinfo>'; 
            
        return this.send(d);
      };
      
    /**
     * Attempts to unlock a resource
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_UNLOCK
     * @throws   DAV_UNLOCK_400
     * @throws   DAV_UNLOCK_403
     * @throws   DAV_UNLOCK_409
     */
    this.UNLOCK = function(dav)
      {
        var d = dav || {};
        
        d.method      = 'UNLOCK';
        d.headers       = {
                            'Lock-Token': '<' + d.locktoken + '>'
                          };
                          
        AXIS.XHR.setStatusHandlerForResponse(d, 
          {
            400:  'DAV_UNLOCK_400~~' + d.url,
            403:  'DAV_UNLOCK_403~~' + d.url,
            409:  'DAV_UNLOCK_409~~' + d.url
          });
          
        return this.send(d);
      };
    
    /**
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#rfc.section.9.4
     */  
    this.HEAD = function(dav)
      {
        var d       = dav || {};
        d.method    = 'HEAD';
        
        return this.send(d);
      };
    
    /**
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#rfc.section.9.4
     */  
    this.GET = function(dav)
      {        
        var d       = dav || {};
        d.method    = 'GET';
          
        return this.send(d);
      };
    
    /**
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_POST
     */
    this.POST = function(dav)
      {
        var d       = dav || {};
        d.method    = 'POST';
        
        return this.send(d);
      };
     
    /**
     * NOTE: If no depth header is sent, header is set to depth:0.
     *
     * @type   {Mixed}
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_PROPFIND
     */  
    this.PROPFIND = function(dav)
      {
        var d     = dav || {};
        d.method  = 'PROPFIND';
        
        /*
         * Need to ensure that there is header information sent. Mainly,
         * for a PROPFIND there must be a depth property.
         *
         * Some possible other headers:
         * Apply-To-Redirect-Ref: T
         */
        d.headers = d.headers || {};
        d.headers['Depth'] = d.headers['Depth'] || 0;
        
        return this.send(d);
      };
      
      /**
       * Does a PROPPATCH on a resource.  
       * Takes an array of properties to set and remove
       *
       * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_PROPPATCH
       * @see    #setProperty
       * @see    #removeProperty
       *
       * @example:
       *  setProperties = [{
       *     name: "displayname",
       *     value: "foo.html"   
       *  }, {
       *     ns: "http://www.limebits.com/ns/1.0"
       *     name: "Author",
       *     value: "Fitzgerald"
       *  }];
       *  AXIS.WebDAV.PROPPATCH({url: someURL, setProperties: setProperties});
       */
    
    this.PROPPATCH = function(dav)
      {
        var d              = dav || {};
        d.method           = 'PROPPATCH';
        d.setProperties    = dav.setProperties || [];
        d.removeProperties = dav.removeProperties || [];
      
        d.body             = '<?xml version="1.0" encoding="utf-8" ?>\
                                <D:propertyupdate xmlns:D="DAV:">';
      
        var grouper = function(nm)
          { 
            var props   = d[nm + "Properties"];
            var block   = '<D:' + nm + '><D:prop>';
            for (var i = 0; i < props.length; i++)
              {
                var prop = props[i];
                if (prop.name)
                  {
                    block += "<P:" + prop.name + " xmlns:P=\"" + (prop.ns || "DAV:") + "\">" + prop.value + "</P:" + prop.name + ">"; 
                  }
              }
            block += '</D:prop></D:' + nm + '>';
            return block;
          }
      
        d.body += grouper("set");
        d.body += grouper("remove");
      
        d.body += '</D:propertyupdate>';
        return this.send(d); 
      };
          
    /**
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_MKCOL
     * @param    {Object}  dav     An object containing options for this call.
     * @throws   DAV_MKCOL_405
     */
    this.MKCOL = function(dav)
      {
        var d         = dav || {};
        d.method      = 'MKCOL';    

        AXIS.XHR.setStatusHandlerForResponse(d, 
          { 
            405: 'DAV_MKCOL_405' 
          });
          
        return this.send(d);  
      };
    
    /**
     * Deletes a resource based on sent url.
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_DELETE
     * @throws   DAV_DELETE_404
     */
    this.DELETE = function(dav)
      {
        var d         = dav || {};
        d.method      = 'DELETE';    
        d.headers     = dav.headers || {};

        AXIS.XHR.setStatusHandlerForResponse(d, 
          { 
            404: 'DAV_DELETE_404' 
          });
        
        return this.send(d);  
      };
    
    /**
     * Puts a file (writes the content of the sent .body to a url)
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @throws   DAV_PUT_NO_BODY
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_PUT
     */
    this.PUT = function(dav)
      {
        var d         = dav || {};
        d.method      = 'PUT'; 
        d.headers     = dav.headers || {};
        
        /**
        if(!d.headers['Content-Type'])
          {
            d.headers['Content-Type'] =  'text/html'
          };
         **/
         
         
        /**
         * There must be a body for a PUT, but it is allowed to be 
         * empty (an empty string).  Check for an undefined body.
         */
        if(d.body === undefined)
          {
            new AXIS.Errors.DAVException('DAV_PUT_NO_BODY');  
            return false;
          }
        
        return this.send(d);
      };
    
    /**
     * Will copy a file.  The call object expects you to send a .destination
     * string (the new resource url).  Optionally, you may send a .overwrite 
     * string (`T` || `F`), indicating what to do re: overwrites.  This defaults
     * to `F`. An optional smart copy feature choosing alternate names for you if
     * the destination url is taken.
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @throws   DAV_COPY_403
     * @throws   DAV_COPY_404
     * @throws   DAV_COPY_409
     * @throws   DAV_COPY_412
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_COPY
     */
    this.COPY = function(dav)
      {
        var d         = dav || {};
        d.method      = 'COPY';
        d.origUrl     = d.url;
        
        var depth = (d.headers && d.headers.Depth) ? d.headers.Depth : 'infinity';
        
        if(d.destination === undefined)
          {
            new AXIS.Errors.DAVException('DAV_COPY_NO_DESTINATION');
            return false;  
          }
       
        d.headers     = {
                          Destination:  d.destination,
                          Overwrite:    d.overwrite ? 'T' : 'F',
                          Depth:        depth
                        };

        AXIS.XHR.setStatusHandlerForResponse(d, 
          { 
            403:  'DAV_COPY_403',
            404:  'DAV_COPY_404',
            409:  'DAV_COPY_409',
            412:  !d.tryAlternateNames ? 'DAV_COPY_412' : function() {
              /* Smart copy handler. Tries to find alternate unused name at destination */
              if (d.overwrite) return 'DAV_COPY_412';
              var dst_folder = AXIS.Util.uri.getFolder(d.destination);
              var dst_name = AXIS.Util.uri.basename(d.destination);
              AXIS.WebDAV.PROPFIND({
                url: dst_folder,
                asynch: d.asynch,
                headers: {
                  'Depth': '1'
                },
                callback: function(r) {
                  var responses = r.responseXMLObject().multistatus.response;
                  var children = [];
                  for (var i = 1; i < responses.length; i++)
                    {
                      children.push(AXIS.Util.uri.basename(responses[i].href));
                    }
                  var alternate_name = AXIS.Util.uri.findAlternateName(dst_name, children);
                  return AXIS.WebDAV.COPY({
                    url: d.origUrl,
                    asynch: d.asynch,
                    destination: dst_folder + alternate_name,
                    alternateName: alternate_name,
                    callback: d.callback,
                    on201: d.on201
                  });
                }
              })
            }
          });
          
        /**
         * Need to do more stuff here, reading response for reason
         */
        d.on207 - d.on207 || function()
          {
            // do something here.  
          }
                        
        return this.send(d);
      };
      

    /**
     * Will move a file.  The call object expects you to send a .destination
     * string (the new resource url).  Optionally, you may send a .overwrite 
     * string (`T` || `F`), indicating what to do re: overwrites.  This defaults
     * to `F`.
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @throws   DAV_MOVE_403
     * @throws   DAV_MOVE_404
     * @throws   DAV_MOVE_409
     * @throws   DAV_MOVE_412
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#METHOD_MOVE
     */
    this.MOVE = function(dav)
      {
        var d         = dav || {};
        d.method      = 'MOVE';
     
        if(d.destination === undefined)
          {
            new AXIS.Errors.DAVException('DAV_MOVE_NO_DESTINATION');
            return false;  
          }
       
        d.headers     = {
                          Destination:  d.destination,
                          Overwrite:    d.overwrite ? 'T' : 'F',
                          Depth:        d.depth || 'infinity'
                        };
          
        AXIS.XHR.setStatusHandlerForResponse(d, 
          { 
            403: 'DAV_MOVE_403',
            404: 'DAV_MOVE_404',
            409: 'DAV_MOVE_409',
            412: 'DAV_MOVE_412'
          });
        
        /**
         * Need to do more stuff here, reading response for reason
         */
        d.on207 - d.on207 || function()
          {
            // do something here.  
          }
                        
        return this.send(d);
      };
      
    this.VERSION_CONTROL = function(dav) 
      {
        var d = dav || {};
        d.method = "VERSION-CONTROL";
        this.send(d);
      };
    
    this.CHECKOUT = function(dav) 
      {
        var d = dav || {};
        d.method = "CHECKOUT";
        this.send(d);
      };
      
    this.UNCHECKOUT = function(dav) 
      {
        var d = dav || {};
        d.method = "UNCHECKOUT";
        this.send(d);
      };
    
    this.CHECKIN = function(dav) 
      {
        var d = dav || {};
        d.method = "CHECKIN";
        this.send(d);
      };
    
    /**
     *   Search ported from search.js
     *
     * @param    {Object}  dav     An object containing options for this call.
     *
     * @param    {Object} dav.bitmarks :: An object containing the bitmarks to be obtained 
     *                                  with the resources themselves
     *
     *                    dav.bitmarks.ns:        {String}      Namespace for the bitmarks
     *                    dav.bitmarks.bitmarks:  {Array}       List of bitmarks to fetch
     *
     */
    this.SEARCH = function(dav) 
      {
        // utility
        var _prop_to_xml = this.SEARCH._prop_to_xml;
        
        // options
        var d = dav || {};
        
        d.props         = d.props || ["allprop"],
        d.depth         = d.depth || 1,
        d.where         = d.where || null,
        d.limit         = d.limit || null,
        d.offset        = d.offset || null,
        d.orderby       = d.orderby || null,
        d.bitmarks      = dav.bitmarks || null;
        
        d.url           = d.url;
        d.method        = "SEARCH";
        
        
        /*
          xml builder functions
        */
        
        // TODO  this could probably be abstracted out a bit
        var builder = {
            
          defaultNS : AXIS.WebDAV.ns.bm,
            
          _propXML: function() {
            var props = d.props;
            if (props[0] == 'allprop') {
              return '<allprop/>';
            } else {  
              var propXML = '';
              for (var i=0; i < props.length; i++) {
                propXML += _prop_to_xml(props[i]);
              }
              return '<prop>' + propXML + '</prop>';
            }
          },
          
          _bitmarkXML: function() {
              
              /*
               * bitmark xml is of the form : 
               * <lb:bitmark>
               *    <bm:name/>
               *    <bm:description/>
               *    <bm:tag/>
               * </lb:bitmark>
               */
              
              var retString = '';
              var bmarks = d.bitmarks;
              
              if( bmarks ) {
                  
                  var bitmarkXML = [];
                  
                  var bitmarkNS = d.bitmarks.ns || this.defaultNS;
                  
                  bitmarkXML.push("<lb:bitmark xmlns:lb='" + bitmarkNS + "'>");
                  
                  var bitmarkTemplate = "<lb:name/>";
                  
                  var bitmarkNames = bmarks.names;
                                    
                  for(var i = 0; i < bitmarkNames.length; i++) {
                      bitmarkXML.push( bitmarkTemplate.replace(/name/g, bitmarkNames[i]) );
                  }
                  
                  bitmarkXML.push("</lb:bitmark>");
                  
                  retString = bitmarkXML.join("");
              }
              
              return retString;

          },
          
          _whereXML: function() {
            var whereXML = '';

            if(d.where) {
                whereXML = '<where>' + d.where + '</where>';
            }

            return whereXML;
          },

          _orderbyXML: function() {
            var orderbyXML = '';

            if (d.orderby) {
                orderbyXML += '<orderby><order>';
                orderbyXML += '<prop>' + _prop_to_xml(d.orderby) + '</prop>';
                if (d.order) {
                    orderbyXML += '<' + d.order + '/>';
                }
                orderbyXML += '</order></orderby>';
            }

            return orderbyXML;
          },

          _limitXML: function() {
            var limitXML = '';

            if(d.limit) {
                limitXML = '<limit><nresults>' + d.limit + '</nresults></limit>';
            }

            return limitXML;
          },

          _offsetXML: function() {
            var offsetXML = '';

            if(d.offset) {
                offsetXML = '<offset>' + d.offset + '</offset>';
            }

            return offsetXML;
          }
        }
        
        
        d.body = dav.body || '<?xml version="1.0"?> \
          <searchrequest xmlns="DAV:"> \
            <basicsearch> \
              <select>' + builder._propXML() + builder._bitmarkXML() + '</select> \
              <from> \
                <scope> \
                  <href>' + d.url + '</href> \
                  <depth>' + d.depth + '</depth> \
                </scope> \
              </from> \
              ' + builder._whereXML() + ' \
              ' + builder._orderbyXML() + ' \
              ' + builder._limitXML() + ' \
              ' + builder._offsetXML() + ' \
            </basicsearch> \
          </searchrequest> \
        ';
        
        return this.send(d);
      };
          
    /**
     * Helper methods.
     * Functionality that prepares particular flavours of DAV
     * calls.  The requirement of all of these methods is that
     * they ultimately return the response from a standard
     * DAV method, as defined above.
     */
     
    /**
     * Retrieves a range of bytes from a resource.
     *  
     * @see http://www.faqs.org/rfcs/rfc2616.html
     */
    this.getByteRange = function(dav)
      {
        var d     = dav || {};
        d.method  = 'GET';
        
        /**
         * Must have a byte range...
         */
        if(!d.byteRange)
          {
            new AXIS.Errors.DAVException('DAV_NO_RANGE');
          }  
          
        d.headers             = d.headers || {};
        d.headers['Range']    = 'bytes=' + d.byteRange;
        
        /**
         * A 206 response (partial content) is what you expect;
         * A 416 response (requested range not satisfiable) is of course an error.
         */
        d.failureCodes  = [416];
        
        return this.send(d);
      };  
     
    /**
     * @href http://greenbytes.de/tech/webdav/rfc3253.html#METHOD_REPORT
     * @href http://greenbytes.de/tech/webdav/rfc3744.html#rfc.section.9.1
     * @param    {Object}  dav     An object containing options for this call.
     */
    this.REPORT = function(dav)
      {
        var d         = dav || {};
        d.method      = 'REPORT';    

        return this.send(d);  
      };

    /**
     * @href http://greenbytes.de/tech/webdav/rfc3253.html#REPORT_version-tree
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @see #REPORT
     * @return  The response from #REPORT
     * @type  Object
     */
    this.getVersionTreeReport = function(dav)
      {
        var d     = dav || {};
        d.body    = '<?xml version="1.0" encoding="utf-8" ?>\
                      <D:version-tree xmlns:D="DAV:">\
                        <D:prop>\
                          <D:version-name/>\
                          <D:creator-displayname/>\
                          <D:successor-set/>\
                          <D:getlastmodified/>\
                        </D:prop>\
                      </D:version-tree>';
                      
        d.headers =  {
                       'Depth': 0
                     };

        return this.REPORT(d);
      };
    
    /**
     * @href http://greenbytes.de/tech/webdav/rfc3253.html#REPORT_expand-property
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @see #REPORT
     * @return  The response from #REPORT
     * @type  Object
     */
    this.getExpandPropertyReport = function(dav)
      {
        var d     = dav || {};
        d.body    = '<?xml version="1.0" encoding="utf-8" ?>\
                      <D:expand-property xmlns:D="DAV:">\
                        <D:property name="version-history">\
                          <D:property name="version-set">\
                            <D:property name="creator-displayname"/>\
                            <D:property name="activity-set"/>\
                          </D:property>\
                        </D:property>\
                      </D:expand-property>';

        return this.REPORT(d);
      };

    /**
     * @href http://greenbytes.de/tech/webdav/rfc3744.html#REPORT_acl-principal-prop-set
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @see #REPORT
     * @return  The response from #REPORT
     * @type  Object
     */
    this.getAclPrincipalPropSetReport = function(dav)
      {
        var d     = dav || {};
        d.body    = '<?xml version="1.0" encoding="utf-8" ?>\
                      <D:acl-principal-prop-set xmlns:D="DAV:">\
                        <D:prop>\
                          <D:displayname/>\
                        </D:prop>\
                      </D:acl-principal-prop-set>';
                      
        d.headers =  {
                       'Depth': 0
                     };

        return this.REPORT(d);
      };

    /**
     * @href http://greenbytes.de/tech/webdav/rfc3744.html#REPORT_principal-match
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @see #REPORT
     * @return  The response from #REPORT
     * @type  Object
     */
    this.getPrincipalMatchReport = function(dav)
      {
        var d     = dav || {};
        d.body    = '<?xml version="1.0" encoding="utf-8" ?>\
                      <D:principal-match xmlns:D="DAV:">\
                        <D:principal-property>\
                          <D:owner/>\
                        </D:principal-property>\
                      </D:principal-match>';
                      
        d.headers =  {
                       'Depth': 0
                     };

        return this.REPORT(d);
      };

    /**
     * @href http://greenbytes.de/tech/webdav/rfc3744.html#REPORT_principal-search-property-set
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @see #REPORT
     * @return  The response from #REPORT
     * @type  Object
     */
     
    this.getPrincipalSearchPropertySetReport = function(dav)
      {
        var d     = dav || {};
        d.body    = '<?xml version="1.0" encoding="utf-8" ?>\
                      <D:principal-search-property-set xmlns:D="DAV:"/>';
                      
        d.headers =  {
                       'Depth': 0
                     };

        return this.REPORT(d);
      };

    /**
     * Sets a property on a resource.  Expects a property name.  You may also
     * send an array of properties to set.
     *
     * NOTE: This is essentially an alias to the PROPPATCH method, and expects the
     * arguments defined for that method for *setting* values.  The one thing it
     * does add is the ability to send a single (not array) setValues value, which
     * is promptly converted into an array and sent along.
     *  
     * @param    {Object}  dav     An object containing options for this call.
     * @see      #PROPPATCH
     * @throws   DAV_BAD_PROPSET_ARGS
     */
    this.setProperty = function(dav)
      {
        var d     = dav || {};
  
        if(d.setProperties)
          {
            d.setProperties = (AXIS.isArray(d.setProperties)) ? d.setProperties : [d.setProperties];  
          }
        else
          {
            new AXIS.Errors.DAVException('DAV_BAD_PROPSET_ARGS');
            return false;
          }
          
        return this.PROPPATCH(d);
      };
      
    /**
     * Removes a property on a resource.  Expects a property name.  You may also
     * send an array of properties to remove.
     *
     * NOTE: This is essentially an alias to the PROPPATCH method, and expects the
     * arguments defined for that method for *removing* values. The one thing it
     * does add is the ability to send a single (not array) removeValues value, which
     * is promptly converted into an array and sent along.
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @see      #PROPPATCH
     * @throws   DAV_BAD_PROPREMOVE_ARGS
     */
    this.removeProperty = function(dav)
      {
        var d     = dav || {};
        
        if(d.removeProperties)
          {
            d.removeProperties = (AXIS.isArray(d.removeProperties)) ? d.removeProperties : [d.removeProperties];  
          }
        else
          {
            new AXIS.Errors.DAVException('DAV_BAD_PROPREMOVE_ARGS');
            return false;
          }

        return this.PROPPATCH(d);
      };
      
    this.getProperty = function(dav) 
      {
        var d       = dav || {};
        var props   = d.properties || [];
        var xml     = "";
        var prop;
        
        /**
         * Allowed to send a single property object, or array
         */
        props = AXIS.isArray(props) ? props : [props];
        
        for(var i=0; i < props.length; i++) 
          {
            prop = props[i];
            
            /**
             * Also want to allow the sending of a simple property string
             * if only sending a property name. Instead of:
             *   [{name: 'propname'}]
             * send:
             *   ['propname']
             */
            prop      = AXIS.isObject(prop) ? prop : {name:prop};
            prop.ns   = prop.ns || 'DAV:';
            
            xml += "<P:" + prop.name + " xmlns:P='" + prop.ns + "'/>";
          }
        
        d.body      = '<?xml version="1.0" encoding="utf-8" ?>\
     	                <propfind xmlns="DAV:">\
     	                  <prop>\
     	                    ' + xml + '\
     	                  </prop>\
       	              </propfind>';

       	return this.PROPFIND(d)
      };
      
    /**
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#rfc.section.9.1.4  
     *
     * @param   {Object}  dav  Contains the arguments necessary for call.  At least .url.
     * @see #PROPFIND
     * @return  The response from #PROPFIND
     * @type  Object
     */  
    this.getPropertyNames = function(dav)
      {
        var d         = dav || {};
        d.body        = '<?xml version="1.0" encoding="utf-8" ?>\
           	              <propfind xmlns="DAV:">\
           	                <propname/>\
           	              </propfind>';
	            
        return this.PROPFIND(d);
      };
      
    /**
     * Does a PROPFIND with <allprop>.  Allows inclusion (<include>).
     *
     *  DAVObject {
     *              .url: 'foo.html',
     *              .includes: [
     *                'supported-live-property-set',
     *                'supported-report-set'
     *              ]
     *            }
     *
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#rfc.section.9.1.5
     * @href http://greenbytes.de/tech/webdav/rfc4918.html#rfc.section.9.1.6 
     *
     * @param   {Object}  dav Contains the arguments necessary for call.  At least #url.
     * @see #PROPFIND
     * @return  The response from #PROPFIND
     * @type  Object
     */  
    this.getAllProperties = function(dav)
      {
        var d         = dav || {};     
        d.body        = '<?xml version="1.0" encoding="utf-8" ?>\
           	              <D:propfind xmlns:D="DAV:">\
           	                <D:allprop/>';
        
        if(d.includes && AXIS.isArray(d.includes))
          {
            d.body    +=  '<D:include>'; 
            for(var i=0; i < d.includes.length; i++)
              {
                d.body += '<D:' + d.includes[i] + '/>';
              }
           	d.body    +=  '</D:include>';
          }              
        d.body        += '</D:propfind>';

        return this.PROPFIND(d);
      };
      
    /**
     * Gets all properties on a resource.  A resouce can either be a single "file", 
     * or a collection resource (folder).  For a collection, this would fetch you
     * a collection ("directory") listing, with each "sub" resource described in the 
     * same way it would have been had its properties been requested via this method. 
     *
     * Because this dual nature of resources may be strange or ambiguous to some,
     * and due to the very real possibility that the resource type of the url passed 
     * to this call is not known in advance, we add a useful object with semi-parsed
     * data to the return object, so that the developer can easily determine the
     * type of resource returned, as well as all bound resources in the case
     * of collections.
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @see #PROPFIND
     * @return  The response from #PROPFIND
     * @type  Object
     */
    this.readFolder = function(dav)
      {
        var d         = dav || {};

        var withCups  = !!dav.withCups;

        d.body        = '<?xml version="1.0" encoding="utf-8" ?>\
           	              <propfind xmlns="DAV:">\
           	                <allprop/>';
        
        if(withCups)
          {
            d.body  +=  '   <include>\
                              <current-user-privilege-set/>\
           	                </include>';
          }
          
        d.body      +=  '</propfind>';
        
        d.headers     =  {
                            'Depth': 1
                         };

        /**
         * Ensure that our new properties are set in the return object by 
         * creating this proxy callback which passes on the info.
         */
        var c2    = d.responseProcessor || AXIS.F;
        d.responseProcessor  = function(r)
          {
            var resObBuild = function(resOb)
              {
                /**
                 * Check the response.  If with Cups, then each response
                 * object will contain two propstat responses, meaning that
                 * response.propstat will be an Array; if not with Cups, then
                 * it is not.  Check for this, and build the return object
                 * with added Cups info, if required.
                 */
                var rPS       = resOb.propstat;
                var wC        = AXIS.isArray(rPS);
                var rP        = wC ? rPS[0] : rPS;
                var rC        = wC ? rPS[1] : rPS;
                
                var ret =
                  {
                    properties:   rP.prop,
                    href:         resOb.href,
                    type:         rP.prop.resourcetype ? 'collection' : 'file'
                  };
                  
                if(wC)
                  {
                    var cOb   = function(c)
                      {
                        this.privileges = {};
                        
                        for(w=0; w < c.length; w++)
                          {
                            /**
                             * An unfortunate consequence of the
                             * way that responseXMLObject() works...
                             */
                            for(var s in c[w])
                              {
                                this.privileges[s] = true;
                              }
                          }
                        
                        this.hasPrivilege = function(p)
                          {
                            p = p || 'x';
                            
                            return this.privileges.hasOwnProperty(p); 
                          };
                      };
                    
                    ret.Cups = new cOb(rC.prop['current-user-privilege-set'].privilege);
                  }
                
                return ret;
              }

            try
              {
                var st      = r.responseXMLObject().multistatus.response;
                var res     = AXIS.isArray(st) ? st : [st];
                   
                /**
                 * The [0] element is the folder info itself.
                 */
                r.folder = resObBuild(res[0]);
                
                r.folder.children = [];
                              
                /**
                 * Build the result list, pushing the resource object's propstat.prop(s). 
                 * Note that we are adding the #href and #type properties to each resource
                 * object.  The resource at [0] index is the original called resource, so
                 * we start at [1].
                 */
                for(var x=1; x < res.length; x++)
                  {
                    r.folder.children.push(resObBuild(res[x]));
                  }
              }
            catch(e){};

            c2(r);
          }
        
        return this.PROPFIND(d);
      };
      
    this.emptyFolder = function(dav)
      {
        var d = dav || {};
   
        if(AXIS.isString(d.url) === false)
          {
            return;  
          }
        
        var f = this.readFolder({
          url: d.url,
          onSuccess: function(r) 
            {
              var fL = r.folder.children;
              
              for(var x=0; x < fL.length; x++)
                {
                  AXIS.WebDAV.DELETE({
                    url: fL[x].href
                  });
                }
            }
        });
      };
      
    /**
     * Checks if a file exists. Note that this is a forced synchronous
     * call, a PROPFIND, that returns an object containing information about
     * resource:
     *
     * {String}   resourcetype    One of 'collection' or 'file'.
     * {String}   contenttype     'text/html', 'applications/javascript'...
     * {Boolean}  success         Whether file was found. 
     */
    this.fileInfo = function(dav)
      {
        var d   = dav || {};
                
        return AXIS.WebDAV.getProperty({
          url:        d.url,
          asynch:     !!d.asynch, // note that this defaults to false
          properties: [ 'getcontenttype',
                        'resourcetype'
                      ],
          callback:   d.callback || AXIS.F,
          responseProcessor: function(r) {
          
            var rX, txt;
            
            r.success       = false;
            r.contenttype   = null;
            r.resourcetype  = 'file';
            r.Caller        = r
            
            if(r.getStatus() === 207)
              {
                /**
                 * Fetch correct nodes from returned document.
                 */
                var rType = AXIS.Util.xml.getChildrenByNameNS(r.responseXML.documentElement, 'resourcetype');
                
                var cType = AXIS.Util.xml.getChildrenByNameNS(r.responseXML.documentElement, 'getcontenttype');
    
                /**
                 * #resourcetype set to 'collection' or 'file'.
                 */
                if(rType[0].firstChild)
                  {
                    if(rType[0].firstChild.nodeName === 'D:collection')
                      {
                        r.resourcetype = 'collection';  
                      }
                    else
                      {
                        r.resourcetype = 'file';  
                      }
                  }
                else
                  {
                    txt = AXIS.Util.xml.getText(rType[0]);
                    r.resourcetype =  txt === 'collection' 
                                      ? 'collection' 
                                      : 'file'
                  }
                
                r.contenttype = cType[0] ? AXIS.Util.xml.getText(cType[0]) : '';
                  
                r.success = true;
              }
          }
        }); 
      };
      
    this.mkcolParents = function(dav) 
      {
        var self = this;
        var d = dav || {};
        var parentUrl = d.url.replace(/\/[^\/]*\/?$/, '/');

        var d2 = AXIS.merge(dav, {
            on409: function() {
                self.mkcolParents({ 
                    url: parentUrl,
                    onSuccess: function() {
                        self.MKCOL(d);
                    }
                });
            }
        });

        self.MKCOL(d2);
    }
            
/***********************************
 * START ACL
 ***********************************/

    var Acl = function(aceElements)
      {
        if (AXIS.isIE)
          {
            var acl = [];
            AXIS.Util.lang.augmentObject(acl, this);
            acl.parseAceElements(aceElements);

            acl.indexOf = function(e, i) 
              {
                i = i || 0;

                if (i < 0) 
                  {
                    i = this.length + (i % this.length);
                  }

                for (; i < this.length; i++) 
                  {
                    if (this[i] === e) 
                      {
                        return i;
                      }
                  }

                return -1;
              }
            return acl;
          }

        this.parseAceElements(aceElements);
      }

    Acl.prototype = new Array;

    AXIS.Util.lang.augmentObject(Acl,
      {
        printPrincipal: function(prin,p)
          {
            var pretty = p || false;
            var p_str = pretty ? '' : '<D:principal>';
            var t;
            
            switch(prin[0])
              {
              case AXIS.WebDAV.PRINCIPAL_ALL:
                p_str += pretty ? 'All' : '<D:all/>';
                break;
              case AXIS.WebDAV.PRINCIPAL_AUTHENTICATED:
                p_str += pretty ? 'Authenticated' : '<D:authenticated/>';
                break;
              case AXIS.WebDAV.PRINCIPAL_UNAUTHENTICATED:
                p_str += pretty ? 'UnAuthenticated' : '<D:unauthenticated/>';
                break;
              case AXIS.WebDAV.PRINCIPAL_SELF:
                p_str += pretty ? 'Self' : '<D:self/>';
                break;
              case AXIS.WebDAV.PRINCIPAL_PROPERTY:
                if(prin[1][1] == "DAV:")
                  {
                    t = "<D:" + prin[1][0] + "/>";
                  }
                else
                  {
                    t = "<" + prin[1][0] + " xmlns='" + prin[1][1] + "'/>";
                  }
                  
                if(pretty)
                  {
                    p_str += t;
                  }
                else
                  {
                    p_str += '<D:property>' + t + '</D:property>';
                  }
                break;
              case AXIS.WebDAV.PRINCIPAL_USER:
                t = AXIS._siteData.hosts.limebits + "users/" + prin[1];
                if(pretty)
                  {
                    p_str += t;
                  }
                else
                  {
                    p_str += '<D:href>' + t + '</D:href>';
                  }
                break;
              case AXIS.WebDAV.PRINCIPAL_GROUP:
                t = AXIS._siteData.hosts.limebits + "groups/" + prin[1];
                if(pretty)
                  {
                    p_str += t;  
                  }
                else
                  {
                    p_str += '<D:href>' + t + '<D:href>';
                  }
                break;
              case AXIS.WebDAV.PRINCIPAL_HREF:
                p_str += pretty ? prin[1] : '<D:href>' + prin[1] + '</D:href>';
                break;
              }
            p_str += "</D:principal>";
            return p_str;
          },

        printPrivileges: function(privs)
          {
            var p_str = "";
            for (var i = 0; i < privs.length; i++)
              {
                var priv = privs[i];
                p_str += "<D:privilege>";
                if (priv[0] == "DAV:")
                  p_str += "<D:" + priv[1] + "/>";
                else
                  p_str += "<" + priv[1] + " xmlns='" + priv[0] + "'/>";
                p_str += "</D:privilege>";
              }
            return p_str;
          },

        /**
         * Get an array of privilge strings from the corresponding XML elements
         *
         * @param    {Array}       an array of D:privilege XML elements
         */
        getPrivilegesFromElements: function(elems)
          {
            var privs = [];
            for (var i = 0; i < elems.length; i++)
              {
                var j;
                for (j = 0; j < elems[i].childNodes.length && elems[i].childNodes[j].nodeType != AXIS.ELEMENT_NODE; j++);
              
                var priv = elems[i].childNodes[j].nodeName;
                priv = priv.split(":").pop();
                var priv_ns = elems[i].childNodes[j].namespaceURI;

                privs.push([priv_ns, priv]);
              }

            return privs;
          }
      });

    AXIS.Util.lang.augmentObject(Acl.prototype, 
      {
        parseAceElements: function(aces_el) {
          this.protectedAces = [];
          this.editableAces = [];
          this.inheritedAces = [];

          this.protectedAces.makeAce = this.editableAces.makeAce = this.inheritedAces.makeAce = Acl.prototype.makeAce;
          this.protectedAces.findAces = this.editableAces.findAces = this.inheritedAces.findAces = Acl.prototype.findAces;

          for (var i = 0; i < aces_el.length; i++)
            {
              var ace_el = aces_el[i];
              var principal = this.getPrincipalFromElem(AXIS.Util.xml.getChildrenByNameNS(ace_el, "principal")[0]);

              var grant;
              var inherited = false;
              var isProtected = false;
              if (AXIS.Util.xml.getChildrenByNameNS(ace_el, "protected").length)
                isProtected = true;

              var inherited = AXIS.Util.xml.getChildrenByNameNS(ace_el, "inherited")[0];
              inherited = inherited ? AXIS.Util.xml.getText(AXIS.Util.xml.getChildrenByNameNS(inherited, "href")[0]) : false;

              grant = AXIS.Util.xml.getChildrenByNameNS(ace_el, "grant").length ? true : false;

              var privs = Acl.getPrivilegesFromElements(AXIS.Util.xml.getChildrenByNameNS(ace_el, "privilege"));

              var ace = this.makeAce(grant, privs, principal, isProtected, inherited);

              if (isProtected)
                this.protectedAces.push(ace);
              else if (inherited)
                this.inheritedAces.push(ace);
              else
                this.editableAces.push(ace);
            }

          for (var i = 0; i < this.protectedAces.length; i++)
            this.push(this.protectedAces[i]);
          for (var i = 0; i < this.editableAces.length; i++)
            this.push(this.editableAces[i]);
          for (var i = 0; i < this.inheritedAces.length; i++)
            this.push(this.inheritedAces[i]);

          this._origACL = this.printXML(true);
        },

        /**
         * Gets an internal representation of the principal element in XML.
         *
         * @param    {Object}  el     A principal element in an xml doc.
         * @return   An internal represention of the element using an array.
         * @href http://greenbytes.de/tech/webdav/rfc3744.html#ace.principal
         */
        getPrincipalFromElem: function(el)
          {
            var principal = null;
            var href = AXIS.Util.xml.getChildrenByNameNS(el, "href", "DAV:");
            if (href.length > 0)
              {
                href = AXIS.Util.xml.getText(href[0]);
                if (href.indexOf(AXIS._siteData.hosts.limebits + "users/") == 0)
                  principal = [AXIS.WebDAV.PRINCIPAL_USER, AXIS.Util.uri.basename(href)];
                else if (href.indexOf(AXIS._siteData.hosts.limebits + "groups/") == 0)
                  principal = [AXIS.WebDAV.PRINCIPAL_GROUP, AXIS.Util.uri.basename(href)];
                else
                  principal = [AXIS.WebDAV.PRINCIPAL_HREF, href];
                return principal;
              }

            if (AXIS.Util.xml.getChildrenByNameNS(el, "all").length == 1)
              principal = [AXIS.WebDAV.PRINCIPAL_ALL];
            else if (AXIS.Util.xml.getChildrenByNameNS(el,"authenticated").length == 1)
              principal = [AXIS.WebDAV.PRINCIPAL_AUTHENTICATED];
            else if (AXIS.Util.xml.getChildrenByNameNS(el, "unauthenticated").length == 1)
              principal = [AXIS.WebDAV.PRINCIPAL_UNAUTHENTICATED];
            else if (AXIS.Util.xml.getChildrenByNameNS(el, "self").length == 1)
              principal = [AXIS.WebDAV.PRINCIPAL_SELF];
            else
              { 
                var prop_el = AXIS.Util.xml.getChildrenByNameNS(el, "property")[0];
                if (prop_el)
                  {
                    var j;
                    for (j = 0; j < prop_el.childNodes.length && prop_el.childNodes[j].nodeType != AXIS.ELEMENT_NODE; j++);
                    prop_el = prop_el.childNodes[j];

                    principal = [AXIS.WebDAV.PRINCIPAL_PROPERTY, [prop_el.nodeName.split(":").pop(), prop_el.namespaceURI]];
                  }
              }
            return principal;
          },

        /**
         * Creates an internal representation of an ace
         *
         * @param    {Boolean}        grant         If true, creates a grant ace. If false, creates a deny ace.
         * @param    {Array/String}   privs         An array of privileges to be managed by this ace. Each privilege is itself an array of the form ["namespace", "privilege"]. For convenience, if the namespace is "DAV:", the privilege can be represented by the string "privilege". If providing exactly one privilege, and it is in the "DAV:" namespace, this parameter can be the string "privilege". Egs: [["http://limebits.com/ns/1.0/", "read-private-properties"]]; [["DAV:", "read"], "write-content"]; "write-content"; 
         * @param    {Acl.prin_t}     principal     Principals affected by this ace
         * @param    {Boolean}        isProtected (optional)  If true, create an ace marked as protected. Defaults to false
         * @param    {String}         inherited (optional)    A string containing the href of the resource this ace is inherited. Defaults to creating an uninherited ace.
         * @return   {Object}         An object representing the ace
         * @href http://greenbytes.de/tech/webdav/rfc3744.html#PROPERTY_acl
         */
        makeAce: function(grant, privs, principal, isProtected, inherited)
          {
            isProtected = isProtected ? true : false;
            inherited = inherited ? inherited : false;

            if (privs instanceof Array)
              {
                for (var i = 0; i < privs.length; i++)
                  {
                    var priv = privs[i];
                    if (!(priv instanceof Array))
                      privs[i] = ["DAV:", priv];
                  }
              }
            else if (typeof privs === 'string')
              privs = [["DAV:", privs]];
            else
              new AXIS.Errors.DAVException('DAV_ACE_INVALID_PRIVILEGES');

            privs.hasPriv = function(priv, priv_ns)
              {
                if (priv_ns == null)
                  priv_ns = "DAV:";

                for (var i = 0; i < privs.length; i++)
                  {
                    var p = privs[i];
                    if (priv_ns == p[0] && priv == p[1] )
                      return true;
                  }
                return false;
              }

            if (!(principal instanceof Array))
              principal = [principal];

            return {
              principal: principal,
              isProtected: isProtected,
              inherited: inherited,
              grant: grant,
              privs: privs
            };
          },

        findAces: function(grant, privs, principal)
          {
            var ace = this.makeAce(grant, privs, principal);
            var matchingAces = [];
            for (var i = 0; i < this.length; i++)
              {
                if (ace.grant == null || this[i].grant == ace.grant)
                  {
                    if (Acl.printPrincipal(this[i].principal) == Acl.printPrincipal(ace.principal))
                      {
                        for (var j = 0; j < ace.privs.length; j++)
                          if (this[i].privs.hasPriv(ace.privs[j][1], ace.privs[j][0]))
                            matchingAces.push(this[i]);
                      }
                  }
              }
            return matchingAces;
          },

        isGrantedRead: function(principal)
          {
            var matchingAces = this.findAces(null, ['read', 'all'], principal);
            if (matchingAces.length)
              return matchingAces[0].grant;

            return false;
          },

        /**
         * Checks if a provided ace conflicts with any of the existing protected or editable aces
         *
         * @param    {Object}         ace         Object containing the details of the ace that needs to be added
         * @throws   DAV_ACE_CONFLICT
         * @href http://greenbytes.de/tech/webdav/rfc3744.html#rfc.section.8.1.3
         */
        checkAceConflict: function(ace)
          {
            for (var i = 0; i < this.length; i++)
              {
                if (this[i].inherited && !this[i].isProtected)
                  continue;

                if (this[i].grant ? !ace.grant : ace.grant)
                  {
                    if (Acl.printPrincipal(this[i].principal) == Acl.printPrincipal(ace.principal))
                      {
                        for (var j = 0; j < ace.privs.length; j++)
                          if (this[i].privs.hasPriv(ace.privs[j][1], ace.privs[j][0]))
                            new AXIS.Errors.DAVException('DAV_ACE_CONFLICT~~' + "Ace " + this.printACE(ace)+ " conflicts with" + (this[i].isProtected ? " protected" : "") + " ace " + this.printACE(this[i]));
                      }
                  }
              }
          },

        /**
         * Checks if a provided ace conflicts with any of the existing protected or editable aces
         *
         * @param    {Boolean}        grant         If true, adds a grant ace. If false, adds a deny ace.
         * @param    {Array/String}   privs         see @param privs of makeAce 
         * @param    {Acl.prin_t}     principal     see @param principal of makeAces
         * @param    {Integer}        index (optional)   The position in the acl at which to add the ace. The index must be within the editable aces
         * @return   {Integer}                      The position at which the ace was actually added
         * @throws   DAV_ACE_CONFLICT
         * @href http://greenbytes.de/tech/webdav/rfc3744.html#rfc.section.8.1.3
         */
        addAce: function(grant, privs, principal, index)
          {
            var ace = this.makeAce(grant, privs, principal);
            this.checkAceConflict(ace);

            if (index == null || index < this.protectedAces.length) /* Insert at the head of the editable aces */
              index = this.protectedAces.length;
            else if (index > this.protectedAces.length + this.editableAces.length) /* Insert at the tail of the editable aces */
              index = this.protectedAces.length + this.editableAces.length;

            this.editableAces.splice(index - this.protectedAces.length, 0, ace);
            this.splice(index, 0, ace);

            return index;
          },

        /**
         * Removes the editable ace at a given index
         *
         * @param    {Integer}   index       The index of the ace which is to be removed
         * @throws   DAV_ACL_CANNOT_REMOVE_PROTECTED_ACE
         * @throws   DAV_ACL_CANNOT_REMOVE_INHERITED_ACE
         * @throws   DAV_ACL_CORRUPTED
         */
        removeAce: function(index)
          {
            if (this[index].isProtected)
              new AXIS.Errors.DAVException('DAV_ACL_CANNOT_REMOVE_PROTECTED_ACE');

            if (this[index].inherited)
              new AXIS.Errors.DAVException('DAV_ACL_CANNOT_REMOVE_INHERITED_ACE');

            var edIndex = index - this.protectedAces.length;

            if (this[index] != this.editableAces[edIndex])
              new AXIS.Errors.DAVException('DAV_ACL_CORRUPTED');

            this.editableAces.splice(edIndex, 1)
            return this.splice(index, 1)[0];
          },

        /**
         * Removes all the editable aces in this acl
         *
         * @throws   DAV_ACL_CORRUPTED
         */
        clearEditableAces: function()
          {
            this.splice(this.protectedAces.length, this.editableAces.length);
            this.editableAces.splice(0, this.editableAces.length);
            if (this.length != this.protectedAces.length + this.inheritedAces.length)
              new AXIS.Errors.DAVException('DAV_ACL_CORRUPTED');
          },

        printACE: function(ace)
          {
            var aceXML = "";
            aceXML += "<D:ace>";
            aceXML += Acl.printPrincipal(ace.principal);
            aceXML += "<D:" + (ace.grant ? "grant" : "deny") + ">";
            aceXML += Acl.printPrivileges(ace.privs);
            aceXML += "</D:" + (ace.grant ? "grant" : "deny") + ">";
            if (ace.isProtected)
              aceXML += "<D:protected/>";
            else if (ace.inherited)
              aceXML += "<D:inherited><D:href>" + ace.inherited + "</D:href></D:inherited>";
            aceXML += "</D:ace>";
            return aceXML;
          },

        /**
         * Print the aces of the acl
         *
         * @param   {Boolean}    editableOnly (optional)   If true, outputs only the editable aces.
         * @return  {String}     The acl property as a string
         */
        printXML: function(editableOnly)
          {
            var aclArray = editableOnly ? this.editableAces : this;
            var aclXML = '<D:acl xmlns:D="DAV:">';

            for (var i = 0; i < aclArray.length; i++)
              aclXML += this.printACE(aclArray[i]);
            aclXML += "</D:acl>";
            return aclXML;
          }
      });
    this.Acl = Acl;

    /**
     * Gets the Current User Privilege Set for a resource.
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @href http://greenbytes.de/tech/webdav/rfc3744.html#PROPERTY_current-user-privilege-set
     */
    this.getCUPS = function(dav)
      {
        var d     = dav || {}

        d.body    = '<?xml version="1.0" encoding="utf-8" ?>\
                    <D:propfind xmlns:D="DAV:">\
                      <D:prop>\
                        <D:current-user-privilege-set/>\
                      </D:prop>\
                    </D:propfind>';

        /**
         * On a successful response, we create a simple accessor for CUPS, extending
         * the response with an .allows method, letting the developer now check
         * directly if a user has a given priviledge by checking value of 
         * response.allows('write'), for example.
         */  
        d.responseProcessor = function(r)
          {
            var ps = AXIS.Util.xml.getChildrenByNameNS(r.responseXML.documentElement, "propstat", "DAV:")[0];
            var st = AXIS.Util.xml.getChildrenByNameNS(ps, "status", "DAV:")[0].firstChild.nodeValue;

            if (st.indexOf("200 OK") < 0)
              return null;

            var privs = Acl.getPrivilegesFromElements(AXIS.Util.xml.getChildrenByNameNS(ps, "privilege"));

            privs.hasPriv = function(priv, priv_ns)
              {
                if (priv_ns == null)
                  priv_ns = "DAV:";

                for (var i = 0; i < privs.length; i++)
                  {
                    var p = privs[i];
                    if (priv_ns == p[0] && priv == p[1] )
                      return true;
                  }
                return false;
              }

            r.privs = privs;
            r.allows = privs.hasPriv; // backward compatibility
            return privs;
          };

        return this.PROPFIND(d);
      };

    /**
     * Gets the ACL for a resource.
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @href http://greenbytes.de/tech/webdav/rfc3744.html#rfc.section.5.5.5
     */
    this.getACL = function(dav)
      {
        var d     = dav || {};
        
        d.body    = '<?xml version="1.0" encoding="utf-8" ?>\
                      <D:propfind xmlns:D="DAV:">\
                        <D:prop>\
                          <D:acl/>\
                        </D:prop>\
                      </D:propfind>';
                      
        /**
         * On a successful response, we create an array of ACE's, to facilitate
         * access for the developer.  Could probably do more here.
         */  
        d.responseProcessor = function(r)
          {
            var ps = AXIS.Util.xml.getChildrenByNameNS(r.responseXML.documentElement, "propstat")[0];
            var st = AXIS.Util.xml.getChildrenByNameNS(ps, "status")[0].firstChild.nodeValue;

            /* FIXME: handle this error better */
            if (st.indexOf("200 OK") < 0)
              return null;

            var acl = new AXIS.WebDAV.Acl(AXIS.Util.xml.getChildrenByNameNS(ps, "ace"));

            r.aces = acl;
            return acl;
          }

        return this.PROPFIND(d);
      };


    /**
     * Attempts to set the ACL on a resource
     *
     * @param    {Object}  dav     An object containing options for this call.
     * @href http://greenbytes.de/tech/webdav/rfc3744.html#METHOD_ACL
     * @throws   DAV_ACL_CHANGED
     */
    this.setACL = function(dav)
      {
        var d = dav || {};
        d.method      = 'ACL';
        return this.getACL(
          {
            url: d.url,
            asynch: d.asynch,
            callback: function(r, newAcl)
              {
                if (newAcl.printXML() != d.acl._origACL)
                  new AXIS.Errors.DAVException("DAV_ACL_CHANGED");

                var acl = d.acl.printXML(true);

                d.body        = '<?xml version="1.0"?>' + acl;
                return AXIS.WebDAV.send(d);
              }
          });
      };

/*******************************
 * END ACL
 *******************************/

    
    /**
     * Does checks on send arguments, prepares a proper  
     * call object, and returns it.  NOTE that since this object is a DAV-specific
     * preparation of an XHR call, and will ultimately be sent as an XHR call,  
     * the object is further (more strongly) validated within Loader.load().
     *
     * @private
     * @param   {Object}  dav    This is passed through by each DAV method, and
     *                            is the original arg object sent by user
     * @return  A properly prepared call.
     * @type  Object
     */
    this._prepare = function(dav)
      {
        dav.asynch        = (dav.asynch === undefined) ? false : !!dav.asynch;
        dav.loadingMsg    = dav.loadingMsg || 'DAV::' + dav.method + '::' + dav.url;
        
        /**
         * Make sure sent object has .headers set; if not, empty object.
         */
        dav.headers       = dav.headers || {};

        /*
         * Gives the returned object the ability to fetch the
         * response in object form (allowing for easy iteration)
         */
        dav.responseXMLObject = this._responseXMLObject;
        
        /**
         * Do some pruning of empty space if we can.
         */
        dav.body && dav.body.replace(/(\>\s*\<)/g, "><");
        
        return dav;
      };
      
    /**
     * Makes the Loader call, passing the DAV call object.
     *
     * @param   {Object}  dav A WebDAV call object.
     * @return  Reference to call object in AXIS.Queue if successful; false if not
     * @type  Object
     */
    this.send = function(dav)
      {
        var p = this._prepare(dav || {});
        if(p)
          {
            return AXIS.Loader.load(p);
          }
        
        return false;
      };
    
    /**
     * Function attached as a public method of an XML response.
     * Freely distributable under the terms of an MIT-style license.
     *
     * @private
     * @see #prepare.
     * @author Shinichi Tomita <shinichi.tomita@hotmail.com>
     * @modified Sandro Pasquali - repackaged as XHR response handler
     */
    this._responseXMLObject = function(withAtts) 
      {
        if(this.httpHandle && this.httpHandle.responseXML)
          {
            var o = dom2obj(this.httpHandle.responseXML.documentElement);
            var obj = {};
            obj[o.tag] = o.value;
            return obj; 
          }
        else
          {
            return false;  
          }
          
        function dom2obj(elem) 
          {
            if(elem.nodeType == AXIS.TEXT_NODE) 
              {
                return elem.data;
              }
            else if(elem.nodeType == AXIS.ELEMENT_NODE) 
              {
                var obj = {};
                var hasprops = false;
                for(var i=0; i<elem.attributes.length; i++) 
                  {
                    hasprops = true;
                    var attr = elem.attributes[i];
                    
                    if(typeof withAtts == "undefined")
                      {
                        if(attr.nodeName.match(/^xmlns/)) 
                          {
                            if (elem.attributes.length == 1) 
                              {
                                hasprops = false;
                              }
                            continue;
                          }
                      }
                      
                    obj[attr.nodeName] = attr.nodeValue;
                  }
                for(var i=0; i<elem.childNodes.length; i++) 
                  {
                    var childObj = dom2obj(elem.childNodes[i]);
                    if(childObj.tag) 
                      {
                        hasprops = true;
                        if(obj[childObj.tag]) 
                          {
                            if(AXIS.isArray(obj[childObj.tag]) === false) 
                              {
                                obj[childObj.tag] = [ obj[childObj.tag] ];
                              }
                            obj[childObj.tag].push(childObj.value);
                          } 
                        else 
                          {
                            obj[childObj.tag] = childObj.value;
                          }
                      } 
                    else 
                      { // text content
                        // don't fill the obj with empty linebreaks
                        // - wil
                        if (!childObj.match(/^\n$/i)) 
                          {
                            obj['#'] = childObj;
                          }
                      }
                  }
                if(!hasprops) 
                  {
                    obj = obj['#'] ? obj['#'] : null;
                  }
                return { tag : elem.tagName.replace(/^\w+:/, ''), value : obj };
              }
            return {};
          }
      };
  };
