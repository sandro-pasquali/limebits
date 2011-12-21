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
 * @requires AXIS
 * @requires  Keyboard
 *
 */
function EventsExtended()
  {
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
        tag:                false,
        
        /*
         * drag/drop and select
         */
        selectedItems:      [],
        lastSelectedItem:   {},
        dragStarted:        false,
        draggable:          false,
        selectable:         false,
        payloadType:        false,
        acceptsDropType:    false,
        ghost:              {},
        delayedMouseDown:   false
      };
      
    this.selectItem = function(evInf)
      {
        if(this.itemIsSelected(evInf) === false)
          {
            var id = evInf.elId;
            var el = evInf.el;
              
            if(evInf.selectable)
              {
                var sOb = 
                  {
                    elId:               id,
                    el:                 el,
                    draggable:          evInf.draggable,
                    payloadType:        evInf.payloadType,
                    backgroundColor:    evInf.el.style.backgroundColor,
                    left:               evInf.elLeft,
                    top:                evInf.elTop,
                    width:              evInf.elWidth,
                    height:             evInf.elHeight
                  };
                      
                this.eventInfo.selectedItems.push(sOb);               
                    
                evInf.el.style.backgroundColor = this.selectionBackgroundColor;  
                this.eventInfo.lastSelectedItem = sOb; 
                    
                return sOb;
              }
          }
        return false;
      };
              
    this.deselectItem = function(evInf)
       {
         var sel = this.itemIsSelected(evInf);
         if(sel !== false)
           {
             var ss = this.eventInfo.selectedItems[sel];
                
             ss.el.style.backgroundColor = ss.backgroundColor;
             this.eventInfo.selectedItems.splice(sel,1);
                 
             /*
              * check if this is lastSelectedItem, and snip if so.
              */
             if(this.lastSelectedItem && (ss.elId == this.lastSelectedItem.elId))
               {
                 this.lastSelectedItem = {};  
               }
           }
       };
       
    this.clearSelectedItems = function()
      {
        var sl = this.eventInfo.selectedItems;
        var i = sl.length;
        while(i--)
          {
            sl[i].el.style.backgroundColor = sl[i].backgroundColor;
          }
        
        this.eventInfo.selectedItems = [];
        this.eventInfo.lastSelectedItem = {};
      };
       
    this.itemIsSelected = function(evInf)
      {
        var id = evInf.elId;
        var s = this.eventInfo.selectedItems;
        var sL = s.length;
        while(sL--)
          {
            if(s[sL].elId == id)
              {
                return sL;
              }
          }
      
        return false;
      };
      
    this.prepareDrag = function(dOb)
      {
        this.eventInfo.pendingDragOb = dOb;
      }  
      
    this.startDrag = function()
      {
        var evi = this.eventInfo;
        
        evi.dragStarted = true;

        evi.ghost = AXIS.Element.create('div', {
          id:         'GHOST',
          style:      {
            position:       'absolute',
            left:           '0px',
            top:            '0px',
            paddingLeft:    '0px',
            paddingTop:     '0px',
            width:          '100px',
            height:         '100px',
            zIndex:         '10000',
            border:         '1px black solid'  
          }
        });
        
        /*
         * Now find all selected elements that are draggable,
         * and add that info to the drag indicator
         */
        var i     = evi.selectedItems.length;
        
        while(i--)
          {
            if(evi.selectedItems[i].draggable)
              {
                var gI = document.createElement('div');
                gI.appendChild(document.createTextNode(evi.selectedItems[i].elId));
                
                evi.ghost.appendChild(gI);
              }
          }
      };
      
    this.endDrag = function(evInf)
      {
        try
          {
            evInf.dragStarted = false;
            evInf.pendingDragOb = false;
            evInf.delayedMouseDown = false;
            
            evInf.ghost.parentNode.removeChild(this.eventInfo.ghost);
          }
        catch(e){}
      };

    this.monitor = function(e)
      {       
        var AE                = AXIS.EventsExtended;
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
        
        /*
         * Could also fetch w/h via AXIS.DOM methods, but this avoids
         * making additional function calls
         */
        eInf.elWidth          = eInf.el.offsetWidth;
        eInf.elHeight         = eInf.el.offsetHeight;
        
        /*
         * NOTE the addition of 'on' here:
         * the .type value of an event for an
         * onclick would be 'click'...
         */
        eInf.eventType        = ev.type;
        
        if(eInf.el.getAttribute)
          {
            eInf.elId             = eInf.el.getAttribute('id');
            eInf.elClass          = eInf.el.getAttribute('class');
            eInf.tag              = eInf.el.nodeName || false;
            
            eInf.draggable        = (eInf.el.getAttribute('draggable')) 
                                  ? true 
                                  : false;
                           
            eInf.payloadType      = eInf.el.getAttribute('payloadType') || '*';
            eInf.acceptsDropType  = (eInf.el.acceptsDropType) || false;
            
            eInf.selectable       = (eInf.el.getAttribute('selectable') == 'true') 
                                  ? true 
                                  : false;
          }

        /*
         * The user is able to set any number of element-level
         * handlers; all of these will eventually `bubble` to 
         * the document.  The handlers below are only to execute
         * when the event is at the document level, ignoring
         * events occurring at other levels...
         */
        if(eInf.currentTarget == document)
          {
            switch(eInf.eventType)
              {
                case 'mousemove':
                //document.title = eInf.elId;
                
                /*
                 * Make copies of items, on mousedown calculate distances
                 * from each element, make clones, and have them follow
                 * the mouse with proper relative spacing
                 */
                  if(eInf.pendingDragOb)
                    {
                      if(eInf.dragStarted === false)
                        {
                          AE.startDrag();
                        }
                        
                      var ss = AE.eventInfo.ghost.style;
                      
                      ss.left = (eInf.x + 10).toString() + 'px';
                      ss.top = (eInf.y + 10).toString() + 'px';
                    }
                
                break;
                
                case 'mousedown':
                  /* 
                   * clicking on any non-selectable item
                   * clears all selected
                   */
                  if(eInf.selectable === false)
                    {
                      AE.clearSelectedItems();
                    }
                  else if(AXIS.Keyboard.lastModKey == AXIS.Keyboard.CTRL)
                    {
                      if(AE.itemIsSelected(eInf) !== false)
                        {
                          /* 
                           * User has clicked on a selected item
                           * using CTRL; deselect item
                           */ 
                          AE.deselectItem(eInf);
                        }
                      else
                        {
                          /*
                           * ctrl + new item -- select
                           */
                          AE.selectItem(eInf);
                        }
                    }
                  else if(AXIS.Keyboard.lastModKey != AXIS.Keyboard.SHIFT)
                    {
                      if(AE.itemIsSelected(eInf) === false)
                        {
                          /*
                           * No CTRL, clicked on unselected item.  Clear
                           * all others and select current.
                           */
                          AE.clearSelectedItems();
                          AE.selectItem(eInf);
                        }
                      else
                        {
                          /*
                           * No CTRL, clicked on selected item.
                           * see below for delayed mouse down
                           */
                          AE.selectItem(eInf);
                        }
                            
                      /*
                       * NOTE that all draggable
                       * elements MUST also be selectable 
                       */
                      if(eInf.draggable)
                        {
                          eInf.delayedMouseDown = true;
                          AE.prepareDrag(eInf);
                        }
                    }
                  
                  /* 
                   * To avoid any problems with text selection and
                   * other event conflicts, if this is a draggable
                   * element we break the event chain here.
                   */
                  if(eInf.draggable === true)
                    {
                      if(AXIS.isIE)
                        {
                          document.body.setCapture();
                        }
                      return false;   
                    }
                    
                break;
                
                case 'mouseup':
                
                  if(AXIS.isIE)
                    {
                      document.body.releaseCapture();
                    }
                
                  if(AXIS.Keyboard.lastModKey == AXIS.Keyboard.SHIFT)
                    {
                      /*
                       * SHIFT + click.  
                       */
                      if(eInf.selectedItems.length > 0)
                        {

                          if((eInf.selectable === true) && (AE.itemIsSelected(eInf)===false))
                            {
                              var sib = eInf.el.parentNode.childNodes;
                              var lsel = eInf.lastSelectedItem;
                              var pointsFound = 0;
                              var pArr = [];
                              var _s;
                              var sL = sib.length;
                              /*
                               * There are two points we are selecting
                               * between; 1) the last selected item; 2) the
                               * current selection.  run children, and
                               * when you find EITHER of these, select
                               * between THAT point and the point where
                               * the OTHER is found
                               */
                              while(--sL)
                                {
                                  /*
                                   * Because of different event passing models, all browsers
                                   * except IE will see a text node (nodeType==3) in the case of 
                                   * <div selectable="true">texthere</div>; IE sees the parent <div>, 
                                   * which is what we ultimately want. Adjust for others.
                                   */
                                  _s = sib[sL].nodeType == 3 ? sib[sL].parentNode : sib[sL];
                              
                                  /*
                                   * Valid elements to include in this group are
                                   * selectable and with same payloadType as the last
                                   * selected element...
                                   */
                                  if(_s.getAttribute('selectable') == 'true') 
                                    {
                                      if((_s === lsel.el) || (_s === eInf.el))
                                        {
                                          ++pointsFound;
                                        }
                                        
                                      if(pointsFound > 0)
                                        {
                                          var pos = AE.findPos(_s);
                                          var eOb = 
                                            {
                                              elId: _s.getAttribute('id'),
                                              el: _s,
                                              draggable: (_s.getAttribute('draggable')) ? true : false,
                                              payloadType: _s.getAttribute('payloadType') || '*',
                                              backgroundColor: _s.style.backgroundColor,
                                              selectable: (_s.getAttribute('selectable') == 'true') ? true : false,
                                              
                                              
                                              elLeft    : pos.left,
                                              elTop     : pos.top,
                                              elWidth   : _s.offsetWidth,
                                              elHeight  : _s.offsetHeight
                                            };
                                          
                                          pArr.push(eOb);
                                        }
                                        
                                      if(pointsFound == 2)
                                        {
                                          /* 
                                           * we found 2 points; select and exit
                                           */
                                          var i = pArr.length;
                                          while(--i)
                                            {
                                              AE.selectItem(pArr[i]);
                                            }
                                            
                                          return;
                                        }
                                    }
                                }
                              /*
                               * If we get here, what has happened
                               * is that the user has clicked, with shift,
                               * on a valid selectable element while there
                               * was at least one other element selected, yet
                               * that previously selected element was not
                               * a child under the same parent.  treat as a
                               * single click -- clear all selected and select current
                               */
                              AE.clearSelectedItems();
                              AE.selectItem(eInf);
                            }
                        }
                    }
                  else if(AXIS.Keyboard.lastModKey != AXIS.Keyboard.CTRL)
                    {
                      if(eInf.delayedMouseDown)
                        {
                          /*
                           * delayedMousedown indicates that a draggable element
                           * has been touched; if the user hasn't started dragging, 
                           * then treat this as a normal click (clear and select item).
                           *
                           * If the item has started dragging, the below will be ignored,
                           * and ultimately no change will occur to selections, which
                           * will simply be dropped.
                           */
                          if(!eInf.dragStarted)
                            {
                              AE.clearSelectedItems();
                              AE.selectItem(eInf);
                            }
                        }
                    }
                    
                  AE.endDrag(eInf);
                    
                break;
                
                default:
                break;
              }
            /*
             * Now execute custom handlers
             */     
            var a   = AE.handlers 
                    ? AE.handlers[eInf.eventType] || false 
                    : false;  
            
            if(a)
              {
                for(var b in a)
                  {
                    if(AXIS.match(eInf.el,b).$)
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
  
