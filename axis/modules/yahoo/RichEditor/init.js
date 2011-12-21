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

$AXIS.Modules.yahoo.RichEditor.__init = function(ops) 
  {
    var editor =  new YAHOO.widget.Editor(ops.domId, { 
      height:         ops.height || '300px', 
      width:          ops.width || '522px', 
      //Turns on the bar at the bottom 
      dompath:        (typeof ops.dompath === 'undefined') ? true : !!ops.dompath, 
      //Animates the opening, closing and moving of Editor windows 
      animate:        (typeof ops.animage === 'undefined') ? true : !!ops.animate 
    }); 

    editor.render(); 
  }