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
 * Used to set handlers for keys and key/modifer combinations.
 *
 * @requires AXIS
 */  
function Keyboard()
  {
    /**
     * @constructor
     */
    this.__construct = function()
      {
        /**
         * The array which stores the keycode/event mappings
         */
        this._map =             [];
        
        /**
         * @see #processEvent
         * @see #clearMod
         */
        this.lastKey =          false;
        this.lastModKey =       false;
        
        /**
         * You are encouraged to use readable keycodes
         */
        this.BACKSPACE =    8;
        this.TAB =          9;
        this.RETURN =       13;
        this.ESC =          27;
        this.LEFT =         37;
        this.UP =           38;
        this.RIGHT =        39;
        this.DOWN =         40;
        this.DELETE =       46;
        this.HOME =         36;
        this.END =          35;
        this.PAGEUP =       33;
        this.PAGEDOWN =     34;
        this.INSERT =       45;
        
        this.ALT =          1;
        this.CTRL =         2;
        this.SHIFT =        3;

        /** move this to API **
        **/
        if(AXIS.API)
          {
            AXIS.API.define({
              name:   'keyboardShortcut',
              target: this.defineKey,
              scope:  this,
              desc:   [
                        'Create a keyboard shortcut',
                        '{Number} The keyCode',
                        '{Function} The function to call when key is pressed'
                      ]
            });
          }
          
        this.start();
      };  
    
    /**
     * Allows one handler to handle a range of keys.
     * NOTE: It is up to you to ensure that start < finish
     *
     * @param {Number}    start   - The keycode to start at
     * @param {Number}    finish  - The keycode to end at
     * @param {Function}  handler - The handler function to catch key events
     */
    this.defineRange = function(start,finish,handler)
      {
        if(start && finish && handler)
          {
            for(var i=start; i<=finish; i++)
        	    {
                this._map[i] = handler;
        	    }
        	}
      };
    
    /**
     * Allows individual keycode handling.
     *
     * @param {Number}    code    - The keycode 
     * @param {Function}  handler - The handler function to catch key events
     */
    this.defineKey = function(code,handler)
      {
        if(code && handler)
          {
            this._map[code] = handler;
          }
      };
    
    /**
     * This is the document.keydown handler.
     *
     * @private
     * @param {Event}    e    - The key Event
     * @see   #start
     * @see   #stop
     */
    this.processEvent = function(ev) 
      {
        var kc = ev.keyCode;
    
        var mod =   (ev.altKey) ? AXIS.Keyboard.ALT 
                    : (ev.ctrlKey) ? AXIS.Keyboard.CTRL 
                    : (ev.shiftKey) ? AXIS.Keyboard.SHIFT 
                    : false;
    
        AXIS.Keyboard.lastKey     = kc;
        AXIS.Keyboard.lastModKey  = mod;

        if(AXIS.Keyboard._map[kc])
          {
            /**
             * If the handler returns Bool true, the event is stopped.
             */
            if(AXIS.Keyboard._map[kc](mod,kc))
              {
                AXIS.stopPropagation(ev);
                AXIS.preventDefault(ev);
              }
          }
    
        return true;
      };
    
    /**
     * As a keydown event will set the .lastModKey value, we need
     * to be sure that clears when the key goes up.
     *
     * @see   #start
     * @see   #stop
     */
    this.clearMod = function()
      {    
        AXIS.Keyboard.lastModKey  = false;
      }

    this.start = function()
      {
        AXIS.attachEvent('keydown', this.processEvent);
        AXIS.attachEvent('keyup', this.clearMod);
      };
    	
    this.stop = function()
      {
        AXIS.detachEvent('keydown', this.processEvent);
        AXIS.detachEvent('keyup', this.clearMod);
      };
  };
