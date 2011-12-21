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
function Cookies() {
  /**
   * @constructor
   */
  this.__construct = function() {
  };
    
  this.create = function(name,value,o) {
    var c       = o || {};
        
    name      = encodeURIComponent(name);
    value     = encodeURIComponent(value);
    
    c.domain  = c.domain ? '; domain=' + encodeURIComponent(c.domain) : '';
    c.path    = c.path || "/";

    if(c.days) {
      var date = new Date();
      date.setTime(date.getTime()+(c.days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    } 
    else {
      var expires = "";
    }
        
    try {
      document.cookie = name+"="+value+expires+"; path=" + c.path + c.domain;
      return true;
    }
    catch(e) {
      return false;
    }
  };
      
  this.update = function(name,value,days) {
    /*
     * bridge function to allow more accurate
     * description of script flow
     */
    var n = name  || null;
    var v = value || null;
    var d = days  || null;
        
    return this.create(n,v,d);
  };
      
  this.read = function(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while(c.charAt(0)==' ') {
        c = c.substring(1,c.length);
      }
            
      if(c.indexOf(nameEQ) == 0) {
        return decodeURIComponent(c.substring(nameEQ.length,c.length));
      }
    }
    
    return false;
  };
  
  this.erase = function(name, o) {
    o = o || {};
    o.days = -1;
    return this.create(name,"", o);
  };
};