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
 * Eliminate elements which resolve false against passed comparison function
 *
 * @param    {Function}    func    The comparison function.
 * @type     {Array}
 */
AXIS.extend({
  name:       'filter', 
  expects:    'Array',
  func:       function(func) 
    {
      var t = [];
      var i = this.length;
      while(i--) 
        {
          if(func(this[i]) === true) 
            {
              t.push(this[i]);
            }
        }
        
      return t;
    }
});

/**
 * Apply a function to each element of an array
 *
 * @param    {Function}    func    The function.
 * @type     {Array}
 */
AXIS.extend({
  name:       'foreach', 
  expects:    'Array',
  func:       function(func) 
    {
      for(var i=0; i < this.length; i++) 
        {
          this[i] = func(this[i]);
        }
      
      return this;
    }
});

/**
 * Shuffle an array using Fisher-Yates algorithm.  Sorts only zero level of array,
 * unless deep parameter is specified.
 *
 * @param    {Boolean}   deep    Whether to do deep shuffling.  If true, will shuffle
 *                                arrays within the array.                     
 *
 * @type       {Array}
 */
AXIS.extend({
  name:       'shuffle', 
  expects:    'Array',
  func:       function(deep) 
    {
      var i = this.length;
      if(i > 0) 
        {
          while(--i) 
            {
              var j = Math.floor(Math.random() * (i + 1));
              if(deep && (this[i].constructor === Array)) 
                {
                  this[i] = AXIS.scope(this[i])
                                .shuffle(deep)
                                .$; 
                }
                      
              var ti = this[i];
              var tj = this[j];
              this[i] = tj;
              this[j] = ti;
            }
        }
      
      return this;
    }
});
    
/**
 * Checks for STRICT equality between two arrays
 *
 * @param      {Array}    a   The array being matched against.
 * @type       {Boolean}
 */
AXIS.extend({
  name:       'equalTo', 
  expects:    'Array',
  func:       function(a) 
    {
      var tw = this.length;
         
      if(tw != (a.length)) 
        {
          return false;
        }
           
      while(tw--) 
        { 
          if(this[tw] !== a[tw]) 
            { 
              return false; 
            } 
        } 
      
      return true;    
    }
});

/**
 * Returns last element of array
 *
 * @type     {Mixed}
 */
AXIS.extend({
  name:       'last', 
  expects:    'Array',
  func:       function() 
    {
      return this[this.length - 1];
    }
});
    
/**
 * Determines if a given value exists in an array.  Supports  
 * the search of multidimensional arrays. Supports partial string
 * matches (finding 'a' in 'cat'), or strict equivalency (s === val).
 * Equivalency is default; use `p` argument (true) for partial search. 
 *
 * @param       {Mixed}     s       Search value.
 * @param       {Boolean}   part    Do partial search. NOTE: only for String(s).
 * @type        {Boolean}
 */
AXIS.extend({
  name:       'contains', 
  expects:    'Array',
  func:       function(s, part) 
    {
      var p     = part || false;
      var i     = this.length;
    
      while(i--) 
        {
          if(AXIS.isArray(this[i])) 
            {
              if(AXIS
                  .scope(this[i])
                    .contains(s, p)
                    .$) 
                { 
                  return true; 
                }
            }
          else 
            {
              if(p) 
                {
                  if(this[i].indexOf(s) != -1) 
                    {
                      return true;
                    }
                }
              else if(this[i] === s) 
                {
                  return true;
                }
            }
        }
      
      return false;
    }
});
    
/**
 * Return a random element, optionally up to or from range.
 *
 * @param    {Number}      rng   A range value.  
 *                                Positive value (v) == range 0 -> v;
 *                                Negative value (v) == -v -> length;
 * @type     {Mixed}
 * @example  var kids = [ 'Tom', 'Dick', 'Harry', [ 'Karen', 'Laura' ], 'Mary', 7, 8, 9 ];
 *            alert (   AXIS
 *                        .scope(kids)
 *                          .random(3)
 *                        .$
 *                  );
 *                          .random(3)     == returns a boy's name
 *                          .random(-5)    == returns a number
 */ 
AXIS.extend({
  name:       'random', 
  expects:    'Array',
  func:       function(rng) 
    {
      var i     = 0;
      var len   = this.length;
      var r     = rng || false;
      if(r === false) 
        { 
          r = this.length; 
        }
      if(r > 0) 
        { 
          r = r % len; 
        }
      else 
        { 
          i = r; 
          r = len + r % len; 
        }
      
      return this[Math.floor(r * Math.random() - i)];
    }
});
         
/**
 * General utility function to convert the contents of a
 * (single dimension) object into a string.
 *
 * @type       {String}
 */
AXIS.extend({
  name:       'stringify', 
  expects:    'Array',
  func:       function(d,i) 
    {
      var t     = '';
      var ind   = i || '    ';
      for(var p in this) 
        {
          if(d && (typeof this[p] == 'object')) 
            {
              var ss =  AXIS.scope(this[p])
                            .stringify(d,ind + ind)  
                            .$    
                            
              /**
               * We are currently at `p`.  `p` is some sort of object, so it has
               * been stringified (in `ss`).  The loop at this level will still print
               * out the value at `p` (below).  So do special appending and continue.
               */
              t += ind + p + ': > ' + '\n' + ss;
              continue;
            }
                
          t += ind + p + ': ' + this[p] + '\n';
        }
      
      return t;
    }
}); 
