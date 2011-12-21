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

function DragDrop()
  {
    this.__construct = function(args)
      { 
        /*
         * required...
         */       
        this.dropHandler  = args[0];
        
        this.dragStarted  = false;
        this.isDroppable  = false;
        
        /*
         * whenever a drop occurs, these values will be set, which the
         * drop handler can use.  See mouseUp, mouseDown...
         */
        this.payloadId        = false;
        this.payloadClass     = false;
        this.payloadType      = false;
        this.acceptList       = false;
        this.dropTargetId     = false;
        this.dropTargetClass  = false;
        this.dropTargetType   = false;
        
        /*
         * create ghost layer, for dragging. We expect to have
         * defined in css somewhere values for `ghost_on`, `ghost_off`
         */
        var g         = document.createElement('div');
        g.id          = 'drag_ghost';
        g.className   = 'ghost_off'; 
        
        this.ghost    = document.body.appendChild(g);
      };
      
    this.buildGhost = function(el)
      {
        var pth = el.id;
        var pI = pth.split(':');
        var lf = pI[pI.length-1];
        var nm = lf.replace('_',' ');
        
        /*
         * Determine type.  Classnames of draggable elements MUST always
         * be terminated with a type, prefixed by an underscore.
         * Ex: x_folder || x_file.
         * Split and fetch type.
         */
        var _s  = el.className.split('_');
        var typ = _s[_s.length-1];   
        
        /*
         * use type to determine icon
         */
        var ic = (typ == 'folder') ? 'folder_blue' : 'html_blue';
              
        this.ghost.innerHTML = '<img src="images/icons/' + ic + '.png" style="float:left; margin-right:6px;" payloadId="' + pth + '" payloadType="' + typ + '" />' + nm;
      };
      
    this.findDropTarget = function(el)
      {
        /*
         * We can only drop on elements who have 'accepts' attribute set.
         * Find it (may have to bubble to parent). 
         */
        var acc  = false;
    
        while(el)
          {
            try
              {          
                acc = el.getAttribute('accepts');
                
                if(acc)
                  {
                    return el;
                  }
              }
            catch(e){}
            
            el = el.parentNode;
          }
  
        return false;  
      };
  
    this.indicateDropStatus = function(el)
      {
        var acc = this.findDropTarget(el);
        if(acc)
          {
            /*
             * check acceptList against payloadType.  acceptList is space separated list.
             */
            var _s = acc.getAttribute('accepts').split(' ');
            for(var p in _s)
              {
                if(_s[p] == this.payloadType)
                  {
                    /*
                     * check if we've simply dropped onto the orignal element...
                     */
                    if(acc.id != this.payloadId)
                      {
                        /*
                         * now check for folder movements.  You cannot move a parent
                         * folder into a child folder.  We check this when we have a 
                         * folder > folder situation, simply by checking if the payload
                         * id is present in the dropTarget id.
                         */
                        if(acc.id.indexOf(this.payloadId) == -1)
                          {
                            this.isDroppable = true;
                            this.ghost.className = 'ghost_on';
                            return;
                          }
                      }
                  }  
              }
          }
        /*
         * if not droppable...
         */
        this.isDroppable = false;
        this.ghost.className = 'ghost_off';
        
        return;
      };
      
    // remove the events
    this.mouseUp = function(e)
      {
        var ev = e || window.event;
        var tg = (e) ? ev.target : ev.srcElement;
    
        var DD = $.DragDrop;
        
        /*
         * clean up drag events and indicator.
         */
        document.onmouseup          = null;
        document.onmousemove        = null;     
        DD.ghost.style.visibility   = 'hidden';
        DD.ghost.style.left         = '0px';
        DD.ghost.style.top          = '0px';
        this.dragStarted            = false;
  
        /*
         * on mouse up, if .isDroppable is true, fire drop
         */
        if(DD.isDroppable)
          {
            var acc = DD.findDropTarget(tg);
            
            if(acc)
              {
                /*
                 * We now store the information (final state of drag/drop sequence),
                 * to be read, or not, by the handler we notify about the drop event.
                 * NOTE that we stored the payload information on the mousedown event.
                 */
                DD.acceptList       = acc.getAttribute('accepts');
                DD.dropTargetId     = acc.id;
                DD.dropTargetClass  = acc.className;
                
                /*
                 * All drop targets must have a class set.  The type of is
                 * indicated by the string following the final '_' in the class name.
                 * For example, a folder will have x_folder as its class; a file, x_file.
                 */
                var _s = DD.dropTargetClass.split('_');
                DD.dropTargetType = _s[_s.length-1];
     
                /*
                 * a drop has occurred. call handler.
                 */
                DD.dropHandler();
              }
          }

        return true;
      };
  
    this.mouseMove = function(e)
      {
        var ev = e || window.event;
        var tg = (e) ? ev.target : ev.srcElement;
        
        var DD = $.DragDrop;

        DD.ghost.style.left = (parseInt(ev.clientX) + 10) + 'px';
        DD.ghost.style.top = (parseInt(ev.clientY) + 10) + 'px';
        
        /*
         * update ghost with drop/nodrop indication
         */
        DD.indicateDropStatus(tg);
        
        if(!this.dragStarted)
          {
            this.dragStarted = true;
            DD.ghost.style.visibility = 'visible';
            /*
             * Clear any selections on page.
             */
            DD.ghost.focus();
          }
 
        return true;
      };
  
    // initiate the drag
    this.mouseDown = function(e)
      {
        var ev = e || window.event;
        
        var DD = $.DragDrop;

        document.onmouseup = DD.mouseUp;
        document.onmousemove = DD.mouseMove;
    
        /* 
         * we need to store the payload information (the dragging el),
         * and init the drop info.
         */
        DD.payloadId        = this.id;
        DD.payloadClass     = this.className;
        DD.acceptList       = false;
        DD.dropTargetId     = false;
        DD.dropTargetClass  = false;
        DD.dropTargetType   = false;
        
        /*
         * All payloads must have a class set.  The type of payload is
         * indicated by the string following the final '_' in the class name.
         * For example, a folder will have x_folder as its class; a file, x_file.
         */
        var _s = this.className.split('_');
        DD.payloadType = _s[_s.length-1];
        
        DD.isDroppable = false;
        DD.buildGhost(this);

        return false;
      };
  
    this.addDraggables = function(d_list)
      {
        /*
         * set all elements that can be dragged
         */
        for(var p in d_list)
          {
            d_list[p].onmousedown = this.mouseDown;
          }
      };
  }
