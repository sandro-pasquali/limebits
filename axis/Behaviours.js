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
function Behaviours()
  {
    /**
     * @constructor
     */
    this.__construct = function() 
      {
      };
    
    this.elastic = function()
      {
        this.elastic = function(typ)
          {
            try
              {
                this.main = this.elasticFunctions[typ]; 
              }
            catch(e)
              {
              }
          };
          
        this.elasticFunctions = 
          {
            standard: function()
              {
                this.currentX =
                Math.round(this.PX+=(this.ddx+=((this.targetX()-this.PX-this.ddx))*this.tension));
                this.currentY = 
                Math.round(this.PY+=(this.ddy+=((this.targetY()-this.PY-this.ddy))*this.tension));
              }
          };
      };
      
    this.easing = function() 
      {
        this.easing = function(typ)
          {
            try
              {
                this.main = this.easingFunctions[typ]; 
              }
            catch(e)
              {
              }
          };
        
        this.easingFunctions = 
          {
            incubic: function()
              {
                this.currentX = this.xChange*Math.pow(this.time/this.duration,3)+this.xStart;
                this.currentY = this.yChange*Math.pow(this.time/this.duration,3)+this.yStart;
              },
                  
            outcubic: function()
              {
                this.currentX = this.xChange*(Math.pow(this.time/this.duration-1,3)+1)+this.xStart;
                this.currentY = this.yChange*(Math.pow(this.time/this.duration-1,3)+1)+this.yStart;
              },
          
            inoutcubic: function()
              {
                time = this.time;
                this.currentX = ((time/=this.duration/2)<1)
                              ? this.xChange/2 * Math.pow(time,3) + this.xStart
                              : this.xChange/2 * (Math.pow(time-2,3)+2) + this.xStart;
                      
                time = this.time;
                this.currentY = ((time/=this.duration/2)<1)
                              ? this.yChange/2 * Math.pow(time,3) + this.yStart
                              : this.yChange/2 * (Math.pow(time-2,3)+2) + this.yStart;
              },
          
            inquadratic: function()
              {
                time = this.time;
                this.currentX = this.xChange*(time/=this.duration)*time + this.xStart;
                time = this.time;
                this.currentY = this.yChange*(time/=this.duration)*time + this.yStart;
              },

                  
            outquadratic: function()
              {
                time = this.time;
                this.currentX = -this.xChange*(time/=this.duration)*(time-2) + this.xStart;
                time = this.time;
                this.currentY = -this.yChange*(time/=this.duration)*(time-2) + this.yStart;
              },
        
            inoutquadratic: function()
              {
                time = this.time;
                this.currentX = ((time/=this.duration/2)<1)
                              ? this.xChange/2*time*time + this.xStart
                              : -this.xChange/2*((--time)*(time-2)-1) + this.xStart;
                    
                time = this.time;
                this.currentY = ((time/=this.duration/2)<1)
                              ? this.yChange/2*time*time + this.yStart
                              : -this.yChange/2*((--time)*(time-2)-1) + this.yStart;
              },
         
            incircular: function()
              {
                time = this.time;
                this.currentX = this.xChange*(1-Math.sqrt(1-(time/=this.duration)*time)) + this.xStart;
                time = this.time;
                this.currentY = this.yChange*(1-Math.sqrt(1-(time/=this.duration)*time)) + this.yStart;
              },
         
            outcircular: function()
              {
                time = this.time;
                this.currentX = this.xChange*Math.sqrt(1-(time=time/this.duration-1)*time) + this.xStart;
                time = this.time;
                this.currentY = this.yChange*Math.sqrt(1-(time=time/this.duration-1)*time) + this.yStart;
              },
           
            inoutcircular: function()
              {
                time = this.time;
                this.currentX = ((time/=this.duration/2)<1)
                              ? this.xChange/2*(1-Math.sqrt(1-time*time)) + this.xStart
                              : this.xChange/2*(Math.sqrt(1-(time-=2)*time)+1) + this.xStart;
                      
                time = this.time;
                this.currentY = ((time/=this.duration/2)<1)
                              ? this.yChange/2*(1-Math.sqrt(1-time*time)) + this.yStart
                              : this.yChange/2*(Math.sqrt(1-(time-=2)*time)+1) + this.yStart;
              }
          };
      };
  };                    
