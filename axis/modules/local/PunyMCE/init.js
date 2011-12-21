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

$AXIS.Modules.local.PunyMCE.__init = function(bOps)
  {
    var ret = 
      {
        create: function(op) 
          {
            return new punymce.Editor({
            	id :        op.id,
            	toolbar:    op.toolbar || 'bold,italic,underline,strike,increasefontsize,decreasefontsize,ul,ol,indent,outdent,left,center,right,style,textcolor,removeformat,link,unlink,image,emoticons,editsource',
            	plugins:    op.plugins || 'Paste,Image,Emoticons,Link,ForceBlocks,Protect,TextColor,EditSource,Safari2x',
            	min_width:  op.minWidth || 400,
            	entities:   op.entities || 'numeric',
            	styles:     op.styles || [],
            	emoticons:  op.emoticons || {}
            });
          }
      }

    return ret;
  };

/*
bbcode version

    editor2 = new punymce.Editor({
    	id : 'content2',
    	toolbar : 'bold,italic,underline,strike,increasefontsize,decreasefontsize,ul,ol,indent,outdent,left,center,right,style,textcolor,removeformat,link,unlink,image,emoticons,editsource',
    	plugins : 'BBCode,Paste,Image,Emoticons,Link,Protect,TextColor,EditSource,Safari2x',
    	min_width : 400,
    	entities : 'numeric',
    	styles : [
    		{ title : 'Code', cls : 'pre', cmd : 'FormatBlock', val : '<pre>' },
    		{ title : 'Quote', cls : 'quote', cmd : 'mceSetClass', val : 'quote'},
    		{ title : 'Unquote', cls : 'quote', cmd : 'mceSetClass', val : ''}
    	],
    	emoticons : {
    		auto_convert : 1
    	}
    });
    
var editor1 = new punymce.Editor({
	id : 'content1',
	toolbar : 'bold,italic,underline,strike,increasefontsize,decreasefontsize,ul,ol,indent,outdent,left,center,right,style,textcolor,removeformat,link,unlink,image,emoticons,editsource',
	plugins : 'Paste,Image,Emoticons,Link,ForceBlocks,Protect,TextColor,EditSource,Safari2x',
	min_width : 400,
	entities : 'numeric'
});

var editor2 = new punymce.Editor({
	id : 'content2',
	toolbar : 'bold,italic,underline,strike,increasefontsize,decreasefontsize,ul,ol,indent,outdent,left,center,right,style,textcolor,removeformat,link,unlink,image,emoticons,editsource',
	plugins : 'BBCode,Paste,Image,Emoticons,Link,Protect,TextColor,EditSource,Safari2x',
	min_width : 400,
	entities : 'numeric',
	styles : [
		{ title : 'Code', cls : 'pre', cmd : 'FormatBlock', val : '<pre>' },
		{ title : 'Quote', cls : 'quote', cmd : 'mceSetClass', val : 'quote'},
		{ title : 'Unquote', cls : 'quote', cmd : 'mceSetClass', val : ''}
	],
	emoticons : {
		auto_convert : 1
	}
});

    
    
*/

