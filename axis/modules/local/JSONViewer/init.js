/**
 * @julien
 * modified the code from Benjamin Hollis
 */

/**
 * @author Benjamin Hollis
 * 
 * This component provides a stream converter that can translate from JSON to HTML.
 * It is compatible with Firefox 3 and up, since it uses many components that are new
 * to Firefox 3.
 */

$AXIS.Modules.local.JSONViewer.__init = function(opts) {

  var JSONFormatter = function() {};
  
  JSONFormatter.prototype = {
    htmlEncode: function (t) {
      return t != null ? t.toString().replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : '';
    },
    
    decorateWithSpan: function (value, className) {
      return '<span class="' + className + '">' + this.htmlEncode(value) + '</span>';
    },
    
    // Convert a basic JSON datatype (number, string, boolean, null, object, array) into an HTML fragment.
    valueToHTML: function(value) {
      var valueType = typeof value;
      
      var output = "";
      if (value == null) {
        output += this.decorateWithSpan('null', 'null');
      }
      else if (value && value.constructor == Array) {
        output += this.arrayToHTML(value);
      }
      else if (valueType == 'object') {
        output += this.objectToHTML(value);
      } 
      else if (valueType == 'number') {
        output += this.decorateWithSpan(value, 'num');
      }
      else if (valueType == 'string') {
        if (/^(http|https):\/\/[^\s]+$/.test(value)) {
          output += '<a href="' + value + '">' + this.htmlEncode(value) + '</a>';
        } else {
          output += this.decorateWithSpan('"' + value + '"', 'string');
        }
      }
      else if (valueType == 'boolean') {
        output += this.decorateWithSpan(value, 'bool');
      }
      
      return output;
    },
    
    // Convert an array into an HTML fragment
    arrayToHTML: function(json) {
      var output = '[<ul class="array collapsible">';
      var hasContents = false;
      for ( var prop in json ) {
        hasContents = true;
        output += '<li>';
        output += this.valueToHTML(json[prop]);
        output += '</li>';
      }
      output += '</ul>]';
      
      if ( ! hasContents ) {
        output = "[ ]";
      }
      
      return output;
    },
    
    // Convert a JSON object to an HTML fragment
    objectToHTML: function(json) {
      var output = '{<ul class="obj collapsible">';
      var hasContents = false;
      for ( var prop in json ) {
        hasContents = true;
        output += '<li>';
        output += '<span class="prop">' + this.htmlEncode(prop) + '</span>: '
        output += this.valueToHTML(json[prop]);
        output += '</li>';
      }
      output += '</ul>}';
      
      if ( ! hasContents ) {
        output = "{ }";
      }
      
      return output;
    },
    
    // Convert a whole JSON object into a formatted HTML document.
    jsonToHTML: function(json) {
      var output = '<div id="json">';
      output += this.valueToHTML(json);
      output += '</div>';
      return output; // J.F. was: this.toHTML(output, uri);
    },
      
    /*
    // Wrap the HTML fragment in a full document. Used by jsonToHTML and errorPage.
    toHTML: function(content, title) {
      return '<doctype html>' + 
        '<html><head><title>' + title + '</title>' +
        '<link rel="stylesheet" type="text/css" href="chrome://jsonview/content/default.css">' + 
        '<script type="text/javascript" src="chrome://jsonview/content/default.js"></script>' + 
        '</head><body>' +
        content + 
        '</body></html>';
    }
    */
  };
  
  // This used to use jQuery, but was rewritten in plan DOM for speed and to get rid of the jQuery dependency.
  JSONFormatter.prototype.applyJSONView = function() {
    // Click handler for collapsing and expanding objects and arrays
    function collapse(evt) {
      var collapser = evt.target;
     
      var target = AXIS.DOM.getElementsByClassName('collapsible', false, collapser.parentNode);
      
      if ( ! target.length ) {
        return;
      }
      
      target = target[0];
  
      if ( target.style.display == 'none' ) {
        var ellipsis = AXIS.DOM.getElementsByClassName('ellipsis', false, target.parentNode)[0];
        target.parentNode.removeChild(ellipsis);
        target.style.display = '';
      } else {
        target.style.display = 'none';
        
        var ellipsis = document.createElement('span');
        ellipsis.className = 'ellipsis';
        ellipsis.innerHTML = ' &hellip; ';
        target.parentNode.insertBefore(ellipsis, target);
      }
      
      collapser.innerHTML = ( collapser.innerHTML == '-' ) ? '+' : '-';
    }
    
    function addCollapser(item) {
      // This mainly filters out the root object (which shouldn't be collapsible)
      if ( item.nodeName != 'LI' ) {
        return;
      }
      
      var collapser = document.createElement('div');
      collapser.className = 'collapser';
      collapser.innerHTML = '-';
      
      AXIS.attachEvent('click', collapse, collapser);
      
      item.insertBefore(collapser, item.firstChild);
    }
    
    var items = AXIS.DOM.getElementsByClassName('collapsible');
    for( var i = 0; i < items.length; i++) {
      addCollapser(items[i].parentNode);
    }
  };
  
  JSONFormatter.prototype.createView = function(json,targ)
    {
      var tg  = AXIS.isObject(targ) ? targ : AXIS.find(targ);
      tg.setAttribute('class', 'JSONViewerContainer');
      tg.innerHTML = this.jsonToHTML(json); 
      this.applyJSONView();
    };

  return new JSONFormatter;
};