AXIS.Element.extend({
  name:               "attr", 
  func:               function() 
    {
    
    var args  = arguments;
  
    if(args.length === 0) 
      {
        return false;  
      }
    
    /**
     * Two arguments == set name:value
     */
    if(args.length === 2 && AXIS.isString(args[0]))
      {
        if(args[0] == 'class')
          {
            args[0] = 'className';
          }
        
        if(this.attributes.getNamedItem(args[0]))
          {
            el.setAttribute(args[0], '' + args[1]);
          }
        else
          {
            el[args[0]] = args[1];
          }
          
        return true;  
      }
    
    /** 
     * One argument, object == set values
     */
    if(AXIS.isObject(args[0]) || AXIS.isArray(args[0]))
      {
        for(var p in args[0])
          {
            this.attr(p,args[0][p]);  
          }  
        return true;
      }
    
    /**
     * One argument, string == get values
     */
    if(AXIS.isString(args[0]))
      {
        switch(args[0])
          {
            case 'class':
              return this.className;
            break;
            
            case 'tag':
              return this.tagName;
            break;
            
            case 'text':
              return this.innerText || this.textContent;
            break;
            
            case 'html':
              return this.innerHTML;
            break;
            
            default:
              return this.getAttribute(args[0]);
            break;
          }
      } 
   }
});

/**
 * Get an element's position
 */
AXIS.Element.extend({
  name:               'position', 
  func:               function() 
    {
      var left   = 0;
      var top    = 0;
      var ob     = this;
      
      try {
        if(ob.offsetParent) {
          while(ob.offsetParent) {
            left   += ob.offsetLeft;
            top    += ob.offsetTop;
            ob     = ob.offsetParent;
          }
          
        } else if(ob.x) {
          
          left   += ob.x;
          top    += ob.y;
        }
      } catch(e){}
            
      return({left:left,top:top});
    }
});

AXIS.Element.extend({
  name:               'elWidth', 
  func:               function() 
    {
      return this.offsetWidth;
    }
});

AXIS.Element.extend({
  name:               'elHeight', 
  func:               function() 
    {
      return this.offsetHeight;
    }
});