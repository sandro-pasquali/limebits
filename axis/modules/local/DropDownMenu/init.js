// Drop Down Menus
$AXIS.Modules.local.DropDownMenu.__init = function(ops) 
  {    
    ops = ops || {};
    
    var menu = function() 
      {
        var t=15,z=50,s=6,a;
        function dd(n) 
          {
            this.n=n; 
            this.h=[]; 
            this.c=[];
          }
          
        dd.prototype.init = function(p,c) 
          {
            a=c; //Old code: var w=document.getElementById(p), s=w.getElementsByTagName('ul'), l=s.length, i=0;
            //new Code I pass on already extended object as the holder for the menus
            var w=p, s=w.getElementsByTagName('ul'), l=s.length, i=0;
            var ms = '$AXIS.Modules.local.DropDownMenu.';
            for(i;i<l;i++) 
              {
                var h=s[i].parentNode; 
                this.h[i]=h; 
                this.c[i]=s[i];
                h.onmouseover = new Function(ms + this.n+'.st('+i+',true)');
                h.onmouseout  = new Function(ms + this.n+'.st('+i+')');
              }
          };
          
        dd.prototype.st = function(x,f) 
          {
            var c=this.c[x], h=this.h[x], p=h.getElementsByTagName('a')[0];
            clearInterval(c.t); 
            c.style.overflow='hidden';
            if(f) 
              {
                p.className+=' '+a;
                if(!c.mh)
                  {
                    c.style.display='block'; 
                    c.style.height=''; 
                    c.mh=c.offsetHeight; 
                    c.style.height=0;
                  }
                if(c.mh==c.offsetHeight)
                  {
                    c.style.overflow='visible';
                  }
                else
                  {
                    c.style.zIndex=z; 
                    z++; 
                    c.t=setInterval(function(){sl(c,1)},t);
                  }
              }
            else
              {
                p.className=p.className.replace(a,'');
                c.t=setInterval(function() {
                  sl(c,-1)
                },t);
              }
          };
          
        function sl(c,f)
          {
            var h=c.offsetHeight;
            if((h<=0&&f!=1)||(h>=c.mh&&f==1))
              {
                if(f==1)
                  {
                    c.style.filter=''; 
                    c.style.opacity=1; 
                    c.style.overflow='visible';
                  }
                clearInterval(c.t); 
                return;
              }
              
            var d=(f==1)?Math.ceil((c.mh-h)/s):Math.ceil(h/s), o=h/c.mh;
            c.style.opacity=o; c.style.filter='alpha(opacity='+(o*100)+')';
            c.style.height=h+(d*f)+'px'
          }
        return{dd:dd}
      }();
      
    menu.start = function()
      {
        var ms    = this._Menus;
        var box   = document.getElementsByTagName('ul');

            for(i = 0; i < box.length; i++) 
              {
                if(box[i].getAttribute('class') === 'module-dropdownmenu')
                  {
                    var id = box[i];
                    ms[i] = new menu.dd('_Menus[' + i + ']');
                    ms[i].init(id,"menuhover");
                  }
              }

      };
      
    menu._Menus = [];  
      
    /**
     * The user can request to override the automagical rendering of menus on the page.
     * If so, user can call #start method at any time after loading.
     */
    if(!!ops.manualLoad === false)
      {
        menu.start();  
      }
      
    return menu;
  };
  
  

