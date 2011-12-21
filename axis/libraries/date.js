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
 * Creates an independent copy of a date
 *
 * @type      {Date}
 */
AXIS.extend({
  name:       'copyDate', 
  expects:    'Date',
  namespace:  'DATE',
  func:       function() 
    {
      return new Date(this.getTime()); 
    }
});

/**
 * @returns                Full day name, indexed by current day.
 * @type     {String}
 */
AXIS.extend({
  name:       'getFullDay', 
  namespace:  'DATE',
  func:       function() 
    { 
      var dn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return dn[this.getDay()]; 
    }
});
    
/**
 * @returns                First three(3) letters of day name.
 * @type       {String}
 */
AXIS.extend({
  name:       'getDayAbbr', 
  expects:    'Date',
  namespace:  'DATE',
  func:       function() 
    { 
      return AXIS.scope(this).getFullDay().$.slice(0, 3); 
    }
});
    
/**
 * @returns                Full month name, indexed by current month
 * @type       {String}
 */
AXIS.extend({
  name:       'getFullMonth', 
  expects:    'Date',
  namespace:  'DATE',
  func:       function() 
    {
      var mn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return mn[this.getMonth()]; 
    }
});

/**
 * @returns                First three(3) letters of month name.
 * @type       {String} 
 */
AXIS.extend({
  name:       'getMonthAbbr', 
  expects:    'Date',
  namespace:  'DATE',
  func:       function() 
    { 
      return AXIS.scope(this).getFullMonth().$.slice(0, 3); 
    }
});

/**
 * @returns                The time in "hh:mm:ss am/pm" format with the numbers padded to two digits. 
 * @type       {String}
 */
AXIS.extend({
  name:       'to12HourTimeString', 
  namespace:  'DATE',
  func:       function() 
    {
      var h = this.getHours();
      var m = "0" + this.getMinutes();
      var s = "0" + this.getSeconds();
      var ap = "am";
      if (h >= 12) 
        {
          ap = "pm";
          if (h >= 13)
            {
              h -= 12;
            }
        } 
      else if(h == 0) 
        {
          h = 12;
        }
      h = "0" + h;
          
      return h.slice(-2) + ":" + m.slice(-2) + ":" + s.slice(-2) + " " + ap;
    }
});
    
/**
 * @returns                  The time in 24-hour format padding the numbers to two digits.
 * @type       {String}
 */
AXIS.extend({
  name:       'to24HourTimeString', 
  namespace:  'DATE',
  func:       function()
    {
      var h = "0" + this.getHours();
      var m = "0" + this.getMinutes();
      var s = "0" + this.getSeconds();
      return h.slice(-2) + ":" + m.slice(-2) + ":" + s.slice(-2);
    }
});
    
/**
 * @returns                  The last day in the current month. (Equivalent to #days in month)
 * @type       {Number}
 */
AXIS.extend({
  name:       'lastDay', 
  namespace:  'DATE',
  func:       function()
    {
      var d = new Date(this.getFullYear(), this.getMonth() + 1, 0);
      return d.getDate();
    }
});
    
/**
 * Get the number of days between current date and sent date.  If sent date
 * is earlier than current date, a negative number is returned (positive if later).
 *
 * @param      {Date}      d       A Date object.
 * @returns                        The number of days between two dates.
 * @type       {Number}
 */
AXIS.extend({
  name:       'getDaysBetween', 
  namespace:  'DATE',
  func:       function(d)
    {
      var tmp = AXIS.scope(d).copyDate().$;
      tmp.setHours(this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
      var diff = tmp.getTime() - this.getTime();
      return diff/86400000;        
    }
});

/**
 * @returns                        The day of the year (1-365).
 * @type       {Number}
 */
AXIS.extend({
  name:       'getDayOfYear', 
  namespace:  'DATE',
  func:       function()
    {
      var start = new Date(this.getFullYear(), 0, 0);
      return this.getDaysBetween(start) * -1;
    }
});
    
/**
 * Adds (or subtracts) a number of days to(from) current date.
 *
 * @param    {Number}       d       Number of days, + or -
 * @type     {Date}
 */
AXIS.extend({
  name:       'addDays', 
  namespace:  'DATE',
  func:       function(d)
    {
      this.setDate(this.getDate() + d);
      return this;
    }
});
    
/**
 *  Adds (or subtracts) a number of weeks to(from) current date.
 *
 * @param    {Number}       w       Number of weeks, + or -
 * @type     {Date}
 */
AXIS.extend({
  name:       'addWeeks', 
  namespace:  'DATE',
  func:       function(w)
    {
      this.addDays(w * 7);
      return this;
    }
});
    
/**
 * Same day, (+/-) # of months.  Adjustments made if not exact 
 * mapping -- so if January 31 + 1 month = a date greater than days
 * in February, then the result would be the last day of February. More
 * regularly, Jan 2 + 1 month would be Feb 2, which is desired behaviour.
 *
 * @param    {Number}       m       Number of months, + or -
 * @type     {Date}
 */
AXIS.extend({
  name:       'addMonths', 
  namespace:  'DATE',
  func:       function(m)
    {
      var d = this.getDate();
      this.setMonth(this.getMonth() + m);
      if(this.getDate() < d)
        {
          this.setDate(0);
        }
      return this;
    }
});
   
/**
 * +- years.  Leap years are adjusted as with #addMonths.
 *
 * @param    {Number}       y       Number of years, + or -
 * @type     {Date}
 */ 
AXIS.extend({
  name:       'addYears', 
  namespace:  'DATE',
  func:       function(y)
    {
      var m = this.getMonth();
      this.setFullYear(this.getFullYear() + y);
      if(m < this.getMonth()) 
        {
          this.setDate(0);
        }
      return this;
    }
});
    
/**
 * Adds/subtracts d number of week (work) days (accounting
 * for weekends).
 *
 * @param    {Number}       d       Number of work days, + or -
 * @type     {Date}
 */
AXIS.extend({
  name:       'addWeekDays', 
  namespace:  'DATE',
  func:       function(d)
    {
      var startDay = this.getDay();                 //current weekday 0 thru 6
      var wkEnds = 0;                               //# of weekends needed
      var partialWeek = d % 5;                      //# of weekdays for partial week
      if(d < 0)                                     //subtracting weekdays 
        {
          wkEnds = Math.ceil(d/5);                  //negative number weekends
          switch (startDay) 
            {
              case 6:                               //start Sat. 1 less weekend
                if(partialWeek == 0 && wkEnds < 0)
                  { 
                    wkEnds++;
                  }
              break;
              case 0:                               //starting day is Sunday
                if(partialWeek == 0)
                  { 
                    d++;                            //decrease days to add
                  }
                else
                  { 
                    d--;                            //increase days to add
                  }
              break;
              default:
                if(partialWeek <= -startDay)
                  { 
                    wkEnds--;
                  }
              break;
            }
        } 
      else if(d > 0)                                //adding weekdays
        {
          wkEnds = Math.floor(d/5);
          var w = wkEnds;
          switch(startDay) 
            {
              case 6:
                /* If staring day is Sat. and
                 * no partial week one less day needed
                 * if partial week one more day needed
                 */
                if (partialWeek == 0)
                  { 
                    d--;
                  }
                else
                  { 
                    d++;
                  }
              break;
              case 0:        //Sunday
                if(partialWeek == 0 && wkEnds > 0)
                  { 
                    wkEnds--;
                  }
              break;
              default:
                if(5 - day < partialWeek)
                  { 
                    wkEnds++;
                  }
              break;
            }
        }
      d += wkEnds * 2;
      AXIS.scope(this).addDays(d);
      return this;
    }
});
    
/**
 * Calculate number of week days between this date and d.  
 * NOTE the returned value is always positive.
 *
 * @param    {Date}      d       The target date
 * @returns                      #of weekdays
 * @type     {Number}
 */
AXIS.extend({
  name:       'getWeekDays',
  namespace:  'DATE',
  func:       function(d)
    {
      var wkEnds = 0;
      var days = Math.abs(AXIS.scope(this).getDaysBetween(d).$);
      var startDay = 0, endDay = 0;
      if(days) 
        {
          if(d < this) 
            {
              startDay = d.getDay();
              endDay = this.getDay();
            } 
          else 
            {
              startDay = this.getDay();
              endDay = d.getDay();
            }
            
          wkEnds = Math.floor(days/7);
          
          if(startDay != 6 && startDay > endDay)
            { 
              wkEnds++;
            }
          if(startDay != endDay && (startDay == 6 || endDay == 6))
            { 
              days--;
            }
          days -= (wkEnds * 2);
        }
      return days;
    }
});
    
/**
 * Months between this date and d. Returns negative value
 * if sent date is earlier than current date.
 *
 * @param      {Date}        m       The target date.
 * @returns                          +/- number indicating months between.
 * @type       {Number}  
 */
AXIS.extend({
  name:       'getMonthsBetween', 
  namespace:  'DATE',
  func:       function(m)
    {
      var sDate, eDate;   
      var d1 = this.getFullYear() * 12 + this.getMonth();
      var d2 = m.getFullYear() * 12 + m.getMonth();
      var sign;
      var months = 0;
      if (this == m) 
        {
          months = 0;
        } 
      else if(d1 == d2)  //same year and month
        {
          months = (m.getDate() - this.getDate()) / AXIS.scope(this).lastDay().$;
        } 
      else 
        {
          if(d1 <  d2) 
            {
              sDate = this;
              eDate = m;
              sign = 1;
            } 
          else 
            {
              sDate = m;
              eDate = this;
              sign = -1;
            }
          var sAdj = AXIS.scope(sDate).lastDay().$ - sDate.getDate();
          var eAdj = eDate.getDate();
          var adj = (sAdj + eAdj)/AXIS.scope(sDate).lastDay().$ -1;
          months = Math.abs(d2 - d1) + adj;
          months = (months * sign);
        }
      return months;
    }
});
    
/**
 * Years between this date and d. Returns negative value
 * if sent date is earlier than current date.
 *
 * @param      {Date}      y       The target date.
 * @return                         +/- number indicating years between.
 * @type       {Number}
 */
AXIS.extend({
  name:       'getYearsBetween', 
  namespace:  'DATE',
  func:       function(y)
    {
      var months = AXIS.scope(this).getMonthsBetween(y).$;
      return months/12;
    }
});
    
/**
 * Calculates age of person born on this.date
 *  
 * @returns                        The age
 * @type       {Number}
 */
AXIS.extend({
  name:       'getAge', 
  namespace:  'DATE',
  func:       function()
    {
      var today = new Date();
      return AXIS.scope(this).getYearsBetween(today).$.toFixed(2);
    }
});
    
/**
 * Returns an array of dates for a given day of week—Sunday through 
 * Saturday for each week between two dates.  
 *
 * @param      {Number}        day         0-6 (Sun-Sat) = The day.
 * @param      {Date}          date        The target date.
 * @returns                                An array of dates, in this format:
 *
 *              var listofdays = .scope(date).sameDayEachWeek(2, enddate).$;
 *              listofdays.join('<br>');
 *
 *              Displays:   Tue Jan 08 2008 00:00:00 GMT-0600 (Central Standard Time)
 *                          Tue Jan 15 2008 00:00:00 GMT-0600 (Central Standard Time)
 *                          Tue Jan 22 2008 00:00:00 GMT-0600 (Central Standard Time)
 *                          Tue Jan 29 2008 00:00:00 GMT-0600 (Central Standard Time)
 *                          Tue Feb 05 2008 00:00:00 GMT-0600 (Central Standard Time)
 * @type       {Array}
 */ 
AXIS.extend({
  name:       'sameDayEachWeek', 
  namespace:  'DATE',
  func:       function(day, date)
    {
      var aDays = [];
      var eDate, nextDate, adj;
      if(this > date) 
        {
          eDate = this;
          nextDate = AXIS.scope(date).copyDate().$;
        } 
      else 
        {
          eDate = date;
          nextDate = AXIS.scope(this).copyDate().$;
        }
      adj = (day - nextDate.getDay() + 7) %7;
      nextDate.setDate(nextDate.getDate() + adj);
      while (nextDate < eDate) 
        {
          aDays[aDays.length] = AXIS.scope(nextDate).copyDate().$;
          nextDate.setDate(nextDate.getDate() + 7);
        }
      return aDays;
    }
});