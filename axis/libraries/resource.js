AXIS.createNamespace("Resource");

$AXIS.Resource = function(args)
  {
    var aob = args || {};
    
    if(aob.url === undefined)
      {
        return {};
      }
    
    /**
     * Register errors
     */
    AXIS.Errors.createExceptionType('ResourceACLException');
    AXIS.Errors.registerCode("RESOURCE_ACL_need-privileges","403 > Resource.commitAclChanges() #need-privileges > You don't have permission to set the Acl on this resource.");
    AXIS.Errors.registerCode("RESOURCE_ACL_no-ace-conflict","Resource.commitAclChanges() #no-ace-conflict > The ACEs submitted in the ACL request MUST NOT conflict with each other");
    AXIS.Errors.registerCode("RESOURCE_ACL_no-protected-ace-conflict","Resource.commitAclChanges() #no-protected-ace-conflict > The ACEs submitted in the ACL request MUST NOT conflict with the protected ACEs on the resource. For example, if the resource has a protected ACE granting DAV:write to a given principal, then it would not be consistent if the ACL request submitted an ACE denying DAV:write to the same principal.");
    AXIS.Errors.registerCode("RESOURCE_ACL_recognized-principal","Resource.commitAclChanges() #recognized-principal > Every principal URL in the ACL request MUST identify a principal resource.");
    
    AXIS.Errors.registerCode("RESOURCE_ACL_400","Resource.commitAclChanges() #400 > There was an internal error.  Try again later.");
    AXIS.Errors.registerCode("RESOURCE_ACL_401","Resource.commitAclChanges() #401 > This operation requires that you be logged in.");
    AXIS.Errors.registerCode("RESOURCE_ACL_","Resource.commitAclChanges() #403 > You don't have permission to access this resource.");
    AXIS.Errors.registerCode("RESOURCE_ACL_404","Resource.commitAclChanges() #404 > The server is unable to find the resource you've requested.  It is possible the file has been deleted by someone else since you first began working with it.");
    AXIS.Errors.registerCode("RESOURCE_ACL_423","Resource.commitAclChanges() #423 > This resource is locked, or has been locked since you began working with it.");
    
    AXIS.Errors.registerCode("RESOURCE_ADDACE_BAD_PRIVILEGE_LIST","Resource.addAce() > The argument object sent contained privileges that are not supported.  Request ignored.");
    AXIS.Errors.registerCode("RESOURCE_ADDACE_BAD_PRINCIPAL_DEF","Resource.addAce() > The arguments passed to define a principal for this Ace were not understood.  Request ignored.");
    AXIS.Errors.registerCode("RESOURCE_ADDACE_BAD_ARGS","Resource.addAce() > The argument object sent was not understood.  Probably one or more properties are missing.");

    /**
     * If true, the resource will be locked prior to being mapped.
     */
    var autolock = aob.autolock === undefined ? true : false; 
    
    /**
     * The Resource object must be trustworthy. The bound source, the privileges,
     * the owner, etc, cannot be changed by some errant external method or some
     * real damage might be done to the resource.  As such, we create closures
     * on the following key variables, which therefore can be modified only via 
     * methods -- making them private.
     */
    var resourceURL         = aob.url;
    
    /**
     * @see #setETag
     * @see #mapPropertyModel
     */
    var origETag            = '';
    
    /**
     * @see #setLastModified
     * @see #mapPropertyModel
     */
    var origLastModified    = '';
    
    /**
     * These are set after initialization DAV ACL call. 
     */
    var owner               = '';
    var inheritedAces       = [];
    var protectedAces       = [];
    var editableAces        = [];
    var resourceLocks       = [];
    
    /**
     * The original origPropertyDOM.  This does not change.
     */
    var origPropertyDOM     = {};
    
    /**
     * A copy of origPropertyDOM that is actually manipulated.  
     */
    var workingPropertyDOM  = {};
    
    var supportedLocks = 
      {
        'exclusivewrite':   true,
        'sharedwrite':      true  
      };
    
    /**
     * Available privileges.  Boolean value changed below,
     * based on actual user privileges for this resource.
     */
    var privileges = 
      {
        'read':                             false, 
        'read-acl':                         false, 
        'read-current-user-privilege-set':  false, 
        'write-acl':                        false, 
        'unlock':                           false, 
        'write':                            false, 
        'write-properties':                 false, 
        'write-content':                    false, 
        'bind':                             false, 
        'unbind':                           false, 
        'all':                              false, 
        'read-private-properties':          false
      };

    /**
     * These are the principals which are understood by this interface as
     * valid ACE principals.
     */
    var principals = 
      {
        'all':                0,
        'authenticated':      1,
        'unauthenticated':    2,
        'self':               3,
        'property':           4,
        'href':               5
      }; 
    
    /*****************************************
     
     API.  This is returned as the operating scope.
     
     *****************************************/
    var API = function()
      {
        this.getElementsByTagNameNS = function(ob)
          {
            var b = ob || {};
            
            var name      = ob.name   || '';
            var ns        = ob.ns     || 'DAV:';
            var doc       = ob.doc    || workingPropertyDOM;
            var res       = [];
            
            if(AXIS.isFunction(doc.getElementsByTagNameNS))
              {
                res = doc.getElementsByTagNameNS(ns, name);
              }
            else 
              {
                doc.ownerDocument.setProperty("SelectionLanguage", "XPath");
                doc.ownerDocument.setProperty("SelectionNamespaces", "xmlns:pref='" + ns + "'");
    
                res = doc.selectNodes("//pref:" + name);
              }
            
            return res;
          };
        
        /**
         * Retrieves a node from the #workingPropertyDOM. NOTE: there is
         * no concept of the resource *contents* having a stored representation
         * in the Resource object -- You are always working with the node
         * map for the properties of the #resourceURL, never some .xml or .html DOM.
         */
        this.getNode = function(name, ns)
          {           
            var res = this.getElementsByTagNameNS({
              name:     name  || 'multistatus',
              ns:       ns    || 'DAV:',
              doc:      workingPropertyDOM
            });

            return res;
          };
        
        /**
         * @returns               A copy of the working Acl.
         * @type      {Array}
         */
        this.Acl = function()
          {
            var ret = [];
            var tmp = protectedAces.concat(editableAces, inheritedAces);
            for(var w=0; w < tmp.length; w++)
              {
                ret.push(tmp[w]);
              } 
            
            return ret;
          };
        
        /**
         * @param     {String}    scp   Lock scope (shared, exclusive).
         * @param     {String}    typ   Lock type (write, etc).
         * @returns                     Whether lockscope & locktype is supported.
         * @type      {Booolean}
         */
        this.lockSupported = function(scp, typ)
          {
            return  (scp && typ) 
                    ? supportedLocks.hasOwnProperty(scp + typ) 
                      ? supportedLocks[scp + typ] 
                      : false
                    : false; 
          };
        
        /**
         * Checks if the user has a given permission.
         *
         * @param     {String}    p     Privilege (write, write-properties, etc).
         * @type      {Boolean}
         */
        this.hasPrivilege = function(p)
          {
            return privileges[p || 'x'];  
          };
          
        /**
         * Checks if a sent privilege is supported.
         *
         * @param     {Mixed}    p      Privilege (write, write-properties, etc). Can
         *                              be an Array of privileges, or a single String.
         * @type      {Boolean}
         */
        this.isValidPrivilege = function(p)
          {
            if(AXIS.isArray(p))
              {
                for(var x=0; x < p.length; x++)
                  {
                    if(privileges.hasOwnProperty(p[x]) === false)
                      {
                        return false;
                      }
                  }
                return true;
              }
              
            return privileges.hasOwnProperty(p);    
          };
          
        this.principalsMatch = function(p1,p2)
          {
            return  p1.type === p2.type &&
                    (p1.type === 'principal'
                      ? p1.principal === p2.principal 
                      : p1.type === 'property' 
                        ? p1.property === p2.property
                        : p1.url === p2.url);
          };
          
        /**
         * For the methods where the user must send an Ace definition, this is
         * a shortcut method to do pre-validtion of this argument object, as all
         * must be objects, have a principal property, containing name and type.
         *
         * @param   {Object}    a     A user defined principal object.
         * @see     #addAce
         */
        this.validateAclObject = function(a)
          {
            if( AXIS.isObject(a) && 
                AXIS.isObject(a.principal) && 
                AXIS.isString(a.principal.name))
                {
                  /**
                   * If no type set, we want to have a default
                   * of 'user'.  
                   *
                   * @see createPrincipalObject
                   * @see addAce
                   */
                  a.principal.type = a.principal.type || 'user';

                  return true;   
                }
            return false;
          }; 
          
        /**
         * Very specific usage, only for elements which contain EMPTY elements,
         * for dealing with browser differences -- how non-IE browsers will
         * leave empty #text nodes around. Be careful, as this destroys all
         * all non element nodes, and makes all element nodes EMPTY.
         *
         * @param     {DOMNode}   node    A DOM node.
         * @type      {DOMNode}
         */
        this.cleanNode = function(node)
          {
            var nn  = node || workingPropertyDOM;
            nn      = nn.cloneNode(true);
            
            var eN = nn.childNodes;
            for(var x=0; x < eN.length; x++)
              {
                if(eN[x].nodeType !== AXIS.ELEMENT_NODE)
                  {
                    nn.removeChild(eN[x]);
                  }
              }
            return nn;
          }

        /**
         * Will get the text of a node.  Note that it will concatenate
         * all text that it finds in any child nodes. 
         *
         * @param     {DOMNode}   node    A DOM node.
         * @type      {String}
         */
        this.getNodeText = function(node)
          {
            var t = '';
            var n;
            for(var v=0; v < node.childNodes.length; v++)
              {
                n = node.childNodes[v];
                t += n.textContent ? n.textContent : n.text;
              }
            return t.replace(/[\n\r\t]/g,'');
          };
        
        this.getNodeName = function(n)
          {
            return n.nodeName.replace('D:','');
          };

        /**
         * Will set private #owner based on last fetched resource proplist.
         */
        this.setOwner = function()
          {
            owner = this.getNodeText(this.getNode('owner')[0].firstChild);
          };
          
        /**
         * Will set private #origETag based on last fetched resource proplist.
         */
        this.setETag = function()
          {
            origETag = this.getNodeText(this.getNode('getetag')[0]);
          };
          
        /**
         * Will set private #origLastModified based on last fetched resource proplist.
         */
        this.setLastModified = function()
          {
            origLastModified = this.getNodeText(this.getNode('getlastmodified')[0]);
          };
        
        /**
         * Will set private #privileges based on last fetched resource proplist.
         */
        this.setUserPrivileges = function()
          {
            var npv;
            var tp  = this.getNode('current-user-privilege-set')[0];
            tp      = this.cleanNode(tp).childNodes;
            
            /**
             * Reset all privileges to false
             */
            for(var p in privileges)
              {
                privileges[p] = false;  
              }
            
            /**
             * Iterate over the privilege set, check if user has any, and
             * flag as true the ones the user does.
             */
            for(var s=0; s < tp.length; s++)
              {
                npv = this.getNodeName(tp[s].firstChild);
                privileges[npv] = privileges.hasOwnProperty(npv); 
              }
          };
          
        /**
         * Will set private #resourceLocks based on last fetched resource proplist.
         */
        this.setResourceLocksInfo = function()
          {
            var lv, nm, lob;
            var locks = this.getNode('lockdiscovery')[0].childNodes;
            
            /**
             * Make sure we empty the current resource locks.
             */
            resourceLocks = [];

            for(var w=0; w < locks.length; w++)
              {
                lv = locks[w].childNodes;
                lob   = {};
                
                for(var s=0; s < lv.length; s++)
                  {
                    nm    = this.getNodeName(lv[s]);
                    switch(nm)
                      {
                        case 'locktype':
                        case 'lockscope':  
                          lob[nm]         = this.getNodeName(lv[s].firstChild);
                        break;
                        
                        case 'depth':
                        case 'owner':
                        case 'timeout':
                        case 'locktoken':
                          lob[nm]         = this.getNodeText(lv[s]);
                        break;
                        
                        default:
                        break;
                      }  
                  }
                if(lob.locktoken)
                  {
                    resourceLocks.push(lob);
                  }
              }
          };
          
        /**
         * Will set private #aces based on last fetched resource proplist.
         */
        this.setAclInfo = function()
          {    
            var cA, aN, aT, aOb, cP, cN, fC, fN, pNS, gdn;
            var aces = this.getNode('acl')[0].childNodes;

            /**
             * Make sure we empty the current Aces.
             */
            editableAces    = [];
            protectedAces   = [];
            inheritedAces   = [];

            for(var a=0; a < aces.length; a++)
              {
                cA = aces[a].childNodes;
                aOb = {
                  'principal':      false,
                  'protected':      false,  
                  'inherited':      false,
                  'grant':          false,
                  'privileges':     []
                };
                
                for(var w=0; w < cA.length; w++)
                  {
                    aN = this.getNodeName(cA[w]);
                    aT = this.getNodeText(cA[w]);
                    cN = this.cleanNode(cA[w]);
                    
                    switch(aN)
                      {
                        case 'principal':                      
                          /**
                           *  <D:principal>
                           *    <D:href>
                           *      http://sandro-dav.limewire.com:8080/users/limestone
                           *    </D:href>
                           *  </D:principal>
                           */
                          if(this.getNodeName(cN.firstChild) === 'href')
                            {
                              aOb.principal = 
                                {
                                  type:   'href',
                                  url:    aT
                                };
                            }
                          else
                            {
                              fC = this.cleanNode(cN.firstChild);
                              fN = this.getNodeName(fC);
                              
                              /**
                               *  <D:principal>
                               *    <D:property>
                               *      <R:owner xmlns:R="DAV:" />
                               *    </D:property>
                               *  </D:principal>
                               */
                              if(fN == 'property')
                                {
                                  pNS = fC.firstChild.nodeName.split(':');
                                  
                                  aOb.principal = 
                                    {
                                      'type':     'property',
                                      'property': pNS[1],
                                      'prefix':   pNS[0] + ':',
                                      'ns':     fC.firstChild.attributes.getNamedItem('xmlns:' + pNS[0]).value  
                                    };  
                                }
                              /**
                               *  <D:principal>
                               *    <D:all />
                               *  </D:principal>
                               *
                               *  All other cases are checked if a valid principal type.
                               */
                              else
                                {
                                  if(principals.hasOwnProperty(fN))
                                    {
                                      aOb.principal = 
                                        {
                                          type:       'principal',
                                          principal:  fN
                                        };
                                    }
                                }
                            }
                        break;
                        
                        case 'protected':
                          aOb.protected     = true;
                        break;
                        
                        case 'inherited':
                          aOb.inherited     = aT;
                        break;
                        
                        case 'grant':
                        case 'deny':
                          aOb.grant         = aN == 'grant' ? true : false;
                          cP                = cA[w].childNodes;
    
                          for(var z=0; z < cP.length; z++)
                            {
                              gdn = this.cleanNode(cP[z]);
                              aOb.privileges.push(this.getNodeName(gdn.firstChild));
                            }
                        break;
                        
                        default:
                        break;  
                      }
                  }  
                
                /**
                 * Sort into useful groups. NOTE the server order is:
                 * 1. protected & non-inherited
                 * 2. protected & inherited
                 * 3. non-protected & non-inherited AKA editable
                 * 4. non-protected & inherited
                 *
                 * And so the protected/inherited/editable groups are not
                 * strictly speaking correct (but correct for our purposes).
                 * That is, protectedAces fetch any Ace that is protected, which
                 * includes some inherited Aces.  And so, you aren't getting all
                 * the inherited Aces in inheritedAces.  However, as the client
                 * cannot change inheritedAces or protectedAces, and the order here
                 * will reflect the server order, all is the way it should be.  
                 * You are free to change the order of editableAces, of course -- but 
                 * not free to make them protected, or editable.
                 */
                if(aOb.principal)
                  {
                    if(aOb.protected)
                      {
                        protectedAces.push(aOb);  
                      }
                    else if(aOb.inherited)
                      {
                        inheritedAces.push(aOb);  
                      }
                    else
                      {
                        editableAces.push(aOb);  
                      }
                  }
              };
          };
        
        /**
         * Generates XML body required for a WebDAV#ACL call.  By default this means
         * a representation of the editable Aces, which are the only Aces you
         * are allowed to update.  If you just want an XML string representing
         * the entire Acl for this resource, send the `full` argument. NOTE that
         * your request will be rejected if you pass the full Acl as the body
         * of an WebDAV#ACL call.
         *
         * @param       {Boolean}       full        Returns full Acl XML string.
         * @returns     {String}
         */
        this.makeAclXML = function(full)
          {
            var xml = '<D:acl xmlns:D="DAV:">';
            
            var a = full ? this.Acl() : editableAces;
            
            for(var x=0; x < a.length; x++)
              {
                xml += this.makeAceXML(a[x]);  
              }
            
            xml +=    '</D:acl>';
            
            return xml.replace(/(\>\s*\<)/g, "><");
          };
        
        /**
         * Generates the XML for an Ace.
         *
         * @param       {Object}      ace       An Ace object
         * @returns     {String}
         */
        this.makeAceXML = function(ace)
          {
            var ap      = ace.principal;
            var privs   = ace.privileges;
            var GDStr   = ace.grant ? 'grant' : 'deny';
            var inh     = ace.inherited;
            var prot    = ace.protected;
            
            var xml = ' <D:ace>\
                          <D:principal>';
            /**
             * Create principal info
             */
            if(ap.type === 'property')
              {
                xml += '    <D:property>\
                              <' + ap.prefix + ap.property + ' xmlns:' + ap.prefix.replace(':','=') + '"' + ap.ns + '" />\
                            </D:property>';           
              }           
            else if(ap.type === 'href')
              {
                xml += '    <D:href>' + ap.url  + '</D:href>';
              }
            else
              {
                xml += '    <D:' + ap.principal + ' />';  
              }
              
            
            xml +=       '</D:principal>\
                            <D:' + GDStr + '>';
            
            /**
             * Add privileges
             */
            for(var p=0; p < privs.length; p++)
              {
                xml += '      <D:privilege>\
                                <D:' + privs[p] + ' />\
                              </D:privilege>';
              }
              
            xml += '        </D:' + GDStr + '>';
            
            /**
             * Protected
             */
            if(prot)
              {
                xml += '    <D:protected />';  
              }
            
            /**
             * Inherited
             */
            if(inh)
              {
                xml +=  '   <D:inherited>\
                              <D:href>' + inh + '</D:href>\
                            </D:inherited>';
              }
                        
            xml += '</D:ace>';
            
            return xml.replace(/(\>\s*\<)/g, "><");
          };
          
        /**
         * Expects a principal definition, as supplied by a user-defined
         * object describing an Ace.  A user-defined Ace is formatted slightly
         * differently, to make it easier for the user to define an Ace.  
         * Note how the translations are done here.
         *
         * @param     {Object}      a       A .principal object
         */
        this.createPrincipalObject = function(a)
          {
            if(AXIS.isObject(a))
              {
                if(a.type === 'property')
                  {
                    return {
                      type:       'property',
                      property:   a.name,
                      ns:         'DAV:',
                      prefix:     'R:'  
                    };
                  }
                else if(a.type === 'principal' && principals.hasOwnProperty(a.name))
                  {
                    return {
                      type:       'principal',
                      principal:  a.name
                    };
                  }
                else if(a.type === 'user' || a.type === 'group')
                  {
                    return {
                      type:   'href',
                      url:    owner.substring(0,owner.lastIndexOf('/') +1) + a.name
                    };
                  }
              }
            /**
             * Malformed principal definition. 
             */
            return null;
          };
          
        /**
         * Gets the index of an Ace, based on whether grant/deny, and on
         * the principal name && type.  NOTE that you are always operating
         * only on the editable Aces, and that you will receive a zero-based
         * index -- so '0' means the first element: check for `null` if you
         * are checking for a failed search.
         */
        this.getAceIndex = function(a)
          {
            if(this.validateAclObject(a) && !AXIS.isUndefined(a.grant))
              {
                var tA;
                var grant   = !!a.grant;
                var aces    = editableAces;                
                var pob     = this.createPrincipalObject(a.principal);

                if(pob)
                  {
                    for(var x=0; x < aces.length; x++)
                      {
                        tA  = aces[x];
                        
                        /**
                         * This is what verifies that we have a match.  Checking
                         * the equality of #grant, #type, and the relevant principal
                         * value should do it.  
                         */

                        if(tA.grant === grant && this.principalsMatch(tA.principal,pob))
                          {
                            return x;
                          }  
                      }
                  }
              }
              
            return null;
          };
          
        /**
         * Removes an Ace from the editable Aces of the working Acl. 
         */
        this.removeAce = function(idx)
          {
            if(AXIS.isNumber(idx))
              {
                if(editableAces[idx])
                  {
                    editableAces.splice(idx,1); 
                    return true;
                  }
              }
            return false;
          };
        
        /**
         * Adds an Ace to the current Acl. Note that passing an index argument
         * is not a guarantee that the proposed Ace will show up at that index
         * position: if there is an existing ace with matching grant and principal
         * settings, the Ace will be added to THAT Ace's privilege list.
         *
         * @param   {Object}    a   An Ace object:
         *                          {
         *                            [grant]:    Grant or Deny. Default Grant.
         *                            principal:  
         *                            {
         *                              [type]:   'user' || 'group' || 'principal' || 
         *                                        'property'. If no type set, default is 'user'.
         *                              name:     A user, principal, or username.
         *                            }
         *                            privileges:            
         */
        this.addAce = function(a)
          {
            if(this.validateAclObject(a) && !AXIS.isUndefined(a.privileges))
              {
                var privs, pCount, currAce, jarr, CAP;
                var grant     = AXIS.isUndefined(a.grant) ? true : !!a.grant;
                var principal = this.createPrincipalObject(a.principal);
                var aces      = editableAces;
                var aCount    = aces.length;
                
                /**
                 * Default is to push. If no idx, just set position to end. 
                 * See below.
                 */
                var idx       = !AXIS.isUndefined(a.idx) && AXIS.isNumber(a.idx) 
                                ? a.idx 
                                : aCount;
      
                /**
                 * Can send an array of privileges, or just on. Normalize to an Array.
                 */
                var sentPrivs = AXIS.isArray(a.privileges) ? a.privileges : [a.privileges];
                var sPCount   = sentPrivs.length;
                var newAce    = {};
                
                /**
                 * Now verify that the sent privileges are valid privileges.
                 */
                if(this.isValidPrivilege(sentPrivs) === false)
                  {
                    new AXIS.Errors.ResourceACLException('RESOURCE_ADDACE_BAD_PRIVILEGE_LIST').report();
                    
                    return false;  
                  }

                /**
                 * If possible, we want to add privileges to an existing ace, for 
                 * a given principal.  We can only do this for editable aces -- so
                 * if the grant is the same, and the principal is the same, check if 
                 * this Ace already has the sent privilege, and if it does not, add 
                 * this privilege to an existing Ace. 
                 * If we cannot find a compatible Ace, make a new one.  
                 */
                for(var s=0; s < aCount; s++)
                  {
                    currAce = aces[s];
                    privs   = currAce.privileges;
                    pCount  = privs.length;

                    if( currAce.grant === grant && 
                        this.principalsMatch(currAce.principal, principal))
                    
                    /*
                        CAP.type === principal.type &&

                        (CAP.type === 'principal'
                          ? CAP.principal === principal.principal 
                          : CAP.type === 'property' 
                            ? CAP.property === principal.property
                            : CAP.url === principal.url))
                     */
                     
                      {                
                        /**
                         * Ok, combine privileges.  Join array, uniquify.
                         * NOTE how we clear then refill the .privileges array.
                         */  
                        jarr  = privs.concat(sentPrivs)                  
                        currAce.privileges = [];
                        
                        for(var i=0; i < jarr.length; i++) 
                          {
                            for(var j=i+1; j < jarr.length; j++) 
                              {
                                if(jarr[i] === jarr[j])
                                  {
                                    j = ++i;
                                  }
                              }
                            if(this.isValidPrivilege(jarr[i]))
                              {
                                currAce.privileges.push(jarr[i]);
                              }
                          }
      
                        /**
                         * We're done... no new Ace is needed, as this turned out
                         * just to be a privilege update.
                         */
                        return true;
                      }
                  }

                /**
                 * New Ace needed. Insert at index if available, or at closest 
                 * endpoint. If no index, insert at end.  Note that we verify that
                 * the principal object creation was successful. See above.
                 */
                if(principal !== null)
                  {   
                    newAce.grant        = grant;
                    newAce.iherited     = false;
                    newAce.protected    = false;
                    newAce.privileges   = sentPrivs;
                    newAce.principal    = principal;
                    
                    /**
                     * Position ace by index.  Default is to push.
                     * NOTE: You are only changing editable Aces; others cannot be 
                     * altered by a client.
                     */
                    if(idx >= aCount)
                      {
                        editableAces.push(newAce); 
                      }
                    else if(idx <= 0)
                      {
                        editableAces.unshift(newAce); 
                      }
                    else
                      {
                        editableAces.splice(idx,0,newAce);  
                      }

                    return true;
                  }
                else
                  {
                    new AXIS.Errors.ResourceACLException('RESOURCE_ADDACE_BAD_PRINCIPAL_DEF')
                        .report();
                    return false;
                  }
              }
            
            new AXIS.Errors.ResourceACLException('RESOURCE_ADDACE_BAD_ARGS')
                .report();
            return false;
          };          
        
        /**
         * Commit Acl changes.
         */
        this.commitAclChanges = function()
          {
            console.log('NEW: ' + this.makeAclXML());
            var rtmp, resp, respXML, st;

/*
            var lockToken = AXIS.WebDAV.LOCK({
              url:        resourceURL,
              asynch:     false,
              lockscope:  'exclusive' 
            }).responseText;   
            
            console.log(lockToken);
            
            var unlockR = AXIS.WebDAV.UNLOCK({
              url:        resourceURL,
              asynch:     false,
              locktoken:  'opaquelocktoken:01716b22-9e5e-4666-a9c2-ba1046ebb322'//lockToken
            });   
                
            console.log(unlockR.responseText);    
*/
            var c = {
              url:      resourceURL,
              method:   'ACL',
              scope:    this,
              headers:  {},
              asynch:   false,
              body:     '<?xml version="1.0" encoding="utf-8" ?>' + this.makeAclXML()  
            };     
            
            var eFunc = function(r) 
              {
                var respXML   = this.cleanNode(r.responseXML.documentElement);
                var rtmp      = this.getNodeName(respXML.firstChild);
                  
                new AXIS.Errors.ResourceACLException('RESOURCE_ACL_' + rtmp).report();
              };
            
            AXIS.XHR.setStatusHandlerForResponse(c, 
              { 
                200:  function(r) 
                  {
                    /**
                     * Refresh property information.
                     */
                    this.updateResourceProperties();
                  },
                400:  'RESOURCE_ACL_400~~' + resourceURL,
                401:  'RESOURCE_ACL_401~~' + resourceURL,
                404:  'RESOURCE_ACL_404~~' + resourceURL,
                423:  'RESOURCE_ACL_423~~' + resourceURL,
                403:  eFunc,
                409:  eFunc
              });

            AXIS.WebDAV.send(c);  
          };
        
        this.mapPropertyModel = function()
          {
            /**
             * Note that we are cloning the original.  No methods operate
             * on the original DOM.  
             */
            workingPropertyDOM    = origPropertyDOM.cloneNode(true);
                
            this.setOwner();
            this.setETag();
            this.setLastModified();
            this.setUserPrivileges();
            this.setResourceLocksInfo();
            this.setAclInfo();            
          };
        
        /**
         * Returns the property model to the state it was when last
         * loaded.  This applies to the internal model, and will
         * not take into account any changes you have made (you will
         * lose any changes to the internal model that you have made
         * but have not committed). 
         */
        this.rollbackPropertyModel = function()
          {
            this.mapPropertyModel();   
          };
        
        /**
         * Fetch a number of properties from a resource, and refresh our 
         * internal model.
         */
        this.updateResourceProperties = function()
          {
            var dc = 
              {
                url:        resourceURL,
                properties: [
                  'owner',
                  'current-user-privilege-set',
                  'acl',
                  'lockdiscovery',
                  'getetag',
                  'getlastmodified',
                  'parent-set' // for BIND
                ],
                asynch:     false
              };
          
            var propR   = AXIS.WebDAV.getProperty(dc);
            var stat    = propR.getStatus();

            /**
             * If we don't get a multistatus (207) response, something has
             * gone wrong and nothing more will be done.
             */
            if(stat == 207)
              {                
                origPropertyDOM = propR.responseXML.documentElement;
                this.mapPropertyModel();
                
                 console.log('all aces');
                 console.log(this.Acl());
                 console.log('owner: ' + owner);
                 console.log('privileges:');
                 console.log(privileges);
                 console.log('resource locks:');
                 console.log(resourceLocks);
                 console.log('etag: ' + origETag);
                 console.log('lastmodified: ' + origLastModified);
                 console.log(origPropertyDOM);
              }
            else
              {
                console.log('ACL init response: ' + stat);  
              }
          };
        
        this.getResourceContent = function()
          {
            
          };
          
        this.setResourceContent = function(cnt)
          {
            
          };
      };
    
    var retob = new API;
    retob.updateResourceProperties();
    return retob;
  };
  
AXIS.extend({
  name:       'getAceIndex', 
  expects:    'Object', 
  namespace:  'RESOURCE',
  func:       function(a) 
    {
      return this.getAceIndex(a);
    }
});

AXIS.extend({
  name:       'addAce', 
  expects:    'Object', 
  namespace:  'RESOURCE',
  func:       function(a) 
    {
      this.addAce(a);
    }
});
  
AXIS.extend({
  name:       'removeAce', 
  expects:    'Object',
  namespace:  'RESOURCE',
  func:       function(idx) 
    {
      this.removeAce(idx);
    }
});
  
AXIS.extend({
  name:       'changeAce', 
  expects:    'Object',
  namespace:  'RESOURCE',
  func:       function() 
    {
      
    }
});

AXIS.extend({
  name:       'commitAclChanges', 
  expects:    'Object',
  namespace:  'RESOURCE',
  func:       function() 
    {
      this.commitAclChanges();
    }
});
  
  
