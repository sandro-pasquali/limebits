/**
 * Copyright 2008 Lime Labs LLC
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
 
AXIS.__selector__ = (function(){
/** Essential Selector
 * @author          Andrea Giammarchi
 * @blog            WebReflection
 * @version         0.1.1
 * @compatibilty    vary on browser CSS selectors capabilities.
 *                  tested in IE6 to 8, FireFox, Opera, Chrome, Safari
 * @param   String      CSS selector
 * @param   HTMLElement optional context to use with selector (makes search faster)
 * @return  Array       a JavaScript Array with 0, 1, or more, found elements
 *
 * @author Sandro Pasquali (spasquali@gmail.com) -- Worked ES into the AXIS libraries system.
 */
var slice   = Array.prototype.slice,
    div     = document.createElement("div");
try{slice.call(div.childNodes)}catch(e){
    slice = function(i){
        var result = [],
            length = this.length;
        while(i < length)
            result[i] = this[i++];
        return result;
    };
};
if(div.querySelectorAll){
    div = null;
    return function(selector, HTMLElement){
        return slice.call((HTMLElement || document).querySelectorAll(selector), 0);
    };
};
var id          = /^#[a-zA-Z0-9_\-]+$/,
    nodeName    = /^(\*|[a-zA-Z0-9]+)$/,
    className   = /^\.[a-zA-Z0-9_\-]+$/,
    TagClass    = /^(\*|[a-zA-Z0-9]+)\.[a-zA-Z0-9_\-]+$/,
    counter     = "_" + ("" + Math.random()).slice(2),      // kangax thinks it's better
    clean = function(result){
        var length = result.length;
        while(length)
            delete result[--length][counter];
        return result;
    },
    getElementsByClassName = div.getElementsByClassName ?
        function(className, HTMLElement){
            return slice.call(HTMLElement.getElementsByClassName(className), 0);
        }:
        function(className, HTMLElement){
            return getElementsByTagClass("*." + className, HTMLElement);
        }
    ,
    getElementsByTagClass = function(selector, HTMLElement){
        for(var
            split   = selector.split("."),
            childNodes = HTMLElement.getElementsByTagName(split.shift()),
            re      = new RegExp("(?:\\s|^)" + split.shift() + "(?:\\s|$)"),
            length  = childNodes.length,
            i       = 0,
            j       = 0;
            i < length; ++i
        ){
            HTMLElement = childNodes[i];
            if(re.test(HTMLElement.className))
                split[j++] = HTMLElement;
        };
        return split;
    },
    path = function path(HTMLElement){
        var parentNode  = HTMLElement.parentNode,
            result      = [HTMLElement.nodeName],
            i           = 0;
        while(parentNode && parentNode.nodeType != 9){
            result[++i] = parentNode.nodeName;
            parentNode = parentNode.parentNode;
        };
        return result.reverse().join(" ");    
    },
    querySelectorAll = document.defaultView && document.defaultView.getComputedStyle ?
        (function(style){
            return function(selector, HTMLElement){
                for(var
                    text    = HTMLElement === document ? "" : path(HTMLElement),
                    length  = selector.length,
                    i       = 0;
                    i < length;
                    ++i
                )
                    selector[i] = text.concat(" ", selector[i]);
                for(var
                    text = style.appendChild(document.createTextNode(
                        selector.join(",").concat("{counter-increment:", counter, ";}")
                    )),
                    defaultView = document.defaultView,
                    childNodes  = HTMLElement.getElementsByTagName(selector.length === 1 ? resolve(selector[0]) : "*"),
                    result      = [],
                    length      = childNodes.length,
                    i           = 0,
                    j           = 0,
                    tmp;
                    i < length;
                    ++i
                ){
                    tmp = childNodes[i];
                    if(-1 < defaultView.getComputedStyle(tmp, null).getPropertyValue("counter-increment").indexOf(counter))
                        result[j++] = tmp;
                };
                style.removeChild(text);
                return result;
            };
        })((document.getElementsByTagName("head")[0] || document.documentElement).appendChild(document.createElement("style"))):
        (function(style){
            return function(selector, HTMLElement){
                for(var
                    increment = "counter-increment:" + counter,
                    text    = HTMLElement === document ? "" : path(HTMLElement),
                    length  = selector.length,
                    i       = 0;
                    i < length;
                    ++i
                )
                    style.addRule(selector[i] = text.concat(" ", selector[i]), increment, -1);
                for(var
                    childNodes  = HTMLElement.getElementsByTagName(selector.length === 1 ? resolve(selector[0]) : "*"),
                    result      = [],
                    length      = childNodes.length,
                    i           = 0,
                    j           = 0,
                    tmp;
                    i < length;
                    ++i
                ){
                    tmp = childNodes[i];
                    if(tmp.currentStyle["counter-increment"] == counter)
                        result[j++] = tmp;
                };
                i       = 0;
                length  = selector.length;
                while(i < length)
                    style.removeRule(selector[i++]);
                return result;
            };
        })(document.createStyleSheet()),
    resolve = function(selector){                           // dean suggested a speed up
        selector = selector.split(" ").pop();
        return nodeName.test(selector) ? selector : TagClass.test(selector) ? selector.split(".").shift() : "*";
    },
    unique = function(childNodes){
        for(var
            result  = [],
            length  = childNodes.length,
            i       = 0,
            j       = 0,
            current;
            i < length;
            ++i
        ){
            current = childNodes[i];
            if(!current[counter]){
                current[counter] = true;
                result[j++] = current;
            };
        };
        return  clean(result);
    }
;
div[counter] = true;
try{
    delete div[counter];
}catch(e){
    clean = function(result){
        var length = result.length;
        while(length)
            result[--length].removeAttribute(counter);
        return result;
    };
};
div = null;
return function(selector, HTMLElement){
    for(var
        context = HTMLElement || document,
        split   = selector.split(/\s*,\s*/),
        length  = split.length,
        i       = 0,
        j       = 0,
        result  = [],
        ignore  = [],
        current, undefined;
        i < length;
        ++i
    ){
        current = split[i];
        switch(true){
            case    id.test(current):
                if(current = context.getElementById(current.substring(1)))
                    result.push(current);
                break;
            case    nodeName.test(current):
                result.push.apply(result, slice.call(context.getElementsByTagName(current), 0));
                break;
            case    className.test(current):
                result.push.apply(result, getElementsByClassName(current.substring(1), context));
                break;
            case    TagClass.test(current):
                result.push.apply(result, getElementsByTagClass(current, context));
                break;
            default:
                ignore.push(current);
                break;
        };
    };
    if(ignore.length)
        result.push.apply(result, querySelectorAll(ignore, context));
    return arguments.callee.duplicated === false ? unique(result) : result;
};
})();

AXIS.extend({
  name:       'select',
  func:       function(q,c) 
    {
      if(q) 
        {
	        return AXIS.__selector__(q) || []; 
	      }
	    return [];
    }
});