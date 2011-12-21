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

$AXIS.Modules.local.IconLibrary.__init = function(o) {
  var ops = o || {};
  /**
   * @private
   * @see #loadIcon
   */
  iconServer =  ops.iconServer || 'http://icons.limebits.com/icons/';
  
      /**
   * Loads icons from given icon server.  Note that there is minimal checking
   * of arguments.  Error handling involves managing the Image() callbacks, ie.
   * if the image loads successfully we have correct arguments; if it fails, we do not.
   *
   * @param      {Mixed}     img     Array or String icon info, as described below.
   * @param      {Function}  [cb]    Optional callback, which receives http icon path.
   *
   * Arguments are slash delimited strings, denoting, in order:
   *
   *  0: collection
   *  1: size
   *  2: category
   *  3: name
   *
   *  0: An existing collection, like 'nuvola' or 'crystal' (see icons.limebits.com server)
   *  1: Size, one of 16,22,32,48,64,128.
   *  2: Categories are: actions,apps,devices,filesystems,mimetypes.
   *  3: name is without extension... all are png.
   *
   *  ex. {String} nuvola/32/devices/camera, 
   *  or  {Array}
   *      [
   *        'nuvola/32/devices/camera',
   *        'nuvola/32/devices/printer'
   *      ]
   *
   *  A namespace is automatically created, with the size info forming 
   *  the collection at the tail of the namespace, allowing multiple
   *  sizes being bound to the same icon name, ie:
   *
   *  Sending:
   *      [
   *        'nuvola/16/devices/camera',
   *        'nuvola/32/devices/camera'
   *      ]
   *       
   *  creates a namespace accessible via:
   *
   *  $AXIS.Icons.nuvola.devices.camera[16] = {String} http:://pathtoicon.png
   *  $AXIS.Icons.nuvola.devices.camera[32] = ""
   * 
   */
  return {
    'load': function(img,cb)
      {
        if(AXIS.isUndefined(img))
          {
            return null;
          }
        
        /**
         * May send a single (String), or an Array... keep as array.
         */
        img = AXIS.isArray(img) ? img : [img];

        /**
         * Store the image count. We use this to track when loading is done.
         */
        var imCount = img.length;
        
        /**
         * Store the image results.
         */
        var imInfo  = {};
        
        /**
         * What to call when all images are loaded.
         */
        var allLoadedCallback = cb || AXIS.F;
    
        var cI,imobj,pI;
        
        /**
         * Fired whenever an image load attempt has returned.  NOTE that
         * this condition exists both when the load is successful and when
         * the load has failed -- the image attempt has been made and is done.
         */
        var _loadAttemptComplete = function()
          {
            if(--imCount <=0)
              {
                allLoadedCallback(imInfo);
              }
          };
        
        /**
         * On a successful load, we register the object at the proper
         * namespace, then call any sent callback, passing two 
         * arguments: 1: the image http src; 2: the original sent argument.
         */
        var _onload = function()
          {
            /**
             * Get the path components, then strip out second fragment(1,1), which
             * is the image size (16, 32...). So if we were sent nuvola/16/actions/edit,
             * the namespace would be $AXIS.Icons.nuvola.actions.edit <- note no 16/. 
             * We then add an index to the namespace with that value, creating:
             * $AXIS.Icons.nuvola.actions.edit.16 = pathToIcon.
             */ 
            var i =   this.img.split('/');
            var s =   i[1];
            var n =   i.splice(1,1);
    
            var ns =  AXIS.createNamespace('Icons.' + i.join('.'));
            ns[n]  =  this.src;
            
            /**
             * Create image info, which will be returned when all is finished.
             */
            var f = {
              namespace:  ns,
              size:       s,
              path:       ns[n]
            };
            
            /**
             * And index both by orig. argument and orig argument ordinal.
             */
            imInfo[this.img] = f;
            imInfo[this.idx] = f;

            _loadAttemptComplete();
          };
        
        for(var i=0; i < img.length; i++)
          {
            imobj           = new Image;
            
            /**
             * In order to track the original argument.
             * @see #_onload
             */
            imobj.img       = img[i];
            
            /**
             * In order to track the original position of argument.
             * @see #_onload
             */
            imobj.idx       = i;
            
            imobj.onload    = _onload;
            imobj.onerror   = _loadAttemptComplete;
            imobj.onabort   = _loadAttemptComplete;
            
            imobj.src       = iconServer + img[i] + '.png';
          }     
      }
  }
    
};