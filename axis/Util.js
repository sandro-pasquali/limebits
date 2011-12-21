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
function Util()
  {
    /**
     * @constructor
     */
    this.__construct = function()
      {
        AXIS.onDOMReady.subscribe({
          callback: function(){
            var limefooter = document.getElementById('limefooter');
            if (limefooter == null)
              return;
  
            var get_bit_link = limefooter.getElementsByTagName('span')[0];
            if (get_bit_link) {
              get_bit_link = get_bit_link.getElementsByTagName('a')[0];
              AXIS.attachEvent('click', function(e) {
                  if (!e.preventDefault) {
                      e.returnValue = false;
                  }
                  else {
                      e.preventDefault();
                  }
  
                  var bitPath;
                  if (this.getAttribute) {
                      bitPath = this.getAttribute('bitPath') || location.pathname;
                  }
                  else {
                      bitPath = location.pathname;
                  }
  
                AXIS.Util.bit.getBit(bitPath);
              }, get_bit_link);
            }
            
            if (AXIS._siteData.hosts.limebits == 'http://www.limebits.com/')
              return;
            
            var footer_links = limefooter.getElementsByTagName('a');
            for (var i = 0; i < footer_links.length; i++)
              {
                var href = footer_links[i].href;
                if (href.match(/http:\/\/[^\.]*.limebits.com\//))
                  footer_links[i].href = href.replace('limebits.com', AXIS._siteData.hosts.limebits.match(/http:\/\/www\.([^\/]*)\//)[1]);
              }
          }
        });
      };

    this.bit =
      {
        /** 
          * Duplicates a bit: Copies it to the current folder giving it a new name
          * args : @bitPath: Path to the bit
          *       @destFolder : folder where the bit has to be copied
          *       @options : 
          *         - success : success callback
          *         - failure : failure callback
          *         - scope : scope for the callbacks
          * TODO : include scope / failure / success callbacks
          */
        copy: function(bitPath, destFolder, options)
          {
            if(!bitPath || !destFolder) {
                return;
            }
            
            options = options || {};
            
            if(bitPath.charAt(bitPath.length - 1) == '/') {
              bitPath = bitPath.substring(0, bitPath.length - 1);
            }

            AXIS.WebDAV.COPY({
              url: bitPath,
              destination: destFolder,
              tryAlternateNames: true,
              on201: function(r) {
                if(options.success && ((typeof(options.success)).toLowerCase() == "function")) {
                  options.success.call(options.scope, r);
                }
              }
            });
            
          }, 
          
        getBitFromUserDomain: function(bitUrl)
          {
            AXIS.Cookies.create(bitUrl, "copy", { path: '/!lime/root/apps/bar/' });
            location = AXIS._siteData.hosts.limebits + 'apps/copier/#bitUrl=' + encodeURIComponent(bitUrl) +
              '&requestor=' + encodeURIComponent('http://'+location.host+'/');
          },

        getUUID: function(url, callback)
          {
            AXIS.WebDAV.getProperty({
             url: url,
             properties: ['resource-id'],
             asynch: true,
             onSuccess: function(r) {
               var resource_id;
               try {
                 resource_id = r.responseXMLObject().multistatus.response.propstat.prop["resource-id"].href.replace(/urn:uuid:/, '').replace(/-/g, '');
               }
               catch(e) {
                   resource_id = null;
               }

               callback(resource_id);
             }
            });
          },
           

        /* copy bitmarks,

           options.src_uuid: Set to uuid of source bit
           options.url: Set to url of source bit 
           only one of src_uuid & url is required, src_uuid is preferred

           options.destination: Set to url of destination bit
           options.dst_uuid: Set to uuid of destination bit
           only one of src_uuid & url is required, src_uuid is preferred
        */
        copyBitmarks: function(options)
          {
            if (!options.src_uuid) {
                AXIS.Util.bit.getUUID(options.url, function(uuid) {
                  if (!uuid) {
                    return options.callback();
                  }
                  options.src_uuid = uuid;
                  AXIS.Util.bit.copyBitmarks(options);
                });
            }
            else if (!options.dst_uuid) {
                AXIS.Util.bit.getUUID(options.destination, function(uuid) {
                  if (!uuid) {
                    return options.callback();
                  }
                  options.dst_uuid = uuid;
                  AXIS.Util.bit.copyBitmarks(options);
                });
            }
            else {
                options.url = '/bitmarks/' + options.src_uuid;
                options.destination = '/bitmarks/' + options.dst_uuid;
                AXIS.WebDAV.COPY(options);
            }
          },

        getBit: function(bitPath, location_replace)
          {
            if (AXIS._siteData.hosts.limebits != ("http://" + location.host + "/"))
              {
                return AXIS.Util.bit.getBitFromUserDomain(bitPath);
              }

            var bit = AXIS.Util.bit.bitInfo(AXIS.Util.uri.getBitUrl(bitPath));

            var user = AXIS.Cookies.read('user');

            if (user)
              {
                var dst_folder = '/home/' + user + '/bits';
              
                AXIS.WebDAV.COPY({
                  url: bit.tld_root,
                  asynch: true,
                  destination: dst_folder + '/' + bit.name,
                  tryAlternateNames: true,
                  on201: function(r) {
                    if (r.alternateName) {
                      bit.name = r.alternateName;
                    }

                    var dstBit = AXIS.Util.bit.bitInfo(AXIS.Util.uri.getBitUrl(r.destination + bit.tld_path_from_root));
                    AXIS.Cookies.create(dstBit.tld_root, "openConfigure", { path: '/apps/' });
                    var user_bits_url = "/apps/bitfinder/";
                    if (location_replace)
                      top.location.replace(user_bits_url);
                    else
                      top.location = user_bits_url;
                  },
                  on409: function(r) {
                    AXIS.WebDAV.MKCOL({
                      url: dst_folder,
                      asynch: true,
                      on201: function(r) {
                        AXIS.Util.bit.getBit(bitPath, location_replace);
                      },
                      onFailure: function(r) {
                        location.replace(bitPath);
                      }
                    });
                    
                  },
                  onFailure: function(r) {
                    var st = r.getStatus();
                    if(st !== 409 && st !== 412)
                      {
                        location.replace(bitPath);
                      }
                  }
                });
              }
            else
              {
                var rand = "" + Math.random();
                AXIS.Cookies.create(rand + '-url', AXIS.Util.uri.getUserUrl(bitPath), { path: '/apps/copier/' });
                AXIS.Cookies.create(rand + '-confirmed', 'true', { path: '/apps/copier/' });
                AXIS.Login.redirReturnTo = AXIS._siteData.hosts.limebits + 'apps/copier/#token=' + rand;
                AXIS.Login._redirectToAccess("if_new");
              }
          },

        /*
           
         */
        bitInfo: function(bitUrl)
          {
            var bit = {};

            bit.url = bitUrl;

            bit.tld_path = AXIS.Util.uri.getTLDPath(bit.url);
            bit.tld_folder = bit.tld_path.match(/.*\//)[0];
            bit.filename = bit.tld_path.replace(bit.tld_folder, "");

            bit.owner = bit.tld_path.match(/\/home\/([^\/]*)/)[1];

            if (bit.tld_path.match(/\/home\/[^\/]*\/bits\/[^\/]*/))
              {     /* tld path is of the pattern /home/user/bits/bitname/*** */
                bit.tld_root = bit.tld_path.match(/(\/home\/[^\/]*\/bits\/[^\/]*)/)[1];
              }
            else
              {
                bit.tld_root = AXIS.Util.uri.chompSlash(bit.tld_folder);
              }
            bit.tld_path_from_root = bit.tld_path.replace(bit.tld_root, "");
            bit.root_url = AXIS.Util.uri.getBitUrl(bit.tld_root);

            bit.name = bit.tld_root.replace( /.*\//, "" ); // get the folder basename

            return bit;

          },

        getBitmarks: function(bitFolder, cb)
          {
            var dav = AXIS.WebDAV;
            var marks = {
              tags: []
            };

            dav.SEARCH({
              asynch: true,
              url: bitFolder,
              props: ["displayname", "resource-id", "lastmodified", "popularity"],
              bitmarks: {
                ns: AXIS.WebDAV.ns.bm,
                names: ["tag", "description"]
              },
              depth: "0",
              callback: function(r) {
                var resp = r.responseXMLObject().multistatus.response;

                var pstat = resp.propstat;
                var bstat = resp.bitmarkstat || [];

                pstat = AXIS.isArray(pstat) ? pstat : [pstat];
                bstat = AXIS.isArray(bstat) ? bstat : [bstat];

                for(var j = 0; j < pstat.length; j++)
                  {
                    if(pstat[j].status.match(/200 OK/))
                      {
                        AXIS.Util.lang.augmentObject(marks, pstat[j].prop);
                      }
                  }

                for(var k = 0; k < bstat.length; k++)
                  {
                    if(bstat[k].status.match(/200 OK/))
                      {
                        var bitmark = bstat[k].bitmark;
                        bitmark = AXIS.isArray(bitmark) ? bitmark : [bitmark];

                        for(var l = 0; l < bitmark.length; l++)
                          {
                            if (bitmark[l].tag)
                              {
                                marks.tags.push(bitmark[l].tag);
                              }
                            else
                              {
                                AXIS.Util.lang.augmentObject(marks, bitmark[l]);
                              }
                          }
                      }
                  }
                cb.call(null, marks)                                
              }
            });
          },


        /**
         * Opens the configure tab for a bit.
         * Arguments :: @bitPath: Top-level-domain Path to the bit
         * Currently this is done by setting a cookie where :
         *  cookie-name : Absolute URL of the bit
         *  cookie-value : "new_copy"
         */
        openConfigureTab: function( bitPath )
          {
            if(!bitPath)
              return;

            var bit = AXIS.Util.bit.bitInfo(AXIS.Util.uri.getBitUrl(bitPath));

            // Create the cookie
            AXIS.Cookies.create(bit.tld_root, "openConfigure", { path: '/apps/' });
            window.location.assign(bit.url + "?bar");
          }

      };
      
    this.uri = 
      {
        basename: function(path)
          {
            return path.replace(/.*\//, "");
          },

        /* get folder containing given URL,
         * will return the URL itself if it ends in '/'
         * otherwise strips all non '/' characters at the end */
        getFolder: function(url) {
          return url.replace(/\/[^\/]*$/,'/');
        },

        getParent: function(url) {
            return url.replace(/\/[^\/]*\/?$/, '/');
        },

        /**
         * Normalizes the url by removing redundant slashes (and trailing slashes) and decodes %20
         *
         * @param    {String} url    The url to normalize
         * @returns                  The normalized url
         * @type     {String}
         */
        normalize: function(url) {
          url = url.replace(/\/\/*/g, "/"); // replace multiple consecutive slashes with one slash
          url = url.replace(/%20/g, " ");   // decode %20
          return AXIS.Util.uri.chompSlash(url);  // remove any trailing slashes and return
        },

        /**
         * Removes trailing slashes from the url if present
         *
         * @param    {String} url    The url
         * @returns                  The url without any trailing slashes
         * @type     {String}
         */
        chompSlash: function(url) {
          return url.replace(/[\/\\]*$/, '');
        },

        getBitUrl: function(tld_path) {
          var bit_info = tld_path.match(/home\/([^\/]+)\/bits\/([^\/]+)(.*)/);
          var bit_url;

          if (bit_info && bit_info[2].match(/^[-a-z0-9]*$/))
            {
              bit_url = AXIS._siteData.hosts.limebits.replace("www", bit_info[2] + "." + bit_info[1]) + bit_info[3].substr(1);
            }
          else
            {
              bit_url = this.getUserUrl(tld_path);
            }

            return bit_url;
        },

        /**
         * Converts the www domain path to a FQDN url for accessing the path without redirects
         *
         * @param    {String} tld_path    The www domain path of the folder 
         * @returns                       The FQDN for accessing that path directly
         * @type     {String}
         */
        getUserUrl: function(tld_path) {
          var user_url, user_info;
          url_info = tld_path.match(/home\/([^\/]+)(.*)/);
          if (url_info)
            user_url = AXIS._siteData.hosts.limebits.replace("www", url_info[1]) + url_info[2].substr(1);
          else
            user_url = AXIS._siteData.hosts.limebits + tld_path.substr(1);
          return user_url;
        },

        /**
         * Converts the FQDN url to a www domain path
         *
         * @param    {String} user_url    The FQDN for accessing that path directly
         * @returns                       The www domain path of the folder
         * @type     {String}
         */
        getTLDPath: function(user_url) {
          var bitParts = user_url.match(/http:\/\/([^\/]+)(\/[^#]*)/);
          var hostname_pref = bitParts[1].replace(AXIS._siteData.hosts.limebits.match(/www(\.[^\/]*)/)[1], "");
          var bitOwner;
          var bitPath = bitParts[2];
          if (hostname_pref.split(".").length == 2)
            {
              bitOwner = hostname_pref.split(".")[1];
              return '/home/' + bitOwner + '/bits/' + hostname_pref.split(".")[0] + bitPath;
            }
          else
            {
              bitOwner = hostname_pref;
              return (bitOwner == 'www') ? bitPath: '/home/' + bitOwner + bitPath;
            }
        },

        findAlternateName: function(name, used_names)
          {
            if (!used_names.indexOf)
            {
              used_names.indexOf = function(item)
              {
                for (var i = 0; i < this.length; i++)
                  if (this[i] === item) return i;
                return -1;
              }
            }
            var new_name, extension;
            if (name.indexOf('.') == -1)
              {
                new_name = name;
                extension = '';
              }
            else
              {
                var name_parts = name.match(/(.*)(\.[^.]*)$/);
                new_name = name_parts[1];
                extension = name_parts[2];
              }

            var start_num = 2;
            var name_parts = new_name.match(/(.*)([\d]+)$/);
            if (name_parts)
              {
                new_name = name_parts[1];
                start_num = parseInt(name_parts[2]) + 1;
              }

            var new_full_name;
            var end_num = start_num + used_names.length + 1;
            for (var i = start_num; i <= end_num; i++)
              {
                var new_full_name = new_name + i + extension;
                if (used_names.indexOf(new_full_name) == -1) break;
              }
            return new_full_name;
          }
      };

    this.xml =
      {
        iterableToArray: function(iterable) {
          if (iterable.toArray) return iterable.toArray();
          var length = iterable.length, results = new Array(length);
          while (length--) results[length] = iterable[length];
          return results;
        },
        getChildrenByNameNS: function(el, name, ns) {
          if (ns == null)
            ns = "DAV:";

          if (typeof el.getElementsByTagNameNS == "function")
            return this.iterableToArray(el.getElementsByTagNameNS(ns, name));
          else {
            el.ownerDocument.setProperty("SelectionLanguage", "XPath");
            el.ownerDocument.setProperty("SelectionNamespaces", "xmlns:pref='"+ns+"'");

            var child_els = el.selectNodes("*//pref:" + name);
            if (child_els.length == 0)
              child_els = el.selectNodes("pref:" + name);

            return this.iterableToArray(child_els);
          }
        },
        getText: function(node)
          {
            var txt = "";
            for (var i = 0; i < node.childNodes.length; i++)
              {
                if (node.childNodes[i].nodeType == AXIS.TEXT_NODE)
                  txt += node.childNodes[i].nodeValue;
              }
            return txt;
          }
      }

    this.lang =
      {
        augmentObject: function(r, s) {
          for(var p in s)
            {
              r[p] = s[p];
            }
        }
      }

    this.json =
      {
        eval: function(text)
          {
            var json_object = !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(text.replace(/"(\\.|[^"\\])*"/g, ''))) && eval('(' + text + ')');
            /*")*/
            return json_object;
          },

        safeEval: function(text)
          {
            /* comes from JSON.parse at http://json.org/json2.js (public domain). */
            var j = {};

            var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            cx.lastIndex = 0;
            if (cx.test(text))
               {
                 text = text.replace(cx, function (a) {
                   return '\\u' +
                     ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                 });
               }

            if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '')))
              j = eval('(' + text + ')');

             return j;
          }
      }
  }
