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

/*
 * @fileoverview
 *
 * @requires AXIS
 *
 */
function Events()
  {
    /*
    this.__dependencies = 
      {
        libraries:    [
                        'selector'
                      ]  
      };
      */
    /**
     * @constructor
     */
    this.__construct = function() 
      {       
        this.selectionBackgroundColor = '#ff0000';
        
        this.defaultEventKey  = 'document';
        this.handlers         = [];
 
        /**
         * Turns on monitor for all events.
         * Need to be sure a document exists before binding.
         */
        AXIS.onDOMReady.subscribe({
          callback: function(){
            var i   = this.eventList.length;
            while(--i)
              {
                this.handlers[this.eventList[i]] = [];
                document['on' + this.eventList[i]] = this.monitor;
              }
          },
          
          scope: this
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
        'resize',
        'select'
      ];
      
    this.eventInfo = 
      {
        /*
         * written to by .monitor
         */
        el:                 {},
        currentTarget:      {},
        currentTargetId:    false,
        elId:               false,
        elClass:            false,
        x:                  false,
        y:                  false,
        elLeft:             0,
        elTop:              0,
        elWidth:            0,
        elHeight:           0,
        eventType:          {},
        tag:                false
      };

    this.monitor = function(e)
      {       
        var AE                = AXIS.Events;
        var eInf              = AE.eventInfo;
        var ns                = (e);
        var ev                = (ns) 
                              ? e 
                              : window.event;
        
        eInf.currentTarget    = this;
        
        /*
         * When the currentTarget is the document object,
         * there will be no id set; use default.  This is
         * also how you might check if the event has
         * reached the document object level...
         */
        eInf.currentTargetId  = this.id || AE.defaultEventKey;
        
        eInf.el               = (ns)  
                              ? ev.target 
                              : ev.srcElement;
                              
        eInf.x                = (ns) 
                              ? ev.pageX 
                              : ev.clientX + document.documentElement.scrollLeft;
                              
        eInf.y                = (ns) 
                              ? ev.pageY 
                              : ev.clientY + document.documentElement.scrollTop;
        
        var pos               = AE.findPos(eInf.el);
        eInf.elLeft           = pos.left;
        eInf.elTop            = pos.top;
        

        eInf.elWidth          = eInf.el.offsetWidth;
        eInf.elHeight         = eInf.el.offsetHeight;

        eInf.eventType        = ev.type;
        
        if(eInf.el.getAttribute)
          {
            eInf.elId             = eInf.el.getAttribute('id');
            eInf.elClass          = eInf.el.getAttribute('class');
            eInf.tag              = eInf.el.nodeName || false;
          }

        /*
         * The user is able to set any number of element-level handlers; all 
         * of these will at some point hit the document. The handlers below are 
         * only to execute when the event is at the document level, ignoring
         * events occurring at other levels...
         */
        if(eInf.currentTarget == document)
          {

            /*
             * Now execute custom handlers
             */     
            var a   = AE.handlers[eInf.eventType] || false;   
      
            if(a)
              {
                for(var b in a)
                  {
                    if(eInf && eInf.el && AXIS.match(eInf.el,b).$)
                      {
                        a[b](eInf);
                      }  
                  }
              }
          } 
      };  
      
    this.observe = function(ob)
      {      
        var b = ob || {};
        var s = b.event.split(' '); 
     
        /**
         * If .event argument is a space-delimited list of events, go
         * through them and add each.
         */    
        for(var w=0; w < s.length; w++)
          {
            this.handlers[s[w]][b.selector] = b.handler;
          }  
          
        return true;
      };  
      
    this.unobserve = function(ob)
      {
        var b = ob || {};
        var s = b.event.split(' '); 
  
        /**
         * If .event argument is a space-delimited list of events, go
         * through them and delete each.
         */    
        
        for(var w=0; w < s.length; w++)
          {
            delete this.handlers[s[w]][b.selector];
          }  
          
        return true;
      };
  };
  
