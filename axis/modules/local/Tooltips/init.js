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

$AXIS.Modules.local.Tooltips.__init = function(opts)
  {  
    var b = opts || {};
        
    b.definitions   = b.definitions || {};
    b.topOffset     = b.topOffset || 3;
    b.leftOffset    = b.leftOffset || 3;
    b.maxWidth      = b.maxWidth || 300;
    b.loadDelay     = b.loadDelay || false;
    b.showAbbr      = !!b.showAbbr;

    var id    = 'AXIS_tooltips';
    var top   = b.topOffset;
    var left  = b.leftOffset;
    var maxw  = b.maxWidth;
    var tt,t,c,g,h;
    
    return {
    	show: function(v) 
    	  {
    		  if(tt == null) 
    		    {
    		      tt  = AXIS.Element.create('div',{
    		        id: id,
    		        style:  {
        			    opacity:  0,
        			    filter:   'alpha(opacity=0)',
        			    display:  'block'
    		        }
    		      });

              t   = AXIS.Element.create('div',{
                id: id + 'top'
              });

              c   = AXIS.Element.create('div',{
                id: id + 'cont'
              });
              
              g   = AXIS.Element.create('div',{
                id: id + 'bot'
              });
              
        			tt.appendChild(t);
        			tt.appendChild(c);
        			tt.appendChild(g);

        			AXIS.attachEvent('mousemove', this.pos);
    		    }

    		  c.innerHTML = v;
    		  tt.style.width = 'auto';
    		
      		t.style.display = 'none';
          g.style.display = 'none';
        	tt.style.width = tt.offsetWidth;
        	t.style.display = 'block';
        	g.style.display = 'block';
      		
      		if(tt.offsetWidth > maxw)
      		  {
      		    tt.style.width = maxw + 'px';
      		  }
      		h = parseInt(tt.offsetHeight) + top;
      		
      		AXIS.fadeTo({
      		  element:        tt,
      		  startOpacity:   0,
      		  endOpacity:     100
      		});     		
    	  },
    	  
    	pos: function(e)
    	  {
      		var u = e.pageY || e.clientY + document.documentElement.scrollTop;
      		var l = e.pageX || e.clientX + document.documentElement.scrollLeft;
      		tt.style.top = (u - h) + 'px';
      		tt.style.left = (l + left) + 'px';
    	  },
    	  
    	hide: function()
    	  {
      		AXIS.fadeTo({
      		  element:        tt,
      		  startOpacity:   100,
      		  endOpacity:     0
      		});   
    	  },
    	
    	set: function()
    	  {
    	    /**
    	     * The business end of the tooltip activation
    	     */
    	    function tipSet(t,tip)
    	      {
    	        /**
    	         * As #set may be executed many times over a document (to accomodate
    	         * new elements, for example) we taint elements that have tips.  
    	         * See #markAsSet.
    	         */
    	        if(markedAsSet(t))
    	          {
    	            return;  
    	          }
    	        
    	        /**
    	         * Note that if you allow tooltips on <abbr> tags, the built-in
    	         * browser tooltip using #title will no longer happen.
    	         */
    	        if(b.showAbbr && t.tagName.toLowerCase() === 'abbr')
    	          {
                  t.setAttribute('title','');
    	          }

    	        AXIS.attachEvent('mouseover', function(e) {
    	          $AXIS.Modules.local.Tooltips.show(tip.text); 
    	        },t);
    	          
    	        AXIS.attachEvent('mouseout', function() {
    	          $AXIS.Modules.local.Tooltips.hide();
    	        },t);   
    	        
    	        if(tip.link) {
    	          t.style.cursor = 'pointer';
      	        t.style.cursor = 'hand';
    	          AXIS.attachEvent('click', function() {
    	            document.location.href = tip.link;
    	          },t);  
    	        }

    	        markAsSet(t);
    	      };
    	      
    	    function markedAsSet(t)
    	      {
    	        return !!t.getAttribute('__tipisset__');
    	      };
    	    
    	    function markAsSet(t)
    	      {
    	        t.setAttribute('__tipisset__',1);  
    	      };
    	    
    	    /**
    	     * Find all elements with `AXIS_tooltip` class and if they have
    	     * a `tip` attribute, set the tooltip handlers for the element.
    	     *
    	     * @example: 
    	     *  <span class="AXIS_tooltip" tip="a tip">Some text here</span>
    	     */
    	    AXIS.select(".AXIS_tooltip")
    	      .foreach(function(t){
    	        var tip = t.getAttribute('tip');
      	      tipSet(t,{text: tip});
    	      }); 
    	      
    	    /**
    	     * Find all <dfn> elements, and build a tooltip hash table based on
    	     * b.definitions (if any).  NOTE: is reading the innerText of the <dfn>
    	     * element, and using that as the hash index.
    	     */
    	    AXIS.select("dfn")
    	      .foreach(function(t){
      	      var tip = t.textContent || t.innerText;

      	      if(tip in b.definitions)
      	        {
      	          tipSet(t,b.definitions[tip]);
      	        }
    	      }); 
    	      
    	    /**
    	     * Find all <abbr> elements, and create a tooltip using the `title` attribute.
    	     */
    	    if(b.showAbbr)
    	      {
        	    AXIS.select("abbr")
        	      .foreach(function(t){
          	      var tip = t.getAttribute('title') || '';
          	      if(AXIS.Regexes.text.test(tip))
          	        {
          	          tipSet(t,{text: tip});
          	        }
        	      }); 
        	  }
    	  }
    };
  }
