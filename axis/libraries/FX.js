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
 * FX v2.0
 * Copyright (c) 2009 Ryan Morr (ryanmorr.com)
 * Licensed under the MIT license.
 */

(function(){
	AXIS.createNamespace('FX');
	/**
	 * Constructor - initiate with the new operator
	 * @param {Element} el The element to which the animation will be performed against
	 * @param {Object} attributes Object containing all the attributes to be animated and the values
	 * @param {Number} duration How long should the animation take in seconds (optional)
 	 * @param {String} transition Name of the method in charge of the transitional easing of the element (optional)
	 * @param {Function} callback The function to be executed after the animation is complete (optional)
	 * @param {Object} ctx The context for which the callback will be executed in (optional)
	 */
	$AXIS.FX = function(el, attributes, duration, transition, callback, ctx){
		this.el = DOM.get(el);
		this.attributes = attributes;
		this.duration = duration || 0.7;
		this.transition = (!!transition && transition in $AXIS.FX.transitions) ? transition : "easeInOut";
		this.callback = callback || function(){};
		this.ctx = ctx || window;
		
		/**
		 * The object that holds the CSS unit for each attribute
		 * @type Object
		 */
		 this.units = {};
		
		/**
		 * The object to carry the current values for each frame
		 * @type Object
		 */
		this.frame = {};
		
		/**
		 * The object containing all the ending values for each attribute
		 * @type Object
		 */
		this.endAttr = {};
		
		/**
		 * The object containing all the starting values for each attribute
		 * @type Object
		 */
		this.startAttr = {};
	};
	
	/**
	 * Object containing all the transitional easing methods.
	 * Is available to the global context to facilitate adding additionial transitions as desired
	 */
	$AXIS.FX.transitions = {

		linear: function(t, b, c, d){
			return c*t/d + b;
		},
		
		easeIn: function(t, b, c, d) {
			return -c * Math.cos(t/d *(Math.PI/2)) + c + b;
		},  
		
		easeOut: function(t, b, c, d) {
			return c * Math.sin(t/d *(Math.PI/2)) + b;
		}, 
		
		easeInOut: function(t, b, c, d) {
			return -c/2 *(Math.cos(Math.PI*t/d) - 1) + b;
		}
	};
	
	$AXIS.FX.prototype = {

		/**
		 * start the animation
		 */
		start: function(){
			var fx = this;
			this.getAttributes();
			this.duration = this.duration * 1000;
			this.time = new Date().getTime();
			this.animating = true;
			this.timer = setInterval(function(){
				var time = new Date().getTime();
				if(time < (fx.time + fx.duration)){
					fx.elapsed = time - fx.time;
					fx.setCurrentFrame();
				}else{
					fx.frame = fx.endAttr;
					fx.complete();
				}
				fx.setAttributes();
			}, 1)
		},
		
		/**
		 * Perform a transitional ease to keep the animation smooth
		 * @param {Number} start The starting value for the attribute
		 * @param {Number} end The ending value for the attribute
		 * @return {Number} Calculated percentage for the frame of the attribute
		 */
		ease: function(start, end){
			return $AXIS.FX.transitions[this.transition](this.elapsed, start, end - start, this.duration);
		},
		
		/**
		 * Complete the animation by clearing the interval and nulling out the timer,
		 * set the animating property to false, and execute the callback
		 */
		complete: function(){
			clearInterval(this.timer);
			this.timer = null;
			this.animating = false;
			this.callback.call(this.ctx);
		},
		
		/**
		 * Set the current frame for each attribute by calculating the ease and setting the new value
		 */
		setCurrentFrame: function(){
			for(attr in this.startAttr){ 
				if(this.startAttr[attr] instanceof Array){
					this.frame[attr] = [];
					for(var i=0; i < this.startAttr[attr].length; i++){
						this.frame[attr][i] = this.ease(this.startAttr[attr][i], this.endAttr[attr][i]);
					}
				}else{
					this.frame[attr] = this.ease(this.startAttr[attr], this.endAttr[attr]);
				}
			}
		},
		
		/**
		 * Get all starting and ending values for each attribute
		 */
		getAttributes: function(){
			for(var attr in this.attributes){
				switch(attr){
					case 'color':
					case 'borderColor':
					case 'border-color':
					case 'backgroundColor':
					case 'background-color':
						this.startAttr[attr] = parseColor(this.attributes[attr].from || DOM.getStyle(this.el, attr));
						this.endAttr[attr] = parseColor(this.attributes[attr].to);
						break;
					case 'scrollTop':
					case 'scrollLeft':
						var el = (this.el == document.body) ? (document.documentElement || document.body) : this.el;
						this.startAttr[attr] = this.attributes[attr].from || el[attr];
						this.endAttr[attr] = this.attributes[attr].to;
						break;
					default:
						var start;
						var end = this.attributes[attr].to;
						var units = this.attributes[attr].units || "px";
						if(!!this.attributes[attr].from){
							start = this.attributes[attr].from;
						}else{
							start = parseFloat(DOM.getStyle(this.el, attr)) || 0;
							if(units != "px" && document.defaultView){
								DOM.setStyle(this.el, attr, (end || 1) + units);
								start = ((end || 1) / parseFloat(DOM.getStyle(this.el, attr))) * start;
								DOM.setStyle(this.el, attr, start + units);
							}
						}
						this.units[attr] = units;
						this.endAttr[attr] = end;
						this.startAttr[attr] = start;
						break;
				}  		
			}
		},
		
		/**
		 * Set the current value for each attribute for every frame
		 */
		setAttributes: function(){
			for(var attr in this.frame){
				switch(attr){
					case 'opacity':
						DOM.setStyle(this.el, attr, this.frame[attr]);
						break;
					case 'scrollLeft':
					case 'scrollTop':
						var el = (this.el == document.body) ? (document.documentElement || document.body) : this.el;
						el[attr] = this.frame[attr];
						break;
					case 'color':
					case 'borderColor':
					case 'border-color':
					case 'backgroundColor':
					case 'background-color':
						var rgb = 'rgb('+Math.floor(this.frame[attr][0])+','+Math.floor(this.frame[attr][1])+','+Math.floor(this.frame[attr][2])+')';
						DOM.setStyle(this.el, attr, rgb);
						break;
					default:
						DOM.setStyle(this.el, attr, this.frame[attr] + this.units[attr]);
						break;
				}
			}
		}
	};
	
	var DOM = {
		
		/**
		 * Get a dom node
		 * @param {String} id The id of the element to get or the element itself
		 * @return {Element} The element found
		 */
		get: function(id){
		  return (typeof id == "string") ? document.getElementById(id) : id;
		},
		
		/**
		 * Get a style of an element
		 * @param {Element} el The element for the style to be retrieved from
		 * @param {String} prop The property or style that is to be found
		 * @return {Number} The value of the property
		 */
		getStyle: function(el, prop){
			prop = toCamelCase(prop);
			var view = document.defaultView;
			if(view && view.getComputedStyle){
				return view.getComputedStyle(el, "")[prop] || null;
			}else{
				if(prop == 'opacity'){
					var opacity = el.filters('alpha').opacity;
					return isNaN(opacity) ? 1 : (opacity ? opacity / 100 : 0);
				}
				return el.currentStyle[prop] || null;
			}
		},
		
		/**
		 * Set a style for an element
		 * @param {Element} el The element the new value will be applied to
		 * @param {String} prop The property or style that will be set
		 * @param {String} value The value of the property to be set
		 */
		setStyle: function(el, prop, value){
			if(prop == 'opacity'){
				el.style.filter = "alpha(opacity=" + value * 100 + ")";
				el.style.opacity = value;
			}else{
				prop = toCamelCase(prop);
				el.style[prop] = value;
			}
		}
	};
	
	/**
	 * Convert a CSS property to camel case (font-size to fontSize)
	 * @param {String} str The property that requires conversion to camel case
	 * @return {String} The camel cased property string
	 */
	var toCamelCase = (function(){
		var cache = {};
		return function(str){
			if(!cache[str]){
				var parts = str.split('-'), camel = parts[0];
				if(parts.length > 1){
					for(var i=1, len=parts.length; i < len; i++){
							camel += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
					}
				}
				return cache[str] = camel;
			}else{
				return cache[str];
			}
		}
	})();
	
	/**
	 * parse a color to be handled by the animation, supports hex and rgb (#FFFFFF, #FFF, rgb(255, 0, 0))
	 * @param {String} str The string value of an elements color
	 * @return {Array} The rgb values of the color contained in an array
	 */
	var parseColor = (function(){
		var hex6 = (/^#?(\w{2})(\w{2})(\w{2})$/);		
		var hex3 = (/^#?(\w{1})(\w{1})(\w{1})$/);	
		var rgb = (/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/); 
							   
		return function(str){      
			var color = str.match(hex6);
			if(color && color.length == 4){
				return [parseInt(color[1], 16), parseInt(color[2], 16), parseInt(color[3], 16)];
			}
			
			color = str.match(rgb);
			if(color && color.length == 4){
				return [parseInt(color[1], 10), parseInt(color[2], 10), parseInt(color[3], 10)];
			}
		
			color = str.match(hex3);
			if(color && color.length == 4){
				return [parseInt(color[1] + color[1], 16), parseInt(color[2] + color[2], 16), parseInt(color[3] + color[3], 16)];
			}
		}
	})();

$AXIS.FX.transitions.quadIn = function(t, b, c, d){
	return c*(t/=d)*t + b;
};
	
$AXIS.FX.transitions.quadOut = function(t, b, c, d){
	return -c *(t/=d)*(t-2) + b;
};

$AXIS.FX.transitions.quadInOut = function(t, b, c, d){
	if((t/=d/2) < 1) return c/2*t*t + b;
	return -c/2 *((--t)*(t-2) - 1) + b;
};  

$AXIS.FX.transitions.cubicIn = function(t, b, c, d){
	return c*(t/=d)*t*t + b;
}; 

$AXIS.FX.transitions.cubicOut = function(t, b, c, d){
	return c*((t=t/d-1)*t*t + 1) + b;
}; 

$AXIS.FX.transitions.cubicInOut = function(t, b, c, d){
	if((t/=d/2) < 1) return c/2*t*t*t + b;
	return c/2*((t-=2)*t*t + 2) + b;
};

$AXIS.FX.transitions.quartIn = function(t, b, c, d){
	return c*(t/=d)*t*t*t + b;
};

$AXIS.FX.transitions.quartOut = function(t, b, c, d){
	return -c *((t=t/d-1)*t*t*t - 1) + b;
};

$AXIS.FX.transitions.quartInOut = function(t, b, c, d){
	if((t/=d/2) < 1) return c/2*t*t*t*t + b;
	return -c/2 *((t-=2)*t*t*t - 2) + b;
};
	
$AXIS.FX.transitions.quintIn = function(t, b, c, d){
	return c*(t/=d)*t*t*t*t + b;
}; 

$AXIS.FX.transitions.quintOut = function(t, b, c, d){
	return c*((t=t/d-1)*t*t*t*t + 1) + b;
};  

$AXIS.FX.transitions.quintInOut = function(t, b, c, d){
	if((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
	return c/2*((t-=2)*t*t*t*t + 2) + b;
}; 

$AXIS.FX.transitions.expoIn = function(t, b, c, d){
	return(t==0) ? b : c * Math.pow(2, 10 *(t/d - 1)) + b - c * 0.001;
}; 

$AXIS.FX.transitions.expoOut = function(t, b, c, d){
	return(t==d) ? b+c : c * 1.001 *(-Math.pow(2, -10 * t/d) + 1) + b;
}; 

$AXIS.FX.transitions.expoInOut = function(t, b, c, d){
	if(t==0) return b;
	if(t==d) return b+c;
	if((t/=d/2) < 1) return c/2 * Math.pow(2, 10 *(t - 1)) + b - c * 0.0005;
	return c/2 * 1.0005 *(-Math.pow(2, -10 * --t) + 2) + b;
}; 

$AXIS.FX.transitions.circIn = function(t, b, c, d){
	return -c *(Math.sqrt(1 -(t/=d)*t) - 1) + b;
}; 

$AXIS.FX.transitions.circOut = function(t, b, c, d){
	return c * Math.sqrt(1 -(t=t/d-1)*t) + b;
}; 
	
$AXIS.FX.transitions.circInOut = function(t, b, c, d){
	if((t/=d/2) < 1) return -c/2 *(Math.sqrt(1 - t*t) - 1) + b;
	return c/2 *(Math.sqrt(1 -(t-=2)*t) + 1) + b;
}; 

$AXIS.FX.transitions.backIn = function(t, b, c, d, s){
	s = s || 1.70158;
	return c * (t /= d) * t * ((s + 1) * t - s) + b;
};

$AXIS.FX.transitions.backOut = function(t, b, c, d, s){
	s = s || 1.70158;
	return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
};

$AXIS.FX.transitions.backBoth = function(t, b, c, d, s){
	s = s || 1.70158;
	if((t /= d / 2 ) < 1){
		return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
	}
	return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
};

$AXIS.FX.transitions.elasticIn = function (t, b, c, d, a, p){
	if(t == 0){
		return b;
	}
	if((t /= d) == 1){
		return b+c;
	}
	if(!p){
		p=d*.3;
	}      
	if(!a || a < Math.abs(c)){
		a = c; 
		var s = p/4;
	}else{
		var s = p/(2*Math.PI) * Math.asin(c/a);
	}  
	return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p)) + b;
};

$AXIS.FX.transitions.elasticOut = function (t, b, c, d, a, p){
	if(t == 0){
		return b;
	}
	if((t /= d) == 1){
		return b+c;
	}
	if(!p){
		p=d*.3;
	}
	if(!a || a < Math.abs(c)){
		a = c;
		var s = p / 4;
	}else{
		var s = p/(2*Math.PI) * Math.asin(c/a);
	}
	return a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p) + c + b;
};
    
$AXIS.FX.transitions.elasticBoth = function (t, b, c, d, a, p){
	if(t == 0){
		return b;
	}
	if((t /= d/2) == 2 ){
		return b+c;
	}      
	if(!p){
		p = d*(.3*1.5);
	}
	if(!a || a < Math.abs(c)){
		a = c; 
		var s = p/4;
	}else{
		var s = p/(2*Math.PI) * Math.asin(c/a);
	}     
	if(t < 1){
		return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p)) + b;
	}
	return a*Math.pow(2,-10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p)*.5 + c + b;
};

$AXIS.FX.transitions.backIn = function (t, b, c, d, s){
	if(typeof s == 'undefined'){
		s = 1.70158;
	}
	return c*(t/=d)*t*((s+1)*t - s) + b;
};

$AXIS.FX.transitions.backOut = function (t, b, c, d, s){
	if(typeof s == 'undefined'){
		s = 1.70158;
	}
	return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
};
    
$AXIS.FX.transitions.backBoth = function (t, b, c, d, s){
	if(typeof s == 'undefined'){
		s = 1.70158; 
	}
	if((t /= d/2 ) < 1){
		return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
	}
	return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
};

$AXIS.FX.transitions.bounceIn = function (t, b, c, d){
	return c - $AXIS.FX.transitions.bounceOut(d-t, 0, c, d) + b;
};

$AXIS.FX.transitions.bounceOut = function (t, b, c, d){
	if((t/=d) < (1/2.75)){
		return c*(7.5625*t*t) + b;
	}else if(t < (2/2.75)){
		return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
	}else if(t < (2.5/2.75)){
		return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
	}
	return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
};

$AXIS.FX.transitions.bounceBoth = function (t, b, c, d){
	if(t < d/2){
		return $AXIS.FX.transitions.bounceIn(t*2, 0, c, d) * .5 + b;
	}
	return $AXIS.FX.transitions.bounceOut(t*2-d, 0, c, d) * .5 + c*.5 + b;
};
  
})();

/**
 * Will add an effect to any number of selected elements.  NOTE: If no
 * context is given for a callback function, the default is to execute
 * the callback in the context of the element.
 */
AXIS.extend({
  name:       'add', 
  expects:    'Array',
  namespace:  'FX',
  func:       function(params,duration,easing,cback,cbackscope) 
    {
      var eid;
      
      for(var x=0; x < this.length; x++)
        {
          if(this[x].getAttribute('id') === null)
            {
              this[x].setAttribute('id', AXIS.getUniqueId('__FX__'));
            }
          
          this[x].FX = new $AXIS.FX(  this[x].getAttribute('id'),
                                      params || {},
                                      duration,
                                      easing,
                                      cback,
                                      cbackscope || this[x]
                                   );
        }
    }
});

/**
 * Starts animation on elements processed via #addFX.  NOTE: If no
 * index sent, all elements are fired.
 */
AXIS.extend({
  name:       'start', 
  expects:    'Array',
  namespace:  'FX',
  func:       function(idx) 
    {
//      console.log('start: ' + idx + ' - ' + this.length);
      var els = (typeof idx != 'undefined') ? [this[idx] || []] : this;
      for(var i=0; i < els.length; i++)
        {
          els[i].FX && els[i].FX.start();  
        }
    }
});

