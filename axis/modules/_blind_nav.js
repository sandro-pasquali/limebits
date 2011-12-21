        
        /**
         * FX library, always on
         */
        AXIS.Modules.load({
          provider:   'local',
          module:     'FX', 
          onload:     function(ob)
            {  
              /**
               * When loaded, build the drop down menu functionality
               */
              var arrow = AXIS.Element.create('div', {
                'class':          'TOC_menu_arrow_down'
              });
              
              var dd = AXIS.Element.create('div', {
                id:       'TOC_slide_menu',
                append:   [arrow]
              });
              
              var tail_lc = AXIS.Element.create('div', {
                id:   'TOC_tail_left_corner'
              });
              
              var tail_rc = AXIS.Element.create('div', {
                id:   'TOC_tail_right_corner'
              });
              
              var tail_ct = AXIS.Element.create('div', {
                id:   'TOC_tail_center'
              });
              
              var tail = AXIS.Element.create('div', {
                id:       'TOC_tail',
                append:   [
                            tail_lc,
                            tail_rc,
                            tail_ct
                          ]
              });
              
              
              /**
               * Add menu control to bottom of TOC bar
               */
              bb.parentNode.insertBefore(dd, bb.nextSibling);
              
              /**
               * Add menu control to bottom of TOC bar
               */
              dd.parentNode.insertBefore(tail, dd.nextSibling);
              
              /**
               * Adds slide up/down functionality
               */
              AXIS.attachEvent('click',function(e) 
                {
                  var t = this;
                  
                  if(!!t.clickstate === false)
                    {
                      $AXIS.Modules.local.FX.animate('TOC_slide_menu', {
                  	    height: {to: 200}
                      },false,function() {
                        t.clickstate = 1;
                        t.className = 'TOC_menu_arrow_up';
                      },t);
                    }
                  else
                    {
                      $AXIS.Modules.local.FX.animate('TOC_slide_menu', {
                  	    height: {to: 8}
                      },false,function() {
                        t.clickstate = 0;
                        t.className = 'TOC_menu_arrow_down';
                      },t);
                    }
                }, arrow);
              
              
              /**
               * Now add the menu
               */
              
            }
        }); 