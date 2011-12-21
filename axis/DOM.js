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
 */
function DOM()
  {
    /*
     * @constructor
     */
    this.__construct = function()
      {
        this.styleSheets        = document.styleSheets || [];
        this.resizeFunctions    = [];
        this.extensions         = {};
        
        AXIS.Errors.createExceptionType('DOMException');
      };

    /**
     * Returns the scroll position of a window.
     *
     * @param    {Object}    [win]     A window object.
     * @param    {Object}    [doc]     A document object.
     *  
     * @type     {Object}
     */ 
    this.scrollPosition = function(win,doc)
      {
        var w   = win || window;
        var d   = doc || document;
      	var x = 0;
      	var y = 0;
      
      	//IE
      	if(!w.pageYOffset)
        	{
        		//strict mode
        		if(!(d.documentElement.scrollTop == 0))
          		{
          			x = d.documentElement.scrollLeft;
          			y = d.documentElement.scrollTop;
          		}
        		//quirks mode
        		else
          		{
          			x = d.body.scrollLeft;
          			y = d.body.scrollTop;
          		}
        	}
      	//w3c
      	else
        	{
        		x = w.pageXOffset;
        		y = w.pageYOffset;
        	}
        	
        return({x:x, y:y});
      }
          
    /**
     * Returns the dimensions of a window.
     *
     * @param    {Object}    [win]     A window object.
     * @param    {Object}    [doc]     A document object.
     *  
     * @type     {Object}
     */   
    this.windowSize = function(win,doc) 
      {
        var w   = win || window;
        var d   = doc || document;
      	var _w  = 0;
      	var _h  = 0;
      
      	//IE
      	if(!w.innerWidth)
        	{
        		//strict mode
        		if(!(d.documentElement.clientWidth == 0))
          		{
          			_w = d.documentElement.clientWidth;
          			_h = d.documentElement.clientHeight;
          		}
        		//quirks mode
        		else
          		{
          			_w = d.body.clientWidth;
          			_h = d.body.clientHeight;
          		}
        	}
      	//w3c
      	else
        	{
        		_w = w.innerWidth;
        		_h = w.innerHeight;
        	}
      	return {width:_w, height:_h};
      };
      
    /**
     * Returns the center point of this document, adjusting for
     * scroll.  If an element.style is sent, the coordinates returned
     * will represent the left,top values which would center the element.
     *
     * @param    {Object}    elStyle     A DOMElement style object
     * @type     {Object}
     */
    this.viewCenter = function(elStyle)
      {
      	var e = elStyle || {width:0, height:0};

      	var s   = this.scrollPosition();
      	var ws  = this.windowSize();
      	var x = ((ws.width  - parseInt(e.width)) /2) + s.x;
      	var y = ((ws.height - parseInt(e.height)) /2) + s.y;
      
      	return{x:x, y:y};
      };

      
    this.getElWidth = function(el)
      {
        return el.offsetWidth;
      };
      
    this.getElHeight = function(el)
      {
        return el.offsetHeight;
      };
      
    this.findPos = function(obj)
      {
        var left   = 0;
        var top    = 0;
    
        try
          {
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
          } catch(e){}
            
        return({left:left,top:top});
      };
      
    /**
     * Ensures clean element removal, avoiding memory leaks
     * in some IE browsers. From: http://javascript.crockford.com/memory/leak.html
     */
    this.purgeElement = function(d) 
      {
        var a = d.attributes, i, l, n;
        if(a) 
          {
            l = a.length;
            for(var i = 0; i < l; i += 1) 
              {
                n = a[i].name;
                if(typeof d[n] === 'function') 
                  {
                    d[n] = null;
                  }
              }
          }
        a = d.childNodes;
        if(a) 
          {
            l = a.length;
            for(var i = 0; i < l; i += 1) 
              {
                arguments.callee(d.childNodes[i]);
              }
          }
      };
      
    this.setInnerHTML = function(el,repStr)
      {
        var rep = repStr || false;
        
        this.purgeElement(el);
        
        el.innerHTML = rep || '';
      };
      
    /**
	   * Developed by Robert Nyman, http://www.robertnyman.com
	   * Code/licensing: http://code.google.com/p/getelementsbyclassname/
     */
    this.getElementsByClassName = function (className, tag, elm)
      {
        var getElementsByClassName;
        if (document.getElementsByClassName) {
        	getElementsByClassName = function (className, tag, elm) {
        		elm = elm || document;
        		var elements = elm.getElementsByClassName(className),
        			nodeName = (tag)? new RegExp("\\b" + tag + "\\b", "i") : null,
        			returnElements = [],
        			current;
        		for(var i=0, il=elements.length; i<il; i+=1){
        			current = elements[i];
        			if(!nodeName || nodeName.test(current.nodeName)) {
        				returnElements.push(current);
        			}
        		}
        		return returnElements;
        	};
        }
        else if (document.evaluate) {
        	getElementsByClassName = function (className, tag, elm) {
        		tag = tag || "*";
        		elm = elm || document;
        		var classes = className.split(" "),
        			classesToCheck = "",
        			xhtmlNamespace = "http://www.w3.org/1999/xhtml",
        			namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace)? xhtmlNamespace : null,
        			returnElements = [],
        			elements,
        			node;
        		for(var j=0, jl=classes.length; j<jl; j+=1){
        			classesToCheck += "[contains(concat(' ', @class, ' '), ' " + classes[j] + " ')]";
        		}
        		try	{
        			elements = document.evaluate(".//" + tag + classesToCheck, elm, namespaceResolver, 0, null);
        		}
        		catch (e) {
        			elements = document.evaluate(".//" + tag + classesToCheck, elm, null, 0, null);
        		}
        		while ((node = elements.iterateNext())) {
        			returnElements.push(node);
        		}
        		return returnElements;
        	};
        }
        else {
        	getElementsByClassName = function (className, tag, elm) {
        		tag = tag || "*";
        		elm = elm || document;
        		var classes = className.split(" "),
        			classesToCheck = [],
        			elements = (tag === "*" && elm.all)? elm.all : elm.getElementsByTagName(tag),
        			current,
        			returnElements = [],
        			match;
        		for(var k=0, kl=classes.length; k<kl; k+=1){
        			classesToCheck.push(new RegExp("(^|\\s)" + classes[k] + "(\\s|$)"));
        		}
        		for(var l=0, ll=elements.length; l<ll; l+=1){
        			current = elements[l];
        			match = false;
        			for(var m=0, ml=classesToCheck.length; m<ml; m+=1){
        				match = classesToCheck[m].test(current.className);
        				if (!match) {
        					break;
        				}
        			}
        			if (match) {
        				returnElements.push(current);
        			}
        		}
        		return returnElements;
        	};
        }
        return getElementsByClassName(className, tag, elm);
      };
  };
