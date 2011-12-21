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

$AXIS.Modules.yahoo.Layout.__init = function(ops) 
  {
    var APIP = {};
    
    APIP.options          = ops || {};
    APIP.tabHandlers      = ops.tabHandlers || {};

    APIP._registerLayoutUnit = function(nm,va)
      {
        if(nm && va && (!this[nm]))
          {
            this[nm] = va;
            
            /**
             * Special behaviour for the footer.  It is defined as an empty
             * string ('') in the Unit options, which means that it is allocated
             * space in the DOM.  The other option is to not define it -- however, in
             * that case, YUI destroys the footer element, replacing it with a
             * 'no footer' type element -- which means that we can't change it later.
             * So: on registration we set the height of the footer to 0px, and should
             * the user change it, we remove the height parameter from style.
             *
             * @see APIP#_createLayoutUnitInterface
             */
            va.footer.style.height = '0px';

            this._createLayoutUnitInterface(va);
            
            return va;
          }
        else
          {
            return false;  
          }
      };
    
    /**
     * Adds a public interface to registered layout units.
     *
     * @param   {Object}  A 
     * @see APIP#_registerPanel
     */
    APIP._createLayoutUnitInterface = function(p)
      {
        /**
         * Sets the html in the header of a layout panel. 
         * NOTE: you may also pass simple text, with no formatting.
         *
         *
         * @param   {String}  The new header.  Send blank or null to clear.
         */
        p.setHeader = function(htm)
          {
            var h2 = this.header.getElementsByTagName('h2')[0];
            h2.innerHTML = htm || ''; 
          };
          
        /**
         * Sets the html in the footer of a layout panel. 
         *
         * @param   {String}  ob  - Options object:
         *    {
         *      height:     The height of the footer. NOTE this is an integer, not a
         *                  a CSS declaration (no 'px', '%', etc...)
         *      content:    The content of the footer.  Can be HTML.
         *    }
         */
        p.setFooter = function(ob)
          {
            var ht  = ob.height || 0;
            
            /**
             * @see APIP#_registerLayoutUnit
             */
            this.footer.style.height = ht + 'px';
            this.footer.innerHTML = ob.content || ''; 
          };
          
        /**
         * Insert content into a unit. 
         *
         * @param   {Object}  ob - The option object:
         *  {
         *    content:  The content to insert; can be HTML.
         *    useId:    All new content additions will be wrapped by an 
         *              empty div, which can be targeted by later insertions. If
         *              you want to specify the id to use for this wrapper div,
         *              this is where you would set it.  If the useId refers to 
         *              an existing element, then the call will result in the targetted
         *              element receiving the content insert.
         *  }
         * @returns    An object containing two properties: `el` (the dom reference of element
         *              which received the insert), and `elId` (that element's id)
         * @type       {Object} 
         */
        p.insertContent = function(ob)
          {
            var tid       = ob.useId || false;
            var cnt       = ob.content  || '';

            var t = AXIS.find(tid) || false; 
            if(t)
              {
                t.innerHTML = cnt;  
              }
            else
              {
                var n       = document.createElement('div');
                n.id        = tid || AXIS.getUniqueId('layout_cnt_');
                n.innerHTML = cnt;

                var t = this.body.appendChild(n);
              }

            return {el: t, elId: t.id}
          };
          
        /**
         * Clear the content in a unit. 
         *
         * @param  {Object}  ob  - Options object:
         *    {
         *      targetId    - Either an element id, or a DOM element reference.  If
         *                     not sent, then the entire body of the unit is cleared.
         *      full        - If true then the content *and container* are removed.  If
         *                    false, then the element remains and only contents are
         *                    removed.  Defaults to false.
         *    }
         *
         * @returns                  - The removed content, if any.
         * @type {String}
         */
        p.clearContent = function(ob)
          {
            var f = ob.full || false;
            var e = ob.targetId || false;
            var t = (typeof e === 'object') ? e : AXIS.find(e) || this.body;
            var c = t.innerHTML;
                
            t.innerHTML = '';

            /**
             * Do not remove container if the root body of the unit.
             */
            if(f && (t !== this.body))
              {
                t.parentNode.removeChild(t);
              }
            
            return c;
          };
          
        /**
         * Creates a frame that remains flush with the edges of the layout unit
         * which contains it.  You can also attach a footer.
         *
         * @param    {Object}  inf   - Options object:
         *    {
         *      src:          String. The .src attribute of the iframe -- what gets loaded into it.
         *      id:           [String]. An id for the iframe. Default is to create one randomly.
         *      namespace:    [String]. The namespace that will have iframe refs set
         *      footer:       [String]. The footer content.  HTML is allowed.
         *      footerHeight: [Number]. The height of the footer.
         *    }
         */
        p.createSmartFrame = function(inf)
          {
            var uid           = inf.id || AXIS.getUniqueId('lay_sf_');
            var fHeight       = inf.footerHeight || 0;
            var fCont         = inf.footer || '';
            var ns            = AXIS.createNamespace(inf.namespace || null);
            var ld            = inf.onload || AXIS.F;
            var tt            = this;
            
            /**
             * Had a lot of problems with using document.createElement insertion.  
             * Not sure why. This is at least short, and it is nice that it works.
             */
            var fr = '<iframe id="' + uid + '" name="' + uid + '" style="width:100%;" frameborder="no" border="0" src="' + inf.src + '"></iframe>';
            
            this.insertContent({
              content: fr
            })

            var ff      = AXIS.find(uid);

            /**
             * The resize handler. See below
             */
            var rHandler = function(ev)
              {
                var ht = tt.get('height') - fHeight + 'px';
                
                ff.style.width  = tt.get('width') + 'px';
                ff.style.height = ht;
              };
            
            /**
             * We are interested in events that cause the size of the containing Unit to change,
             * at which point the smart frame needs to be resized.       
             */
            this.on('resize',rHandler);

            /**
             * The user can pass a namespace.  The point of this feature is to allow
             * the developer to get back references to this smartframe.  A typical scenario
             * would be creating some sort of application in the frame, with the footer
             * containing control buttons.  The developer can create a known namespace 
             * that connects the frame to global functionality (ie, the footer), and can
             * code his footer code to assume the existence of a namespace with a known
             * naming scheme.  The references created are to the frame itself and the
             * document it contains. 
             */
            ns.frameWindow    = ff.contentWindow;
            ns.frameDocument  = null; 

            
            /**
             * Once the frame has loaded its content, set the footer,
             * store frame document ref, run a resize, run the onload function,
             * passing it the frame references.
             */
            ff.onload = ff.onreadystatechange = function()
        	    {
        			  if(!this.__loaded__ && 
        			    (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) 
        					{
        					  this.__loaded__ = true;

                    tt.setFooter({
                      height:   fHeight,
                      content:  fCont
                    });  
                    
                    ns.frameDocument = ff.document || ff.contentDocument || ff.contentWindow.document;

                    rHandler();
        						ld(ns);
        					}
        			};
          };
          
        /**
         * Used to create a tabView within a Layout.  
         *
         * @param   {Object}  tdefs - An object containing the domElement to 
         *                            attach tabView to, and any (optional)tabs to define:
         *                            {
         *                              DOMElement: 'id_of_element_to_contain_tabs',
         *                              tabs:       [
         *                                            {label: 'FirstTabLabel'},
         *                                            {
         *                                              label:  'SecondLabel'
         *                                              active: true
         *                                            }
         *                                          ]
         *                            }
         *
         * @return  - An object containing the index of the new tab, and the tab unit object.
         * @type  {Object}
         *
         * Documentation for YAHOO.widget.TabView:
         * @href http://developer.yahoo.com/yui/docs/YAHOO.widget.TabView.html
         * Documentation for YAHOO.widget.Tab:
         * @href http://developer.yahoo.com/yui/docs/YAHOO.widget.Tab.html
         *
         * Once executed, you can then call this interface to add/modify tabs via:
         * LayoutReference.tabs['id_of_element_containing_tabs'].add({label:'NewTab'});
         */
        p.createTabsInterface = function(tdefs)
          { 
            var domEl                 = tdefs.DOMElement;
            var addTabs               = tdefs.tabs || []; 
            this.tabs                 = new YAHOO.widget.TabView(domEl);
            this.tabs._tabs          = [];
    
            /**
             * @href http://developer.yahoo.com/yui/docs/YAHOO.widget.TabView.html#method_addTab
             */ 
            this.tabs.add = function(p)
              {
                var props             = {};
                props.label           = p.label || 'NA';
                props.active          = p.active || false;
                props.contentVisible  = false;

                var t = new YAHOO.widget.Tab(props);
                
                /**
                 * Add any tab handlers, which should have been passed as the `options`
                 * object of the original Modules.load call.
                 *
                 * {@link AXIS#Modules#load}
                 */
                var th = APIP.tabHandlers;
                for(var h in th)
                  {
                    /**
                     * @href http://developer.yahoo.com/yui/docs/YAHOO.util.Element.html#method_on
                     */
                    t.on(h,th[h]);
                  }  
                  
                this._tabs.push(t);
                var len = this._tabs.length -1;
                
                this.addTab(t,len);
                
                return {unit: t, idx: len};
              };
              
            /**
             * Remove a tab based on that tab's index.
             *
             * @param {Number}  idx - The index of the tab.
             * @href http://developer.yahoo.com/yui/docs/YAHOO.widget.TabView.html#method_removeTab
             */ 
            this.tabs.removeByIndex = function(idx)
              {
                if(idx && this._tabs[idx])
                  { 
                    this.removeTab(this._tabs[idx]);
                    this._tabs.splice(idx,1); 
                  }
              };
              
            /**
             * Remove a tab based on a tab unit object.
             *
             * @param {Object}  tb - The tab unit.
             * @href http://developer.yahoo.com/yui/docs/YAHOO.widget.TabView.html#method_removeTab
             */ 
            this.tabs.remove = function(tb)
              {
                for(var x=0; x < this._tabs.length; x++)
                  {
                    if(this._tabs[x] === tb)
                      {
                        this._tabs.splice(x,1);
                        this.removeTab(tb);
                      }  
                  }
              };
              
            /**
             * Returns all tabs in this tabview collection
             *
             * @type    {Array}
             */
            this.tabs.getCollection = function()
              {
                return this._tabs;  
              };
            
            /**
             * Now add any tabs passed in call.
             */
            for(var x=0; x < addTabs.length; x++)
              {
                this.tabs.add(addTabs[x]);
              } 
          };
      };
      
    /**
     * This is a collection of layouts using the YUI Layout manager.
     * Default is simple 2 panel with tabs layout.
     *
     * NOTE: The panel elements you are defining here are not be relied upon.
     * For example, the definition <div id="layout_panel_edit"></div> is not
     * an element that is guaranteed to remain, and should *never* be referenced.
     * You are simply creating a blueprint, and once `extruded` via the Layout,
     * Reference the body of this panel using the API.  
     *
     * @see  APIP#registerLayoutUnit
     * @href http://developer.yahoo.com/yui/docs/YAHOO.widget.Layout.html
     * @href http://developer.yahoo.com/yui/docs/YAHOO.widget.LayoutUnit.html
     */
    APIP.layouts = [];

    APIP.layouts['main'] = function(lob)
      {
        var outerL;
                    
        /**
         * If you choose to write your own HTML, you will need to ensure that
         * the id's and so forth identified here are replicated, or the instantiation
         * of this layout object will not work.
         */
        if(lob === false)
          {
            var b = document.createElement('div');
            b.id  = 'top-level-yui-reset';
            
            b.innerHTML = '\
              <div id="layout_panel_bar">\
                <div id="layout_panel_tabs" class="yui-navset"></div>\
              </div>\
              <div id="layout_panel_browse"></div>\
              <div id="layout_panel_view"></div>';
            document.body.appendChild(b); 
          }
          
      	outerL = new YAHOO.widget.Layout({
      	units: 
      	  [
      	    { 
      	      position: 'top', 
      	      height:   '52px', 
      	      gutter:   '0px', 
      	      footer:   '',
      	      body:     'layout_panel_bar',
      	      useShim:  true
      	    }, 
      	    { 
      	      position: 'left', 
      	      width:    300, 
      	      resize:   true, 
      	      body:     'layout_panel_browse', 
      	      gutter:   '2px', 
      	      collapse: true, 
      	      scroll:   true,
      	      header:   'Browse',
      	      footer:   '',
      	      animate:  false,
      	      useShim:  true
      	    },
      	    { 
      	      position: 'center', 
      	      resize:   true, 
      	      gutter:   '0px', 
      	      collapse: true, 
      	      scroll:   false, 
      	      body:     'layout_panel_view', 
        	    header:   false,
        	    footer:   '',
      	      animate:  false,
      	      useShim:  true
      	    }
      	  ]
      	});
      
        outerL.on('render', function() {
     	  
        	APIP._registerLayoutUnit('tabPanel',outerL.getUnitByPosition('top'));
        	APIP._registerLayoutUnit('browse',outerL.getUnitByPosition('left'));
        	APIP._registerLayoutUnit('view',outerL.getUnitByPosition('center'));
        });
      	  
      	outerL.render();
      };
    
    /**
     * This is the API for all layouts, the instance of which is returned
     * when the module yahoo.Layout is called. {@link AXIS#_modules}
     *  
     * @constructor
     */     
    var API = function()
      {                
        /**
         * Creates the layout indexed by sent argument.
         *
         * @param   {String}  t       - A layout, indexed in APIP.layouts
         * @param   {Object}  [lob]   - An HTML element, to use as default layout map for layout.
         *
         * @href http://developer.yahoo.com/yui/docs/YAHOO.widget.Layout.html
         */
        this.createLayout = function(t,lob)
          {
            var typ = t || 'default';
            var str = typ.toLowerCase();

            if(this.layouts[str])
              {
                /**
                 * Ensure that layout css is defined for body.
                 */
                var d = document.getElementsByTagName('body')[0];
                d.className += " yui-skin-sam";
                d.scroll = 'no';
                
                return this.layouts[str](lob || false);  
              }  
          };
      };

    API.prototype = APIP;
    return new API;
  }
