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
 * Remove leading/trailing whitespace
 *
 * @type       {String}
 */
AXIS.extend({
  name:       'trim', 
  expects:    'String',
  namespace:  'STRING',
  func:       function() 
    {
      return this.replace(/(^\s+|\s+$)/g, "");
    }
});

/**
 * Remove leading whitespace.
 *
 * @type       {String}
 */
AXIS.extend({
  name:       'ltrim', 
  expects:    'String',
  namespace:  'STRING',
  func:       function() 
    {
      return this.replace(/^\s*/g, "");
    }
});

/**
 * Remove trailing whitespace.
 *
 * @type       {String}
 */
AXIS.extend({
  name:       'rtrim', 
  expects:    'String',
  namespace:  'STRING',
  func:       function() 
    {
      return this.replace( /\s*$/g, "");
    }
});
  
/**
 * Remove all leading/trailing whitespace + collapse extra spaces
 * within the string.
 *
 * @type       {String}
 */
AXIS.extend({
  name:       'collapse', 
  expects:    'String',
  namespace:  'STRING',
  func:       function() 
    {
      return this.replace(/\s/g, "");
    }
});

/**
 * Wraps words at a boundary, with a given boundary character, either
 * wrapping on spaces, or cutting every x number of characters.
 * Based on discussion at: http://snippets.dzone.com/posts/show/869.
 *
 * @param      {String}  wid   The line width.
 * @param      {String}  bnd   The boundary character (default is '\n').
 * @param      {String}  cut   If true, string is simply cut every `wid` characters.
 * @return     {String}        The string with boundaries inserted.
 * @type       {String}
 */
AXIS.extend({
  name:       'wrap', 
  expects:    'String',
  namespace:  'STRING',
  func:       function(wid, bnd, cut) 
    {
      var i, j, s, r = this.split("\n");
      if(wid > 0) 
        {
          for(i in r)
            {
              for
                (s = r[i], r[i] = ""; s.length > wid;
                  j = cut ? wid : (j = s.substr(0, wid).match(/\S*$/)).input.length - j[0].length
                  || wid,
                  r[i] += s.substr(0, j) + ((s = s.substr(j)).length ? bnd : "")
                );
              r[i] += s;
            }
        }
      return r.join("\n");
    }
});  

/**
 * String converted to Array, with each character indexed by its position.
 *
 * @type       {Array}
 */
AXIS.extend({
  name:       'toArray', 
  expects:    'String',
  namespace:  'STRING',
  func:       function() 
    {
      return this.split('');
    }
});
  
/**
 * Substitute substrings from an array into a format String that includes '%1'-type specifiers.
 *
 * @param        {Array}       substrings    An array of strings.
 * @type         {String}
 * @example      "My %0 is %1".format(['name','Harry']);
 * @result       "My name is Harry"
 */
AXIS.extend({
  name:       'format', 
  expects:    'String',
  namespace:  'STRING',
  func:       function(sstrings)
    {
      var subRegExp = /(?:%(\d+))/mg;
      var currPos = 0;
      var r = [];
      
      do
        {
          var match = subRegExp.exec(this);
          if(match && match[1])
            {
              if(match.index > currPos)
                {
                  r.push(this.substring(currPos,match.index));
                }
              r.push(sstrings[parseInt(match[1])]);
              currPos = subRegExp.lastIndex;
            }
        } while(match);
      if(currPos < this.length)
        {
          r.push(this.substring(currPos,this.length));
        }
      return r.join("");
    }
});

/**
 * Reverses string.
 *
 * @type       {String}
 */
AXIS.extend({
  name:       'reverse', 
  expects:    'String',
  namespace:  'STRING',
  func:       function()
    { 
      var a = (this+'').split('');
      a.reverse();
      return a.join('');
    }
});
   
/**
 * Returns String repeated 'count' times, optionally placing 'sep' between each repetition.
 *
 * @param          {Number}      cnt       Number of repetitions.
 * @param          {String}      sep       Separator.
 * @type           {String}
 * @example        "Hello".repeat(5);
 * @result         "HelloHelloHelloHelloHello"
 * @example        "Hello".repeat(5,'#');
 * @result         "Hello#Hello#Hello#Hello#Hello"
 */
AXIS.extend({
  name:       'repeat', 
  expects:    'String',
  namespace:  'STRING',
  func:       function(cnt, sep)
    {
      var t = this; 
      var s = "";
      do 
        {
          s += sep ? t+sep : t;
        } while(--cnt)
      return s;
    }
});
    
/*
 * Pad a string up to a given length. `direction` controls start or end.
 *
 * @param          {Number}      len       The final length of the string.
 * @param          {String}      [ch]      Character used to fill up the string. Default is (' ').
 * @param          {String}      [dir]     Direction to fill (start | end) 0|1 . Default is start(0).
 * @type           {String}
 * @example        "22".pad(4, '#');
 * @result         "##22"
 * @example        "22".pad(4, '#', 1);
 * @result         "22##"
 */
AXIS.extend({
  name:       'pad', 
  expects:    'String',
  namespace:  'STRING',
  func:       function(len, ch, dir)
    {
      var t     = this;
      var ln    = len || t.length;
      d         = dir || 0;
      ch        = ch || ' ';
      while(t.length < ln)
        {
          t = (d == 1) ? t+=ch : ch+t;
        }
      return t;
    }
});

/*
 * Capitalizes the first character of a string.
 *
 * @type          {String}
 */
AXIS.extend({
  name:       'ucfirst', 
  expects:    'String',
  namespace:  'STRING',
  func:       function()
    { 
      return this.charAt(0).toUpperCase() + this.substring(1);
    }
});
    
/*
 * Capitalizes the first character of all words in a string.
 *
 * @type         {String}
 */
AXIS.extend({
  name:       'ucwords', 
  expects:    'String',
  namespace:  'STRING',
  func:       function()
    { 
      var w = this.split(' ');
      for(var i = 0; i < w.length; i++)
        {
          w[i] = w[i].charAt(0).toUpperCase() + w[i].substring(1);
        }
      return w.join(" ");
    }
});
      
/*
 * Returns a string with all HTML tags stripped.
 *
 * @type         {String}
 * @example      "<div id='type'>JavaScript</div>".stripTags();
 * @result       "JavaScript"
 */
AXIS.extend({
  name:       'stripTags', 
  expects:    'String',
  namespace:  'STRING',
  func:       function() 
    {
      return this.replace(/<\/?[^>]+>/gi, '');
    }
});
  
/*
// The <a href="http://en.wikipedia.org/wiki/Levenshtein_distance">Levenshtein distance</a> between two strings is given by
// the minimum number of operations needed to transform one
// string into the other, where an operation is an insertion,
// deletion, or substitution of a single character.
// watch:i,j,s1,s2,s1[i-1],s2[j-1]

// Create a 2dimensional array
function createArray(a,b){
var myarray=new Array(a)
for (var i=0; i <a; i++)
myarray[i]=new Array(b)
return myarray
}

function levDistance(s1, s2){
var lengthS1 = s1.length
var lengthS2 = s2.length
var tab = createArray(lengthS1 + 1,lengthS2 + 1)
var i, j, diff;
for (i=0; i<=lengthS1; i++) tab[i][0] = i;
for (j=0; j<=lengthS2; j++) tab[0][j] = j;
for (i=1; i<=lengthS1; i++) {
for( j = 1; j <= lengthS2; j++ ) {
if ( s1.charAt( i - 1 ) == s2.charAt( j - 1 ) )
diff = 0;
else
diff = 1;
tab[i][j] = Math.min( Math.min(tab[i-1][j] + 1, // insertion
tab[i][j-1] + 1), // deletion
tab[i-1][j-1] + diff); // substitution
}
}
return tab[lengthS1][lengthS2];
}


var str1="kitten"
var str2="sitting"

message("LevDist between '"+str1+"' and '" +str2+ "' is:" +levDistance(str1,str2));

message("<br>")
message('<button onclick="' + "gotoPage('http://myrebus.com/')" +'">Cool Application!</button>')
*/
