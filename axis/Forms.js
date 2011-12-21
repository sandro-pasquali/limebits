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
function Forms()
  {
    /*
     * @constructor
     */
    this.__construct = function()
      {
      };
    
    this.validator = function()
      {
        this.validator = function(argOb)
          {
            this.document = argOb[0] || document;
            // remove this entirely to turn off background highlighting
            this.errorBackgroundColor = '#FAFEAF';
            this.defaultErrorString = '';
            this._errors = 0;
            this.submitHandler = false;
            
            this._regexes =
              {
                oneChar:                  /^\S+$/,
                allDigits:                /^\d+$/,
                allAlpha:                 /^[a-zA-Z]+$/,
                validEmail:               /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/,
                validUsername:            /^[A-Za-z-_!:~\w]{6,31}$/,
                validPassword:            /^[A-Za-z-_!:~\w]{6,31}$/,
                validNameField:           /^[A-Za-z-.\w]{1,100}$/,
                validZip:                 /^[\d]{5}$/,
                validZip4:                /^[\d]{5}-[\d]{4}$/,
                validCompany:             /^[- \.\w]{0,255}$/,
                registrationID:           /^[\w]{32}$/,
                calendarDate:             /^[\d]{4}[-][\d]{2}[-][\d]{2}$/,
                calendarDateWithTime:     /^[\d]{4}[-][\d]{2}[-][\d]{2} [\d]{2}:[\d]{2}:[\d]{2}$/,
        
                /**
                 * International phone #'s (+61-8-5555-5555)
                 */
                intPhone:       /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/,
                
                /**
                 * New York, USA
                 */
                cityCountry:  /^[A-Za-z][\'\.\-\sA-Za-z]{0,62}[A-Za-z][\s]{0,1},[\s]{0,1}[A-Za-z][\'\.\-\sA-Za-z]{0,62}[A-Za-z\.]$/,
                
                /**
                 * New York, USA || 20012 || 20034-2345
                 */
                locationCombo:            /(^[A-Za-z][\'\.\-\sA-Za-z]{0,62}[A-Za-z][\s]{0,1},[\s]{0,1}[A-Za-z][\'\.\-\sA-Za-z]{0,62}[A-Za-z\.]$|^[\d]{5}$|^[\d]{5}-[\d]{4}$)/
              };   
              
            this.wordCount = function(str)
              {
                var w = str.split(' ');
                var wc = 0;
                for(i in w)
                  {
                    if(w[i].length > 2)
                      {
                        ++wc;
                      }
                  }
                return(wc);
              };
          };
          
        this.incErrorCount = function() 
          { 
            this._errors++; 
          };
      
        this.decErrorCount = function() 
          { 
            this._errors--; 
          };
      
        this.clearErrorCount = function() 
          { 
            this._errors = 0; 
          };
      
        this.errorCount = function() 
          { 
            return(this._errors); 
          };
        
        this.makeFlag = function(el)
          {
            var emsg = (el.getAttribute('errorString')) || this.defaultErrorString;
            var add = (el.getAttribute('additionalInfo')) || '';
            var err = this.document.createTextNode(emsg);
        
            var container = this.document.createElement('span');
            container.className = 'check';
            container.additionalInfo = add;
            container.appendChild(err);
        
            if(add) 
              {
                var addS = this.document.createElement('span');
                addS.className = 'additionalInfo';
                addS.additionalInfo = add;
          
                addS.onclick = function()
                  {
                    alert(this.additionalInfo);
                  };
          
                var addST = this.document.createTextNode('[?]');
                addS.appendChild(addST);
                container.appendChild(addS);
              }
            return(container);
          };
    
        this.turnOnCheck = function(el,fID)
          {
            this.incErrorCount();
            var nam = el.name;

            var w = this.document.getElementById(fID + 'check' + nam);   
            if(w)
              {
                if(w.lastChild) { return; } // already flagged
                w.appendChild(this.makeFlag(el));
              }
            else 
              {
                var chk = this.document.createElement('span');
                chk.id = fID + 'check' + nam;
                chk.className = 'check';
                chk.appendChild(this.makeFlag(el));
                
                if(el.nextSibling)
                  {
                    el.parentNode.insertBefore(chk,el.nextSibling);
                  }
                else
                  {
                    el.parentNode.appendChild(chk);
                  }
              }
            
            /*
             * if we need to set a background color, do that
             * now. note that we store the current background color
             */
            if(this.errorBackgroundColor)
              {
                el.setAttribute('lastBackgroundColor',el.style.backgroundColor);
                el.style.backgroundColor = this.errorBackgroundColor;
              }
          };
    
        this.turnOffCheck = function(el,fID)
          {
            try
              {
                var nam = el.name;
                var w = this.document.getElementById(fID + 'check' + nam);
          
                w.removeChild(w.lastChild);
              }
            catch(e) {}
            
            /*
             * if we are setting background colors, reset
             */
            if(this.errorBackgroundColor)
              {
                el.style.backgroundColor = el.getAttribute('lastBackgroundColor');
              }
          };
      
        this.skippedField = function(ee)
          {
            if(ee.attributes.getNamedItem('validate')) 
              {
                return(ee.getAttribute('validate') == 'false');
              }
            return(false); 
          };
        
        this.getFieldRegex = function(ee)
          {
            if(ee.getAttribute('regex')) 
              {
                return(ee.getAttribute('regex'));
              }
            return(false); 
          };
        
        this.validField = function(el)
          {
            var strV = el.value.toString();
            var fRegex = this.getFieldRegex(el);
        
            // is there a regex attribute set?
            if(fRegex)
              {
                // check if we've been sent a regex template
                try
                  {
                    var rex = eval('this._regexes.'+fRegex);
                  }
                catch(e) 
                  {
                    var rex = false;
                  }
            
                // if so, execute the regex template
                if(rex)
                  {
                    return((rex.exec(strV)) ? true : false);
                  }
                else 
                  {
                    try // try what we've been sent as a regex
                      {
                        fRegex = eval(fRegex);
                        
                        return((fRegex.exec(strV)) ? true : false);
                      }
                    catch(e) // not a proper regex; try as a conditional
                      {
                        try
                          {
                            // replace %% with 'strV'
                            fRegex = fRegex.replace(/%%/g,'strV');
                            return(eval(fRegex));
                          }
                        catch(e) // no dice
                          {
                            return(false);
                          }
                      }
                  }
              }
            else 
              {
                /* 
                 * if no regex is given, and since the field has been flagged
                 * for validation, assume a valid field would simply be one
                 * with ANY value entered, of at least one character
                 */
                return((this._regexes.oneChar.exec(strV)) ? true : false);
              }
          };
        
        this.findForm = function(el)
          {
            var tmp = el;
            while(tmp.parentNode)
              {
                if(tmp.parentNode.tagName.toUpperCase() == 'FORM') 
                  {
                    return tmp.parentNode;
                  }
                tmp = tmp.parentNode;
              }
            return false;
          };
        
        this.attemptSubmit = function(el)
          {
            this.validateForm(el);
            
            if(this.errorCount() < 1)
              {
                /*
                 * ok; submit form
                 */
                 
                var frm = this.findForm(el);
                
                if(this.submitHandler)
                  {
                    this.submitHandler(frm);
                  }
                else
                  {
                    frm.submit(); 
                  }
              }
          };
          
        this.setSubmitHandler = function(f)
          {
            try
              {
                this.submitHandler = f;
              }
            catch(e){}
          };
    
        this.validateForm = function(el)
          {
            this.clearErrorCount();
    
            var F = this.findForm(el);
            var formName = F.id;
        
            for(var x=0; x < F.elements.length; x++)
              {
                var E = F.elements[x];
                if(E.type)
                  {
                    var T = E.type.toLowerCase();
                    // ignore hidden fields, buttons, and skipped fields
                    if((T != 'hidden') && (T != 'button') && (this.skippedField(E)===false))
                      {
                        /*
                         * special handling for checkboxes, being that they are on or off; if this
                         * field is supposed to be validated, valid = checked, invalid = unchecked
                         */
                        if(T == 'checkbox')
                          {
                            if(E.checked) 
                              { 
                                this.turnOffCheck(E,formName);
                                continue; 
                              }
                            else 
                              { 
                                this.turnOnCheck(E,formName); 
                                continue;
                              }
                          }
                        else
                          {
                            if(this.validField(E))
                              {
                                this.turnOffCheck(E,formName);
                              }
                            else
                              {
                                this.turnOnCheck(E,formName);
                              }
                          }
                      }
                  }
              }
          };
        
        this.CreditCard =
          { 
            allDigits: /^\d+$/,
        
            validCard: function(cNum,cType)
              {
                return(this.validNumber(cNum) && this.validType(cNum,cType));
              },
          
            validNumber: function(strNum) 
              {
                var nCheck = 0;
                var nDigit = 0;
                var bEven  = false;
       
                for(n = strNum.length - 1; n >= 0; n--) 
                  {
                    var cDigit = strNum.charAt (n);
                    if(this.allDigits.exec(cDigit))
                      {
                        var nDigit = parseInt(cDigit, 10);
                        if (bEven)
                          {
                            if((nDigit *= 2) > 9)
                              {
                                nDigit -= 9;
                              }
                          }
                        nCheck += nDigit;
                        bEven = ! bEven;
                      }
                    else if(cDigit != ' ' && cDigit != '.' && cDigit != '-')
                      {
                        return false;
                      }
                  }
                return((nCheck % 10) === 0);
              },
      
            validType: function(strNum, type)
              {
                var nLen = 0;
                for(n = 0; n < strNum.length; n++)
                  {
                    if(this.allDigits.exec(strNum.substring (n,n+1)))
                      {
                        ++nLen;
                      }
                  }
       
                var first = strNum.substring(0,1);
                var second = strNum.substring(1,2);
                var ftwo = strNum.substring(0,2);
                var ffour = strNum.substring(0,4);
       
                switch(type.toLowerCase())
                  {
                    case 'visa':
                      return ((first == '4') && (nLen == 13 || nLen == 16));
         
                    case 'amex':
                      return ((ftwo == '34' || ftwo == '37') && (nLen == 15));
         
                    case 'mastercard':
                      return ((ftwo == '51' || ftwo == '52' || ftwo == '53' || ftwo == '54' || ftwo == '55') && (nLen == 16));
         
                    case 'dinersclub':
                      return ((ftwo == '30' || ftwo == '36' || ftwo == '38') && (nLen == 14));
         
                    case 'carteblanche':
                      return ((ftwo == '30' || ftwo == '36' || ftwo == '38') && (nLen == 14));
         
                    case 'discover':
                      return ((ffour == '6011') && (nLen == 16));
         
                    case 'enroute':
                      return ((ffour == '2014' || ffour == '2149') && (nLen == 15));
         
                    case 'jcb':
                      return ((ffour == '3088' || ffour == '3096' || ffour == '3112' || ffour == '3158' || ffour == '3337' || ffour == '3528') && (nLen == 16));
         
                    default:
                      return false;
                  }
              }
          };  
      };     
  }//alert(AXIS.Forms.CreditCard.validCard('5191230043035667','mastercard'));
