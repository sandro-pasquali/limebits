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

function Store()
  {
    /**
     * @constructor
     */
    this.__construct = function()
      {
        /**
         * Make sure JSON is enabled.  If not, destroy this object -- we don't want
         * to allow any bad data translations to slip through.
         */
        if(JSON && JSON.stringify && JSON.parse)
          {
            this._local = [];

            AXIS.Errors.createExceptionType('StoreArgumentsException');
            AXIS.Errors.registerCode('Store_BAD_ARGS',"Bad arguments sent to method, so method not executed. Probably no .url property.");

            AXIS.Errors.createExceptionType('StoreHTTPException');
            AXIS.Errors.registerCode('Store_412'," 412. The conditions for execution of this command have not been met.  Probable cause is trying to overwrite a file without setting the .overwrite property to 'T', or trying to write a file that has changed since last read it.");

            this.onDestroy = AXIS.CustomEvent.create({
              name: 'StoreOnDestroy'
            });
            
            this.onRead = AXIS.CustomEvent.create({
              name: 'StoreOnRead'
            });
            
            this.onUpdate = AXIS.CustomEvent.create({
              name: 'StoreOnUpdate'
            });
          }
        else
          {
            for(p in this)
              {
                delete this[p];  
              }  
          }
      };

    this._toJSON = function(a)
      {
        return JSON.stringify(a || '');
      };

    this._fromJSON = function(a)
      {
        return JSON.parse(a);
      };

    /**
     * On write of a store, update the local version.  This is the
     * version that will be operated on when you load and save the store.  It is
     * committed either by force (#commit) or on periodic save.  Note that the
     * sent object is only useful if you sent a .content property.
     */
    this.updateLocalStore = function(ob)
      {
        var r = ob || {};
        if(r.url !== undefined)
          {
            var d                 = new Date();
            ob.lastSaveTime       = d.getTime();
            ob.lastJSON           = this._local[ob.url];
            ob.JSON               = ob.body;
            this._local[ob.url]   = ob;
                                      
//            console.log(ob);
            return ob;
          }
        
        return null;
      };

    this.deleteLocalStore = function(ob)
      {
        var r = ob || {};
        if(r.url !== undefined)
          {
            var r = this._local[ob.url];
            delete this._local[ob.url];
            return r;
          } 
        
        return null;  
      };
    
    /**
     * Read a local store. 
     */
    this.readLocalStore  = function(sob)
      {
        var a     = sob || {};
        
        return this._local[a.url] || null;
      };

    /**
     * Alias of #update
     */
    this.create = function(d) 
      {
        this.update(d);
      };

    /**
     * Creates a JSON store for sent data.  Note that if no object is sent, it is assumed
     * that the user is creating an empty local data file, which will be named 'DAV.store'
     * and contain a json-ified empty array.
     *
     * @param {Object} d Options object:
     *    {
     *      content:    A javascript data object, which is converted to JSON format
     *      url:        Path to the file
     *      overwrite:  'T' or 'F' -- Whether to overwrite an existing file.
     *    }
     */
    this.update = function(d)
      {
        var s = d || {};
        s.content     = s.content     || [];
        s.url         = s.url         || 'DAV.store';
        s.overwrite   = s.overwrite   || 'F';

        if(s.url === undefined)
          {
            new AXIS.Errors.StoreArgumentsException('Store_BAD_ARGS~~update()');
            return null;  
          }
        
        /**
         * We take control of all headers here
         */
        s.headers = {};
        s.headers['Content-Type'] = 'application/json; charset="utf-8"';

        /**
         * If overwriting not allowed, set appropriate header
         */
        if(s.overwrite == 'F')
          {
            s.headers['If-None-Match'] = '*';
          }
        else
          {
            /**
             * If there is a local resource at this url, and that local resource has an
             * .etag property, then we have to make sure that the file we are going
             * to overwrite to has not changed (we get a local resource with an .etag only
             * by having run an #update or #read on a resource)
             */
            var loc = this._local[s.url];
            if(loc && loc.etag)
              {
                s.headers['If-Match'] = loc.etag;
              }
          }

        /**
         * Want this to be synchronous, to ensure that when we "come back"
         * the data will be stored and in existence.
         */
        s.asynch    = false;
        s.body      = this._toJSON(s.content);
        
        var p = AXIS.WebDAV.PUT(s);
        var st = p.getStatus();
        /**
         * 201, then the resource was created.
         * 204, then an empty response, which should mean write/overwrite worked.
         * 412, precondition failure probably fired if overwrite is F and exists, or
         *      if the Etag has changed (ie. file has changed).
         */
        switch(st)
          {
            case 201:
            case 204:
              s.etag = p.getResponseHeader('Etag');
              this.updateLocalStore(s);   
              this.onUpdate.fire([s.body,p]);
              return p;    
            break;
            
            case 412:  
              /**
               * Either an attempt to write to a file when overwrite is 'F', or
               * Etag mismatch.  The developer has control over whether overwrite
               * is allowed or not, and can handle this condition himself.  The case
               * where the file has changed underneath the user should be handled.  So
               * check if this is the type of failed precondition, and inform.
               */
              if(s.overwrite != 'F')
                {
                  AXIS.showNotification({
                    content: "Someone else has changed this file.  The version are working on is the version that existed before the change was made." 
                  });  
                }

              new AXIS.Errors.StoreHTTPException('Store_412~~update(): ' + s.url);
            break;

            default:
            break;
          };
        
        this.deleteLocalStore(s);
        return null;
      };

    this.destroy = function(ob)
      {
        var r       = ob || {};
        var s;

        if(r.url === undefined)
          {
            new AXIS.Errors.StoreArgumentsException('Store_BAD_ARGS~~destroy()');
            return null;  
          }
         
        /**
         * Attempt deletion. Note that this object is expected to follow same
         * rules as general DAV object.  Synch is forced, however.
         */
        r.asynch  = false;
        var res   = AXIS.WebDAV.DELETE(r);
        var st = res.getStatus();
        
        switch(st)
          {
            // ok; deleted
            case 204:
              s = this.readLocalStore(r);
              this.deleteLocalStore(r);
              this.onDestroy.fire([s,r]);
              return s;
            break;

            default:
            break;
          }
      };
      
    this.read = function(ob)
      {
        var a = ob || {};
        
        if(a.url === undefined)
          {
            new AXIS.Errors.StoreArgumentsException('Store_BAD_ARGS~~read()');
            return null;  
          }
        
        a.asynch = false;
        
        var r = AXIS.WebDAV.GET(a);
        var st = r.getStatus();
        
        switch(st)
          {
            /**
             * 200: ok
             * 304: not modified
             */
            case 200:
            case 304:
              a.etag = r.getResponseHeader('Etag');
              a.body = this._fromJSON(r.responseText);
              this.updateLocalStore(a);   
              this.onRead.fire([a.body,r]);
              return a.body;
            break;

            default:
            break;
          }
      };

    this.commit = function(ob)
      {
        var r = ob || {};
        
        if(r.url === undefined)
          {
            new AXIS.Errors.StoreArgumentsException('Store_BAD_ARGS~~commit()');
            return null;  
          }
        
        /**
         * Do we have a local store to commit? If so, we are just
         * doing a #update, with an overwrite.
         */
        if(this._local[r.url])
          {
            /**
             * The request is to commit.  Overwrite.
             */
            r.overwrite = 'T'; 
            
            return this.update(r); 
          }
        
        /**
         * No local store.  Nothing to commit with.
         */
        return null;  
      };
  };
