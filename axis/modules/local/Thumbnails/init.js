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
 * Fetch thumbnails via pageglimpse service
 *
 * @see  http://www.pageglimpse.com
 */

 
$AXIS.Modules.local.Thumbnails.__init = function(ob)
  { 
    AXIS.Errors.createExceptionType('ModulesThumbnailsException');
    AXIS.Errors.registerCode('MODULE_THUMBNAILS_NO_ID',"Module.Thumbnails No .containerId sent.");
    AXIS.Errors.registerCode('MODULE_THUMBNAILS_NO_URLS',"Module.Thumbnails No .urls sent.");
    
    if(ob.containerId)
      {
        var container = document.getElementById(ob.containerId);
      }
    else
      {
        new AXIS.Errors.ModulesThumbnailsException('MODULE_THUMBNAILS_NO_ID');
        return;
      };
    
    if(ob.urls)
      {
        /**
         * Make sure we have an array
         */
		    var urls      =  AXIS.isArray(ob.urls) ? ob.urls : [ob.urls];
		  }
		else
		  {
        new AXIS.Errors.ModulesThumbnailsException('MODULE_THUMBNAILS_NO_URLS');
        return;
		  }
		
		
		var thumbs = $AXIS.Modules.local.Thumbnails.Thumbnails({ 
		  devkey:   'c009e4eb177cd2f54a3d724fe4827612',
		  size:     ob.size || 'small',
		  root:     (typeof ob.showRoot === 'undefined') ? false : !!ob.showRoot
		});
		
		var insertFunction = ob.insertFunction || function(url, img) 
		  {
			  var link = document.createElement('a');
				link.href = url;
				link.appendChild(img);
				container.appendChild(link);
			}

    thumbs.get(urls, insertFunction);
  };