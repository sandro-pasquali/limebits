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

/**
 * @fileoverview
 * @href http://code.google.com/p/syntaxhighlighter/
 * @href http://code.google.com/p/syntaxhighlighter/wiki/Configuration
 */
$AXIS.Modules.local.SyntaxHighlighter.__init = function(ops) 
  {  
    var b = ops || {};
      
    return {
      currentTheme:   '',
      
      /**
       * Default brushes.  First paint will load these.
       */
      brushes:        {
                        'JScript':  1,
                        'Xml':      1
                      },
      
      /**
       * Does syntax highlighting on any relevant code blocks.
       *  
       * @param    {Mixed}   br    A string, or array of strings, containing brush names.
       */
      paint: function(br) 
        {
          /**
           * See below, where brushes are loaded and painting occurs.
           */
          var brushes = (br) 
                          ? AXIS.isArray(br) 
                              ? br 
                              : [br]
                          : [];
          var bb;
          var tb = this.brushes;
          var bArr = [];
          
          /**
           * Attach to namespace for this module.
           * @see #AXIS#load
           */
          var sh    = SyntaxHighlighter;
          var shs   = sh.config.strings;
          var shd   = sh.defaults; 
          /**
           * Turns on copy to clipboard functionality
           */
          sh.config.clipboardSwf = AXIS.PATH() + 'modules/local/SyntaxHighlighter/scripts/clipboard.swf';
          
          /**
           * The complete list of configurable messages.
           */
          shs.viewSource = "view source";
          shs.copyToClipboard = "copy to clipboard";
          shs.expandSource = "+ expand source";
          shs.copyToClipboardConfirmation = "The code is in your clipboard now";
          shs.print =	"print";
          shs.help = "?";
          shs.alert = "Module SyntaxHighlighter >\n\n";
          shs.noBrush = "Can't find syntax brush for: ";
          shs.brushNotHtmlScript = "Brush wasn't made for html-script option: ";
          
          /**
           * Whether or not code listing on the page will be collapsed by default.
           * Defaults to false.
           */
          shd.collapse = (b.collapse === undefined) ? false : !!b.collapse;
          
          /**
           * Whether links in the source are clickable.
           * Defaults to true.
           */
          shd['auto-links'] = (b.autoLinks === undefined) ? true : !!b.autoLinks;
          
          /**
           * Allows the assignment of an additional css class definition to codeblocks.
           */
          shd['class-name'] = (b.className === undefined) ? false : b.className;
          
          /**
           * Allows the mixture of html and script.
           * Defaults to true.
           *
           * @see http://alexgorbatchev.com/wiki/SyntaxHighlighter:Demo:html-script
           */
          shd['html-script'] = (b.htmlScript === undefined) ? true : !!b.htmlScript;
          
          /**
           * Sets the tab width in code.
           * Defaults to 2
           */
          shd['tab-size'] = (b.tabSize === undefined) ? 2 : b.tabSize;
          
          /**
           * Whether to wrap lines.
           * Defaults to true.
           */
          shd['wrap-lines'] = (b.wrapLines === undefined) ? true : !!b.wrapLines;
          
          /**
           * Whether to show toolbar.
           * Defaults to true.
           */
          shd['toolbar'] = (b.toolbar === undefined) ? true : !!b.toolbar;
          
          /**
           * Whether to show line numbers.  Note changed from the system `gutter`
           * to the more direct `lineNumbers`.
           * Defaults to true.
           */
          shd['gutter'] = (b.lineNumbers === undefined) ? true : !!b.lineNumbers;
          
          /**
           * `Light` mode (no toolbars or line numbers).  Note that the parameter
           * was changed from the system `light` to the (perhaps) more meaningful `simple`
           * Defaults to false.
           */
          shd['light'] = (b.simple === undefined) ? false : !!b.simple;
          
          this.loadTheme(b.theme);
           
          /**
           * Manage brushes, and paint.
           * See var declarations at top of #paint
           */
          for(var w=0; w < brushes.length; w++)
            {
              bb = brushes[w];
              
              /**
               * `2` indicates that a brush has already been loaded
               */
              if(tb[bb] && tb[bb] === 2)
                {
                  continue;  
                }
              /**
               * `1` flags for loading
               */
              tb[bb] = 1;
            }
          /**
           * Go through #brushes and load all 1s, flagging then as 2s.
           */
          for(var k in tb)
            {
              if(tb[k] === 1)
                {
                  bArr.push(AXIS.PATH() + 'modules/local/SyntaxHighlighter/scripts/shBrush' + k + '.js');
                }
              tb[k] = 2;
            }
            
          AXIS.includeScriptGroup(bArr, function() {
             sh.all();
          });
          
        },
      
      loadTheme: function(t)
        {
          /**
           * Load new theme if requested.  Note that we are appending whatever this
           * value is to the file prefix `shTheme`.
           * Visit /SyntaxHighlighter/styles/ directory for available themes.
           */
          if(!!t && t !== this.currentTheme) 
            {
              AXIS.includeCSS({
                href: AXIS.PATH() + 'modules/local/SyntaxHighlighter/styles/shTheme' + b.theme + '.css'
              });
              
              this.currentTheme = b.theme;
            }
        }
    }
  }