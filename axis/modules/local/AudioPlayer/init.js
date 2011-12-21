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

/* Copyright (c) 2008 Martin Laine

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

  @see  http://wpaudioplayer.com/license

 */
 
/**
 * Inline audio (MP3 only) player.
 *
 * @see  http://wpaudioplayer.com/standalone
 */

 
$AXIS.Modules.local.AudioPlayer.__init = function(ob)
  { 
    var path = AXIS.PATH('audio-player.js');    

    AudioPlayer.setup(path + "player.swf", ob);
    
    var _ = function()
      {
        this.embed = function(ob)
          {
            if(ob.DOMId && ob.soundFile)
              {
                /**
                 * User is expected to send a DOM Element id attribute value which identifies
                 * the DOM element the audio player is embedded into.
                 */
                if(     (ob.DOMId.constructor === String)
                    &&  (document.getElementById(ob.DOMId)))
                  {
                    AudioPlayer.embed(ob.DOMId, ob);
                    return true;
                  }
                return false;
              }
          }  
      }

    return new _;
  }
