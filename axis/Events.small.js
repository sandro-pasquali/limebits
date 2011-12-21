/**
 * Copyright 2009 Lime Labs LLC
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

/*
 * @fileoverview
 *
 * @requires  extensions  ::AXIS
 * @requires  libraries   ::selector
 *
 */
function Events()
  {
    /**
     * @constructor
     */
    this.__construct = function() 
      {        
        this.defaultEventKey  = 'document';
        this.handlers         = [];
        
        /*
         * all .monitor(ed) events
         */
        this.eventList  = 
          [
            'abort',
            'change',
            'click',
            'dblclick',
            'error',
            'mousedown',
            'mousemove',
            'mouseout',
            'mouseover',
            'mouseup',
            'focus',
            'blur',
            'load',
            'unload',
            'submit',
            'reset',
            'resize'
          ];
          
        /**
         * Need to be sure a document exists before binding
         */
        AXIS.onDOMReady.subscribe({
          callback: this.bind,
          scope:    this
        });
      };
      
    /**
     * This would normally exist in a library, but don't want to have to 
     * create a dependency for just this func.  DOM.js repeats...
     */
    this.findPos           = function(obj)
      {
        var left    = 0;
        var top     = 0;
        if(obj.offsetParent)
          {
            while(obj.offsetParent)
              {
                left   += obj.offsetLeft;
                top    += obj.offsetTop;
                obj     = obj.offsetParent;
              }
          }
        else if(obj.x)
          {
            left   += obj.x;
            top    += obj.y;
          }
        
        return {left: left, top: top};
      };

    this.eventInfo = 
      {
        /*
         * written to by .monitor
         */
        elm: {},
    
        elId: null,
        elClass: null,
        x: null,
        y: null,
        eventType: {},
        tag: null
      };

    this.monitor = function(e)
      {       
        var eInf = AXIS.Events.eventInfo;
        var ns = (e);
        var ev = (ns) ? e : window.event;
        
        eInf.currentTarget = this;
        
        /*
         * When the currentTarget is the document object,
         * there will be no id set; use default.  This is
         * also how you might check if the event has
         * reached the document object level...
         */
        eInf.currentTargetId = this.id || AXIS.defaultEventKey;
        
        eInf.elm = (ns) ? ev.target : ev.srcElement;
        eInf.x = (ns) ? ev.pageX : ev.clientX + document.body.scrollLeft;
        eInf.y = (ns) ? ev.pageY : ev.clientY + document.body.scrollTop;
        
        var pos         = AXIS.Events.findPos(eInf.elm);
        eInf.elLeft     = pos.left;
        eInf.elTop      = pos.top;
        
        /*
         * Could also fetch w/h via AXIS.DOM methods, but this avoids
         * making additional function calls
         */
        eInf.elWidth    = eInf.elm.offsetWidth;
        eInf.elHeight   = eInf.elm.offsetHeight;
        
        /*
         * NOTE the addition of 'on' here:
         * the .type value of an event for an
         * onclick would be 'click'...
         */
        eInf.eventType  = ev.type;
                  
        /*
         * mousewheel info.  Again, differences
         * with moz and others
         */
        if(ev.wheelDelta) 
          { 
            eInf.delta = ev.wheelDelta/120;
            
            /*
             * In Opera delta differs in sign as compared to IE.
             */
            if(AXIS.isOpera)
              {
                eInf.delta = -eInf.delta;
              } 
          }
        else if(ev.detail)
          { 
            /*
             * moz. In Mozilla, sign of delta is different than in IE.
             * Also, delta is multiple of 3.
             */
            eInf.delta = -ev.detail/3;
          }

        if(eInf.elm.getAttribute)
          {
            eInf.elId = eInf.elm.getAttribute('id');
            eInf.elClass = eInf.elm.getAttribute('class');
            eInf.tag = eInf.elm.nodeName || null;
          }

        if(eInf.currentTarget == document)
          {
            //switch(eInf.eventType)

            /*
             * Now execute custom handlers
             */     
            var a = AXIS.Events.handlers ? AXIS.Events.handlers[eInf.eventType] || false : false;   
            if(a)
              {
                for(var b in a)
                  {
                    if(AXIS.__selector__.match(eInf.elm,b))
                      {
                        a[b](eInf);
                      }  
                  }
              }
          }
          
        //document.title = 'h: ' + (++__track__);
      };  
      
    this.observe = function(sel,ev,fun)
      {      
        try
          {              
            if(!this.handlers[ev])
              {
                this.handlers[ev] = [];
              }
            
            this.handlers[ev][sel] = fun;
            return true;
          }
        catch(e)
          {
            return false;  
          }
      };  
      
    this.unobserve = function(sel,ev,fun)
      {
        try
          {      
            delete this.handlers[ev][sel];
            return true;
          }
        catch(e)
          {
            return false;  
          } 
      };
    
    /*
     * Bind events to document
     */
    this.bind = function()
      {
        try
          {
            var i   = this.eventList.length;
            while(--i)
              {
                document['on' + this.eventList[i]] = this.monitor;
              }
              
            /*
             * Mousewheel support is not standard for moz
             */
            if(window.addEventListener)
              {
                /*
                 * moz
                 */
                document.addEventListener('DOMMouseScroll', this.monitor, false);
              }
            else
              {
                document.onmousewheel = this.monitor;
              }
          }
        catch(e)
          {
          }
      };
  };
  
