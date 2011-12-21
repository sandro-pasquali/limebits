/**
 * Copyright 2008, 2009 Lime Labs LLC
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
 */
function Animations()
  {
    /**
     * @constructor
     */
    this.__construct = function() 
      {
        this.animationSpeed= function()
          {
            return 10;
          };
      };

    this.elastic = function()
      {
        this.elastic = function(argOb)
          {
            try
              {
                this.elementRef = argOb[0];
                this.elementStyle = this.elementRef.style;
                
                this.condition = argOb[1] 
                               || function() 
                                    { 
                                      return true;
                                    };

                this.tension = 1/this.animationSpeed();
                this.currentX = 0;
                this.currentY = 0;
                this.ddx=0;
                this.ddy=0;
                this.PX=0;
                this.PY=0;
                
                // this will set the default .type
                this.setElastic('standard');

                // determine target x,y
                switch(typeof(argOb[2]))
                  {
                    case 'object':
                      this.master = argOb[2].style;
                      this.targetX = function()
                        {
                          return parseInt(this.master.left);
                        };
                      this.targetY = function()
                        { 
                          return parseInt(this.master.top);
                        };
                    break;
                        
                    case 'string':
                      this.targetX = function()
                        {
                          return AXIS.Events.eventInfo.x;
                        };
                      this.targetY = function()
                        {
                          return AXIS.Events.eventInfo.y;
                        };
                    break;
                    
                    case 'number':
                      this.tX = argOb[2];
                      this.tY = argOb[3];
                      this.targetX = function()
                        {
                          return this.tX;
                        };
                      this.targetY = function()
                        {
                          return this.tY;
                        };
                    break;
                    
                    default:
                    break;
                  }
              }
            catch(e)
              {
              }
          };
          
        this.setElastic = function(elast)
          {
            this.type = elast.toLowerCase();
            this.step = AXIS.Behaviours.build('elastic',this.type).main;
          };
          
        this.main = function()
          {
            this.step();
            this.elementStyle.left = Math.round(this.currentX);
            this.elementStyle.top = Math.round(this.currentY);
            return this.condition();
          };  
      };
      
    this.moveTo = function()
      {
        this.moveTo = function(argOb)
          {
            try
              {
                this.elementRef = argOb[0];
                this.elementStyle = argOb[0].style;
                this.condition = argOb[1] 
                               || function() 
                                    { 
                                      if(this.time>this.duration) { return false; }
                                      return true;
                                    };
                     
                this.time = 0;
                this.type = argOb[2];
                this.xStart = parseInt(this.elementStyle.left);
                this.yStart = parseInt(this.elementStyle.top);
                this.xFinish = argOb[3];
                this.yFinish = argOb[4];
                this.duration = argOb[5] || this.animationSpeed()*10;
                this.xChange = this.xFinish - this.xStart;
                this.yChange = this.yFinish - this.yStart;

                this.currentX = 0;
                this.currentY = 0;
  
                this.setEasing(this.type);
              }
            catch(e)
              {
              } 
          };
          
        this.setEasing = function(ease)
          {
            this.type = ease.toLowerCase();
            this.step = AXIS.Behaviours.build('easing',this.type).main;
          };
          
        this.main = function()
          {
            this.step();
            this.elementStyle.left = Math.round(this.currentX);
            this.elementStyle.top = Math.round(this.currentY);
            ++this.time;
            return this.condition();
          };
      };
  };