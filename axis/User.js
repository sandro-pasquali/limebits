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
 * @requires  AXIS
 * @requires  Cookies
 */
function User()
  {
    /**
     * @constructor
     */
    this.__construct = function()
      {
      };
    
    /**
     * Loads a client's geodata, via Google's Data API.
     * Note that this is making an XHR call, so the data
     * will be available at some point in the future -- it is likely
     * that you would want to set a callback to inform your application
     * of when this data is available.  
     *
     * @param      {Function}    [cb]    The callback function.
     * @example    AXIS.User.getUserGeoData(function() {
     *                alert(AXIS.User.Data.get('city'));
     *              });  
     */
    this.getUserGeoData = function(cb)
      {
        if(AXIS.Modules)
          {
            /**
             * This also requires the developer having set `useGoogleAPI` argument.
             * Checks and notifications on failure to do that exist in the
             * Module extension. 
             *
             * @see AXIS#Modules#load
             */
            AXIS.Modules.load({
            	provider: 'google',
            	module:   'gdata',
             	version:  '1',

              onload: function(google)
                {
                  console.log(google);
                  var v = google.loader.ClientLocation;
                  if(v)
                    {
                      var a = v.address;
                      var d = AXIS.User.Data;
                  
                      d.set('latitude', v.latitude || '');
                      d.set('longitude', v.longitude || '');
                      d.set('city', a.city || '');
                      d.set('country', a.country || '');
                      d.set('country_code', a.country_code || '');
                      d.set('region', a.region || '');  
    
                      cb && cb();
                    }
                }

            }); 
         }
      };

    this.Data = 
      {
        set: function(k,v)
          {
            if(k && v)
              {
                this[k] = v;  
              }    
          },
          
        get: function(k)
          {
            if(k && this[k])
              {
                return this[k];  
              }
            else
              {
                return false;  
              }
          }
      };
      
    /*
     * Checks if user is logged in by reading cookie ('user');
     * NOTE: use #username if possible.
     *
     * @return    {Mixed} username if logged in; {Boolean} false if not
     */ 
    this.isLoggedIn = function()
      {
        return AXIS.Cookies.read('user');  
      };

    /**
     *  Alias of #isLoggedIn: more readable.
     *
     * @return    {String} username if logged in; 'unauthenticated' if not
     */
    this.username = function()
      {
        return AXIS.Cookies.read('user') || 'unauthenticated';  
      };
      
    this.getBitsFolderName = function()
      {
        return this.isLoggedIn() ? "/home/" + this.username() + "/bits/" : "";
      };
  };