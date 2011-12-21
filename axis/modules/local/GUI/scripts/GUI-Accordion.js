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

$AXIS.Modules.local.GUI.Accordion.__init = function(op)
  {  
    var opts = op || {};
    /*
    var parentAccordion=new TINY.accordion.slider("parentAccordion");
parentAccordion.init("acc","h3",0,0);

var nestedAccordion=new TINY.accordion.slider("nestedAccordion");
nestedAccordion.init("nested","h3",1,-1,"acc-selected");

You must create a new accordion object before initialization. The parameter taken by accordion.slider is the variable name used for the object. The object.init function takes 5 parameters: the id of the accordion “ul”, the header element tag, whether the panels should be expandable independently (optional), the index of the initially expanded section (optional) and the class for the active header (optional).

*/
        
    var T$$ = function(e,p){return p.getElementsByTagName(e)};
    
    var ins = opts.names ? opts.names : [];
    ins     = AXIS.isArray(ins) ? ins : [ins];
    
    var tmp;
    
  	function accordion(n)
  	  {
  	    this.n=n; 
  	    this.a=[];  	    
  	  };
  	  
  	accordion.prototype.init=function(t,e,m,o,k){
  		var a=AXIS.find(t), i=s=0, n=a.childNodes, l=n.length; this.s=k||0; this.m=m||0;
  		for(i;i<l;i++){
  			var v=n[i];
  			if(v.nodeType!=3){
  				this.a[s]={}; this.a[s].h=h=T$$(e,v)[0]; this.a[s].c=c=T$$('div',v)[0]; h.onclick=new Function(this.n+'.pr(0,'+s+')');
  				if(o==s){h.className=this.s; c.style.height='auto'; c.d=1}else{c.style.height=0; c.d=-1} s++
  			}
  		}
  		this.l=s
  	};
  	accordion.prototype.pr=function(f,d){
  		for(var i=0;i<this.l;i++){
  			var h=this.a[i].h, c=this.a[i].c, k=c.style.height; k=k=='auto'?1:parseInt(k); clearInterval(c.t);
  			if((k!=1&&c.d==-1)&&(f==1||i==d)){
  				c.style.height=''; c.m=c.offsetHeight; c.style.height=k+'px'; c.d=1; h.className=this.s; su(c,1)
  			}else if(k>0&&(f==-1||this.m||i==d)){
  				c.d=-1; h.className=''; su(c,-1)
  			}
  		}
  	};
  	function su(c){c.t=setInterval(function(){sl(c)},20)};
  	function sl(c){
  		var h=c.offsetHeight, d=c.d==1?c.m-h:h; c.style.height=h+(Math.ceil(d/5)*c.d)+'px';
  		c.style.opacity=h/c.m; c.style.filter='alpha(opacity='+h*100/c.m+')';
  		if((c.d==1&&h>=c.m)||(c.d!=1&&h==1)){if(c.d==1){c.style.height='auto'} clearInterval(c.t)}
  	};
  	
  	/**
  	 * Create accordion references
  	 */
  	for(var i=0; i < ins.length; i++)
  	  { 	  	    
  	    $AXIS.Modules.local.GUI.Accordion[ins[i]] = new accordion('$AXIS.Modules.local.GUI.Accordion.' + ins[i]);
  	  }
  	    
  	return $AXIS.Modules.local.GUI.Accordion;
  };
