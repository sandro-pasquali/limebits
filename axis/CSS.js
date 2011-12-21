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
 * General CSS manipulation/reading functionality.  Allows the dynamic modification of 
 * style sheets, reading of values, etc.
 *
 * @see http://www.javascriptkit.com/dhtmltutors/externalcss3.shtml
 */
function CSS()
  {
    /*
     * @constructor
     */
    this.__construct = function()
      {
      };
    
    /**
     * Returns the current stylesheet collection
     */
    this.sheets = function()
      {
        return document.styleSheets; 
      };
    
    /**
     * Find a CSS rule based on selector.  
     * 
     * @param    {String}    r     A valid CSS selector
     * @returns                    The rule, or false if none.
     * @example:   var r = CSS.findRule('.myClass');
     *              r.style.width = '100px';
     */
    this.findRule = function(r)
      {
        var ss    = this.sheets();
        var rn    = (r) ? r.toLowerCase() : ''; 
        var i     = ss.length;
        
        while(i--) 
          { 
            var styleSheet  = ss[i];
            var ii          = 0;                              
            var cssRule     = false;                      
            do
              {                                   
                if(styleSheet.cssRules) 
                  {          
                    cssRule = styleSheet.cssRules[ii];
                  } 
                else 
                  {                             
                    cssRule = styleSheet.rules[ii];    
                  }                                    
                if(cssRule && (cssRule.selectorText.toLowerCase()==rn))  
                  {                      
                    return({sheet:styleSheet,rule:cssRule,style:cssRule.style,index:ii});                                 
                  }                                     
                ii++;                                 
              } while(cssRule)                        
          } 
        return false;   
      };  
             
    this.fetchAllRules = function()
      {
        var ss    = this.sheets();
        var i     = ss.length;
        var ret   = [];
        while(i--) 
          { 
            var styleSheet  = ss[i];
            var ii          = 0;                              
            var cssRule     = false;                      
            do
              {                                   
                if(styleSheet.cssRules) 
                  {          
                    cssRule = styleSheet.cssRules[ii];
                  } 
                else 
                  {                             
                    cssRule = styleSheet.rules[ii];    
                  }                                    
                       
                if(cssRule)  
                  {                      
                    ret.push({
                      sheet:  styleSheet,
                      rule:   cssRule,
                      style:  cssRule.style,
                      index:  ii
                    });        
                  }                                         
                ii++;                                 
              } while(cssRule)                        
          } 
        return ret;   
      };  
                                                 
    /**
     * Remove a CSS rule based on selector.  
     *
     * @param    {String}    r     A valid CSS selector
     * @returns                    Boolean, whether a rule was removed
     * @example:   var r = CSS.removeRule('.myClass');
     */
    this.removeRule = function(r) 
      { 
        var rr = this.findRule(r);    
        if(rr)
          { 
            var ss    = rr.sheet;
            var rule  = rr.rule;
            var ind   = rr.index;
            
            if(ss.cssRules) 
              {  
                ss.deleteRule(ind);
              } 
            else 
              {                     
                ss.removeRule(ind);
              }                            
            return true;                 
          } 
        return false;
      };    
    /*
     * Allows the addition of a style rule.
     *                         
     * @param    {String}    r     A valid CSS selector
     * @returns                    The new rule
     */
    this.addRule = function(r) 
      {       
        var ss = this.sheets();
        if(!this.findRule(r)) 
          {    
            if(ss[0].addRule) 
              {       
                ss[0].addRule(r, null,0);
              } 
            else 
              {                   
                ss[0].insertRule(r+' { }', 0);
              }        
          }                        
        return this.findRule(r);   
      }; 
      
    this.getStyle = function(oElm, strCssRule)
      {
        var strValue = "";
        if(document.defaultView && document.defaultView.getComputedStyle)
          {
            var css = document.defaultView.getComputedStyle(oElm, null);
            strValue = css ? css.getPropertyValue(strCssRule) : null;
          }
        else if(oElm.currentStyle)
          {
            strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1){
                return p1.toUpperCase();
            });
            strValue = oElm.currentStyle[strCssRule];
          }
        return strValue;
      };
  };