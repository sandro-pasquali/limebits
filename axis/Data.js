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
 *
 * @requires  AXIS
 *
 * @throws Data_TABLE_NO_NAME
 * @throws Data_TABLE_BAD_NAME
 * @throws Data_TABLE_ATTACH_FAIL
 * @throws Data_ADD_FIELD_NO_NAME
 * @throws Data_ADD_FIELD_EXISTS
 * @throws Data_INSERT_REC_MALFORMED
 * @throws Data_INSERT_REC_NOT_OBJ
 * @throws Data_INDEX_OUT_OF_RANGE
 * @throws Data_DELETE_UNKNOWN_FIELD
 * @throws Data_DELETE_RECORD_BAD_QUERY
 * @throws Data_TSEARCH_BAD_QUERY
 * @throws Data_SORT_FAILED
 * @throws Data_UPDATE_INDEX_MALFORMED
 * @throws Data_UPDATE_OBJECT_MALFORMED
 * @throws Data_UPDATE_UNKNOWN_INDEX
 * @throws Data_UPDATE_FIELD_ERROR
 */
function Data()
  {
    /**
     * @constructor
     */
    this.__construct = function()
      {
      	this.tables 			= [];
      	this.Info 				= {
      												table: 							false,
      												lastRecordTouched: 	false,
      												action:							false,
      												errorCode:					false
      											};

        AXIS.Errors.createExceptionType('DataCreateTableException');
      	AXIS.Errors.registerCode('Data_TABLE_NO_NAME',"Data.createTable() Bad definition: name not given or badly formed.");
        AXIS.Errors.registerCode('Data_TABLE_BAD_NAME',"Data.createTable() Bad .name property: must contain between 1 and 100 alphanumeric characters, no spaces, starting with alpha or _ or $");
        AXIS.Errors.registerCode('Data_TABLE_ATTACH_FAIL',"Data.createTable() Unable to attach table.  Probably corrupted Table class.");
        
        AXIS.Errors.createExceptionType('DataAddFieldException');
        AXIS.Errors.registerCode('Data_ADD_FIELD_NO_NAME',"Data.Table.addField() No .name property set on add");
        AXIS.Errors.registerCode('Data_ADD_FIELD_EXISTS',"Data.Table.addField() Unable to add field - field exists.");
        
        AXIS.Errors.createExceptionType('DataInsertRecordException');
        AXIS.Errors.registerCode('Data_INSERT_REC_MALFORMED',"Data.Table.insertRecord() Unknown field name or regex failed.");
        AXIS.Errors.registerCode('Data_INSERT_REC_NOT_OBJ',"Data.Table.insertRecord() Record not an object or malformed.");
        AXIS.Errors.registerCode('Data_INDEX_OUT_OF_RANGE',"Data.Table.insertRecord() Given index out of range.");
        
        AXIS.Errors.createExceptionType('DataDeleteFieldException');
        AXIS.Errors.registerCode('Data_DELETE_UNKNOWN_FIELD',"Data.Table.deleteField() Unknown field name.");
        
        AXIS.Errors.createExceptionType('DataDeleteRecordException');
        AXIS.Errors.registerCode('Data_DELETE_RECORD_BAD_QUERY',"Data.Table.deleteField() Query not understood.");
        
        AXIS.Errors.createExceptionType('DataSearchException');
        AXIS.Errors.registerCode('Data_TSEARCH_BAD_QUERY',"Data.Table.search() Query not understood.");
        
        AXIS.Errors.createExceptionType('DataUpdateRecordException');
        AXIS.Errors.registerCode('Data_UPDATE_INDEX_MALFORMED',"Data.Table.updateRecord() Index not sent or not an integer.");
        AXIS.Errors.registerCode('Data_UPDATE_OBJECT_MALFORMED',"Data.Table.updateRecord() Update object not sent, or not an object.");
        AXIS.Errors.registerCode('Data_UPDATE_UNKNOWN_INDEX',"Data.Table.updateRecord() No record found at requested index.");
        AXIS.Errors.registerCode('Data_UPDATE_FIELD_ERROR',"Data.Table.updateRecord() One of the fields sent either does not exist in this table, or its value does not match field regex.");
        
      };
    
    /**
     * @private.  
     * @see   Table constructor; Table#addField
     */
    this._pushFieldObject = function(fob)
      {
        /**
         * Every field gets a regex.
         */
        var rx =  (fob.regex) 
                  ? AXIS.isRegExp(fob.regex) 
                      // Sent valid regex; use.
                    ? fob.regex 
                      // Not regex. Valid shortcut string? Not found: use varchar.
                    : AXIS.Regexes[fob.regex] || AXIS.Regexes.varchar 
                    // nothing sent; varchar default.
                  : AXIS.Regexes.varchar;
      	  	  	
      	this.fields.push({
      		name: 	fob.name,
      		regex: 	rx
      	});
      };
      
    /*
     * Private. Adds a table to the database collection
     * @param 	{Object} table -- a Table object.
     * @return	true on success, false on failure
     */
    this._attachTable = function(table)
      {
      	try
      	  {
      	  	if(this.getTable(table) !== false)
      	  	  {
      	  	  	/*
      	  	  	 * already exists
      	  	  	 */
      	  	  	return false;
      	  	  }
      	  	
      	  	this.tables[table.name] = table;
      	  	return true;
      	  }
      	catch(e)
      	  {
      	  	return false;
      	  }	
      };
    
    /*
     * Parser of user query strings.  Creates and returns two arrays,
     * one containing all AND prop/val seeks, the other OR's.
     * @param		{Object}	- query - The query
     * @return	{Object}	- Containing both arrays:
     *																							{
     *																								OR: 	[],
     *																								AND: 	[]
     *																							}
     */
    this._parseQuery = function(query)
      {
        if(AXIS.isObject(query))
          {
            /**
             * Check for OR, AND
             */
            if(!!query.AND || !!query.OR)
              {
                /**
                 * Checks and prepares AND/OR blocks.
                 */
                var f = function(a)
                  {
                    var t;
                    for(var aa=0; aa < a.length; aa++)
                      {
                        /**
                         * This is the second term.
                         */
                        t = a[aa][1];
                        
                        if(t.charAt(0) == ':')
                          {
                            /**
                             * If 2nd term has been flagged as a field (:), add
                             * [3] index to comparison object. This is checked in
                             * #_searchRecords#cmp. Also, lose `:` prefix.
                             */
                            a[aa][1] = t.substring(1,t.length);
                            a[aa][3] = true;
                          }  
                      }
                  }
                
                /**
                 * Notify is 2nd term is a field or a value.  Do this
                 * by setting the .field property.
                 */
                var a = query.AND || [];
                var b = query.OR || [];
                
                f(query.AND || []);
                f(query.OR  || []);
                  
                return query  
              } 
            else
              {
                return false;
              }
          }
        return false;
      };
      	
		/*
		 * Private.
		 * Returns a sorting function (to be used by Array.sort)
		 * See this.sort() for details.
		 */
		this._sorter = function()
			{
				var a			= arguments || [];
				var f 		= 'return ';
				var ad;

				if(a.length==1 && (typeof a[0] == 'object')) 
				  {
				  	var o = a[0];
				  }
				else
					{
						return false;
					}

				for(var k in o)
					{
						ad	=		o[k] ? ['<','>'] : ['>','<'];
						f		+=	'a.' + k + ad[0] + 'b.' + k + '?-1:a.' + k + ad[1] + 'b.' + k + '?1:';
					}

				return new Function('a','b',f+'0');
			};  
			
		/*
		 * Private. Takes a parsed query (see _parseQuery) and fetch records
		 * matching.  It is up to you make sure that the passed query has 
		 * been properly parsed.  Used by various methods.
		 * @param		{Object} 	- q - The parsed query
		 * @return	{Array}		- An array of result records
		 */
		this._searchRecords = function(q)
		  {
		  	var records 	= this.getRecords();
		  	var rc				= this.recordCount();
		  	var fields		= this.getFields();
		  	var AA				= q.AND || [];
		  	var OA				= q.OR || [];
		  	var STRICT    = (q.STRICT === undefined) ? false : !!q.STRICT;
        var results   = []; 
        
        /**
         * NOTE: `cr` variable enclosed by cmp() function, below
         */
        var cr, andHit, orHit, opIdx, T1, T2, comp, $T1, $T2;
        
        /**
         * The comparison function which matches conditions in AND/OR groups, 
         * returning Boolean indicating whether group indicates match or not.
         */
        var cmp = function(opArr, andor)
          {
            var cands   = [];
            var isAND   = andor || false;
            var cc      = opArr.length;
            var B       = false;
            
            while(cc--)
              {
                /**
                 * opIdx[0] = first term;
                 * opIdx[1] = second term;
                 * opIdx[2] = comparison operator.
                 * opIdx[3] = flag that second term is a field name.
                 *
                 * @see _parseQuery
                 */
                opIdx     = opArr[cc];
		        		$T1		    = cr[opIdx[0]];                         
		        		$T2		    = opIdx[3] ? cr[opIdx[1]] : opIdx[1];   

                /**
                 * Comparisons.  Two groups: a comparison of two fields, or a comparison
                 * of a field value to another value.  Field value comparisons are
                 * done first.  The operators are:
                 *
                 * ==   true if field equal to sent value;
                 * ===  true if field strictly equal to sent value;
                 * >    true if field greater than sent value;
                 * <    true if field less than sent value;
                 * >=   true if field greater than or equal to sent value;
                 * <=   true if field less than or equal to sent value;
                 * !=   true if field not equal to sent value;
                 * !==  true if field strictly not equal to sent value;
                 * =~   true if field value matches sent value, which is a Regex;
                 * !~   true if field value does not match sent value, which is a Regex;
                 */
                 
                switch(opIdx[2])
                  {
                	  case '==':
                	    B = ($T1 == $T2); 
                		break;
                				
                	  case '===':
                	    B = ($T1 === $T2);
                		break;
                				
                	  case '>':
                	    B = ($T1 > $T2);
                		break;
                				
                	  case '<':
                	    B = ($T1 < $T2); 
                		break;
                				
                	  case '>=':
                	    B = ($T1 >= $T2); 
                		break;
                				
                	  case '<=':
                	    B = ($T1 <= $T2);
                		break;	
                				
                	  case '!=':
                	    B = ($T1 != $T2); 
                		break;
                				
                	  case '!==':
                	    B = ($T1 !== $T2); 
                		break;
                				
                	  case '=~': 
                			B = (AXIS.isRegExp($T2) && ($T1.match($T2) !== null)); 
                		break;
                		
                	  case '!~': 
                			B = (AXIS.isRegExp($T2) && ($T1.match($T2) === null)); 
                		break;
                		
                		default:
                		  B = false;
                		break;
                  } 

                if(B)
                  {
                    /**
                     * True. There was a match.
                     *
                     * If an OR loop, store it and return (just need to hit once).
                     */
                    if(isAND === false) 
                      {
                        return true;    
                      }
                      
                    /**
                     * A hit on an AND lets the loop continue, and if we run through
                     * all ANDs without failing, it is a full match (see below)
                     */
                  }
                  
                /**
                 * False. Failed to match.
                 * 
                 * If in an AND loop, any miss kills the checking.  Return false.
                 */
                else if(isAND)
                  {
                    return false;
                  }
		          }	
		          
		        /**
		         * Two ways to get here: an AND that hit on all matches, or an
		         * OR that didn't hit; match true, in the first, false in second.
		         */
		        return isAND ? true : false;
          }

        /**
         * Run through each record, and run comparison.
         */
        while(rc--)
          {
            /**
             * NOTE: there is a closure around this var (`cr`) in cmp() function.
             */
          	cr = records[rc];

            /**
             * The interface allows the optional setting of AND / OR.  If sent, we
             * get a proper match value.  What if one is not sent? In STRICT mode
             * we want to be sure that the STRICT match doesn't fail because of the
             * unsent value is 'false' -- so we set any unsent to 'true'.  In the case 
             * where we don't want STRICT, we don't want the match to succeed because
             * an unsent value is set to 'true'; so we set it to 'false' in that case.
             */
          	andHit  = AA.length > 0 ? cmp(AA, true) : (STRICT) ? true : false;
            orHit   = OA.length > 0 ? cmp(OA) : (STRICT) ? true : false;
            
            /**
             * STRICT true  == both AND & OR must hit;
             * STRICT false == either AND | OR must hit.
             */
            if(STRICT)
              {
                if(andHit && orHit)
                  {
                    results.unshift(cr);  
                  }
              }
            else if(andHit || orHit)
              {
                results.unshift(cr);  
              }
          }

        return results;
		  };
		  
		/**
		 * Whenever a delete or insert or sort occurs, we need to reindex the records (as 
		 * the splicing/inserting/sorting will corrupt the internal __id__ values of other records).
		 *
		 * @private
		 */
		this._reindex = function()
		  {
		  	var rL = this.recordCount();
		  	while(rL--)
		  	  {
		  	  	this._records[rL].__id__ = rL;
		  	  }
		  };
      
    /**************************************************
     *   
     * TABLE 
     *
     * Table Object constructor, called by .createTable().
     *
     */
    this.Table = function(t)
      { 
      	try
      	  {
      	  	this.name 					= t.name;
      	  	this.primary				= t.primary; 
      	  	this.autoinc				= t.autoinc;
      	  	this.fields					= [];
      	  	this._records  			= [];
      	  	this.currentInc			= 0;

            /*
             * Add fields.  If the user sends a predefined regex {@link AXIS#Regexes} key,
             * assign the relevant regex.  If a regex object is sent, that is used.  If
             * no regex is sent, .varchar regex is used.
             * 
             */
      	  	var fl = t.fields.length;   	  	
      	  	for(var i=0; i < fl; i++)
							{
      	  	  	this._pushFieldObject(t.fields[i]);
      	  	  }
      	  	  
      	  	/*
      	  	 * Add primary field (as first field)
      	  	 */
      	  	this.fields.unshift({
      	  		name:		this.primary,
      	  		regex:	(this.primary == 'id') ? AXIS.Regexes.integer : AXIS.Regexes.varchar
      	  	});
      	  	
      	  	/*
      	  	 * If the primary is `id`, this will ALWAYS be an
      	  	 * autoincrement field
      	  	 */
      	  	if(this.primary == 'id')
      	  	  {
            		this.autoinc = true;
            	}
            	
      	  	t = null;
      	  }
      	catch(e)
      	  {
      	  	return false;
      	  }
      	  
      	/*
      	 * Adds a record to the table.  Requires an object with properties matching
      	 * EACH field.  Any regexes existing for the field names will execute.  If
      	 * there is a field mismatch or failure at any regex the entire record is
      	 * rejected.  Also will handle autoincrement.
      	 * NOTE: The order of insert is not a reliable indication of record index.
      	 * NOTE: You MUST send a complete record, with each field defined.
      	 *
      	 * To insert multiple records, simple set `record` to an array containing records.
      	 *
      	 * @param 	{Mixed} rec - In form:
      	 *																{
      	 *																	field: 'value',
      	 *																	field: 'value',
      	 *																	etc
      	 *																}
         *                        NOTE: You may send a single record object, instead of an Array.
      	 * @param		{Number} [ind] - Inserts at given index
      	 * @return {Boolean}	true on success, false on failure 
      	 */
      	this.insertRecord = function(rec,ind)
      	  {
      	  	try
      	  	  {
      	  			var useIndex 	= ind || false;
            		var group			= AXIS.isArray(rec) ? rec : [rec]; 
		      	  	var flds 			= this.getFields();
		      	  	var fcnt 			= this.fieldCount();
		      	  	var nm, rx, record, inR, fOff;

		      	  	for(var ri=0; ri < group.length; ri++)
		      	  		{
		      	  			inR 		= []
		      	  			record 	= group[ri];
		      	  			fOff 		= 0;
		      	  			
		      	  			/*
		      	  			 * Record must be a proper object definition
		      	  			 */
		      	  			if(AXIS.isObject(record) === false)
		      	  			  {
		      	  			  	throw new AXIS.Errors.DataInsertRecordException('Data_INSERT_REC_NOT_OBJ');
		      	  			  }

				      	    /*
				      	     * If this table is autoincrementing, handle that now -- the 
				      	     * sent record is not expected to send a value for an autoincrementing
				      	     * field, and any value sent will be ignored.  
				      	     * If this is NOT an autoinc, then we will have to check
				      	     * the entire record. Mainly, we are updating an autoincrementing field
				      	     * if we need to, and skipping over the field check below; if not auto, then
				      	     * we will need to check ALL fields.  The var `fOff` is set here, used below. 
				      	     */
				      	    if(this.autoincrements())
				      	      {
				      	      	/*
				      	      	 * Increment internal value, and add value to 
				      	      	 * zero(0) field of record
				      	      	 */
				      	        
				      	        this.currentInc++;
				      	      	inR[0] = this.currentIncrement();
				      	      	fOff = 1;
				      	      }
		
				      	  	/*
				      	  	 * Ensure integrity of record, and check regexes.
				      	  	 */
				      	  	for(var x=fOff; x < fcnt; x++)
				      	  	  {
				      	  	  	nm = flds[x].name;
				      	  	  	rx = flds[x].regex;
				      	  	  	
		//console.log(rx + ' - ' + nm + ' - ' + record[nm] + ' - ' + rx.test(record[nm]));
		
				      	  	  	if(record[nm] && (rx.test(record[nm]) !== false))
				      	  	  	  {
				      	  	  	  	inR[nm] = record[nm];
				      	  	  	  }
				      	  	  	else
				      	  	  		{	
				      	  	  		  throw new AXIS.Errors.DataInsertRecordException('Data_INSERT_REC_MALFORMED');
				      	  	  		}
				      	  	  }
				      	  	/*
				      	  	 * Will store the original value of the fields of records
				      	  	 * which are modified.  See updateRecord()
				      	  	 */
				      	  	inR.__modified__ = false; 
				      	  	 
				      	  	if(useIndex)
				      	  	  {
    				      	  	/**
    				      	  	 * Asked to insert at a specific index. Check index range,
    				      	  	 * and perform reindexing to set proper __id__ for new record.
    				      	  	 */
				      	  	  	if(useIndex >= 0 && useIndex < this.recordCount())
				      	  	  	  {
				      	  		  		this._records.splice(useIndex,0,inR);
						      	  		  this._reindex();  		  		
				      	  		  	}
				      	  		  else
				      	  		  	{
				      	  		  		throw new AXIS.Errors.DataInsertRecordException('Data_INDEX_OUT_OF_RANGE');
				      	  		  	}
				      	  		}
				      	    else
				      	    	{
				      	    		inR.__id__ = this.recordCount();
				      	    		
				      	    		this._records.push(inR);
				      	    	}
									}
				      	return true;  	  	
		      	  }
		      	catch(e)
		      	  {
		      	  	e.report();
		      	  	
		      	  	return false;
		      	  }
      	  };
      	  
      	/*
      	 * Delete a record from the table. Can delete using conditionals, or a recordId
      	 * See ._search() for an explanation of a search argument.
      	 * A recordId is an integer indicating the row index of the record you want to delete.
      	 *
      	 * @param		{Mixed}	  info -  a search string or a search array or a record Id
      	 * @return	{Mixed}	- The removed record object (in case of a single delete),
      	 *										or a record collection (equiv. to a ._searchRecords query)
      	 */
      	this.deleteRecord = function(info)
      		{ 
      		  if(!!info === false)
      		    {
      		      return false;  
      		    }
      		    
      			var ret = {};
      			if(AXIS.isNumber(info))
      			  {
      			  	if(this._records[info])
      			  	  {
      			  	  	ret = this._records.splice(info,1);
      			  	  } 
      			  }
      			else 
      				{
      				  var ps = this._parseQuery(info);

      					if(ps)
      					  {
      					  	var dI = this._searchRecords(ps);
      					    var i = dI.length;
      					    
      					    while(i--)
      					      {
      					      	this._records.splice(dI[i].__id__,1);
      					      	/*
      					      	 * Since we've just deleted the record at this index, we must
      					      	 * remove the __id__ reference of the records in the return object,
      					      	 * to avoid any misunderstandings by code which might handle this response.
      					      	 */
      					        delete dI[i].__id__;
      					      }
      					    ret = dI;
      					  }
      					else
      						{
      							new AXIS.Errors.DataDeleteRecordException('Data_DELETE_RECORD_BAD_QUERY');
      							return false;
      						}
      				}

      			this._reindex();
						return ret;
      		};
      		
      	/**
      	 * Identify a record and change it's values
      	 * @param 	{Number}    id    The record Id
         * @param		{Object}    ob    The record object
      	 */
      	this.updateRecord  = function(id, ob)
      	  {
      	    try
      	      {
                if(!id || AXIS.isNumber(id) === false)
                  {
                    throw new AXIS.Errors.DataUpdateRecordException('Data_UPDATE_INDEX_MALFORMED');
                  } 
                if(!ob || AXIS.isObject(ob) === false)
                  {
                    throw new AXIS.Errors.DataUpdateRecordException('Data_UPDATE_OBJECT_MALFORMED');
                  } 
                
                var flds  = this.getFields();
                var rec   = this.getRecordById(id);
                var tmp   = [];
                var fld;
                
                /**
                 * Check if record exists at given id
                 */
                if(rec === false)
                  {
                    throw new AXIS.Errors.DataUpdateRecordException('Data_UPDATE_UNKNOWN_INDEX'); 
                  }
                
                /**
                 * Validate sent fields.  Note that if any field fails,
                 * no update is done.
                 */
    				    for(var f in ob)
    				      {
    				        fld = this.fieldExists(f);
    				      	if(fld && fld.obj.regex.test(ob[f]))
    				      	  {
    				      	    tmp[f] = ob[f];
    				      	  }
    				      	else
    				      	  {
    				      	    throw new AXIS.Errors.DataUpdateRecordException('Data_UPDATE_FIELD_ERROR'); 
    				      	  }
    				      }
    				    
    				    /**
    				     * Now merge changed properties into real record.
    				     */
    				    for(var m in tmp)
    				      {
    				        this._records[id][m] = tmp[m];
    				      }
    				    
    				    return this._records[id];
              }
            catch(e)
              {
                e.report();
                
                return false;
              }
      	  };
      		
        /**
         * Searches records and returns the result of _searchRecords();
         *
         * @param		{Array}   s     a search query
         * @return	{Array}	  a     result record
         */
        this.search = function(s)
          {
            if(!!s === false)
              {
                return false;  
              }
              
            var ps = this._parseQuery(s);
              
      			if(ps)
      			  {
      			  	return this._searchRecords(ps);
      			  }
      			else
      				{
      					new AXIS.Errors.DataSearchException('Data_TSEARCH_BAD_QUERY');
      				}
          };
          
      	/*
      	 * @param		{Number}	id - The recordId 
      	 * @return	{Object} - the record, or false
      	 */
      	this.getRecordById = function(id)
      	  {
      	  	return this._records[id] || false;
      	  };
          
      	/*
      	 * @return	{Array} - the complete set of records for this table
      	 */
      	this.getRecords = function()
      	  {
      	  	return this._records.slice(0);
      	  };
      	 
      	/*
      	 * Applies a function to each record.  This is a *permanent* change -- the
      	 * internal ._records array is irrevocably altered.  There is no rollback.
      	 * NOTE: The passed function is called in the scope of the record, so
      	 * table.map(function() { this.field = 20 }) would change the `field` value
      	 * of each record to `20`.
      	 */
      	this.map = function(func)
      	  {
      	    if(AXIS.isFunction(func))
      	      {
          	    var rec = this._records;
          	    var len = rec.length;
    
                while(--len >= 0)
                  {
                    func.call(rec[len], len, rec);
                  }
              }
            return null;
      	  }; 
      	  
      	this.reduce = function(func, acc)
      	  {
      	    if(AXIS.isFunction(func) && (typeof acc != 'undefined'))
      	      {
          	    var rec = this._records;
          	    var len = rec.length;
          	    var i = 0;
                
                do
                  {
                    acc = func.call(acc, rec[i], i, rec);
                  }
                while(++i < len);
                
                return acc;
              };
            return null;
      	  };
      	  
      	this.reduceRight = function(func, acc)
      	  {
      	    if(AXIS.isFunction(func) && (typeof acc != 'undefined'))
      	      {
          	    var rec = this._records;
          	    var len = rec.length;

                while(--len >= 0)
                  {
                    acc = func.call(acc, rec[len], len, rec);
                  }

                return acc;
              };
            return null;
      	  };
      	 
      	/*
      	 * Add a field to the table.
      	 * @param 	{Object} fieldOb - In format: {
      	 *																				name: the field name,
      	 *																				regex: the field regex
      	 *																			}
      	 * @return 	{Bool}	true on success, false on failure.
      	 *
      	 * NOTE: - the primary cannot be added, or changed after instantiation.
      	 *       - the value of new field in existing records will be null.
      	 *       - if passed an existing field name
      	 */
      	this.addField = function(fieldOb)
      	  {     
      	    var r = fieldOb || {};
      	    var nm = r.name;
      	         	  	  	
      	  	if(nm)
      	  	  { 
      	  	  	if(this.fieldExists(nm))
      	  	  	  {	
      	  	    		new AXIS.Errors.DataAddFieldException('Data_ADD_FIELD_EXISTS');
      	  	    		return false;
      	  	  	  }      	  	  	  

								this._pushFieldObject(r);

      	  	  	/*
      	  	  	 * We have a new field now, and there is likely more than zero
      	  	  	 * rows; set field in all rows to null value
      	  	  	 */
      	  	  	var r = this.getRecords();
      	  	    var i = this.recordCount();

      	  	    while(i--)
      	  	      {
      	  	      	r[i][nm] = null;
      	  	      }

      	  	    return true;
      	  	  }
      	  	else
      	  	  {
		      	  	new AXIS.Errors.DataAddFieldException('Data_ADD_FIELD_NO_NAME');    	  	  	
      	  	  	return false;
      	  	  }
      	  };
      	
      	/*
      	 * Deletes a field by name.  
      	 * @param 	{String}	- field - The field name
      	 * @return	{Mixed}		- An array containing all removed values (the entire 
      	 * 											field column for all records, in row order), or false.
      	 */
      	this.deleteField = function(field)
      	  {
      	  	try
      	  	  {
      	  	  	var fn = this.fieldExists(field);
		      	  	if(fn === false)
		      	  	  {
		      	  	  	throw new AXIS.Errors.DataDeleteFieldException('Data_DELETE_UNKNOWN_FIELD');
		      	  	  }

		      	  	var fieldIdx	= fn.idx;
		      	  	var fieldName = fn.obj.name;
		      	  	
		      	  	/*
		      	  	 * Remove the field, and create an array with all
		      	  	 * removed record values.
		      	  	 */
		      	  	this.fields.splice(fieldIdx,1);
		      	  	
								var remRecords 	= [];
								var allRecords 	= this.getRecords();
		      	  	var rc				 	= this.recordCount();
		      	  	
		      	  	while(rc--)
		      	  	  {
		      	  	  	remRecords[rc] = allRecords[rc][fieldName];
		      	  	  	delete allRecords[rc][fieldName];
		      	  	  } 
		      	  	
		      	  	return remRecords;
      	  		}
      	  	catch(e)
      	  	  {
		      	  	e.report();
		      	  	     	  	  	
      	  	  	return false;
      	  	  }
      	  };
      	  
      	/*
      	 * Check if a field is defined for this table
      	 * @param		{String} - fname - The name of the field to search for
      	 * @return	{Mixed}	- false if not found, an array containing field info if found.
      	 */
      	this.fieldExists = function(fname)
          {
          	var f = this.fieldCount();
          	while(f--)
          		{
          			if(this.fields[f].name == fname)
          			  {
          			  	return {
          			  	  idx: f,
          			  	  obj: this.fields[f]
          			  	};
          			  }
          		}
          	return false;
          };
          
      	/*
      	 * Returns an array of field objects for this table
      	 * NOTE: the [0] indexed field object in this array is the primary
      	 * @return {Array}
      	 */
      	this.getFields = function()
      	  {
      	  	return this.fields.slice(0);
      	  };  
      	  
      	/*
      	 * Returns a count of # of fields (including primary)
      	 * @return {Number}
      	 */
      	this.fieldCount = function()
      	  {
      	  	return this.fields.length;
      	  };
      	  
      	/*
      	 * Returns a count of # of rows 
      	 * @return {Number}
      	 */
      	this.recordCount = function()
      	  {
      	  	return this._records.length;
      	  };
      	  
      	/*
      	 * Returns the current increment position.  NOTE: if the primary
      	 * isn't an integer, or the table doesn't autoincrement, this 
      	 * will still return zero(0).
      	 * @return {Number}
      	 */
      	this.currentIncrement = function()
      	  {
      	  	return this.currentInc;
      	  };
      	  
      	/*
      	 * Returns booean indicating whether this is an autoincrementing table
      	 * @return {Boolean}
      	 */
      	this.autoincrements = function()
      	  {
      	  	return this.autoinc;
      	  };
      	  
				/*
				 * Perform a sort of a records array (See ._searchRecords for an example
				 * of the type of array of objects this sort routine will work with).
				 * @param		{Array} 	- obArr - an array of objects
				 * @param		{Object}	- s - a search object
				 * @return 	{Array}		- the sorted array
				 *
				 * Structure of search objects:
				 *															{
				 *                                fieldName1: [1 || 0] (ie: [asc || desc])
				 *                                fieldName2: 1,
				 *                                fieldName3: 0,
				 *                                ...etc:
				 *															}
				 */
				this.sort = function(s)
				  {
				  	var so = this._sorter(s);
				  	
				  	/**
				  	 * Note that the .sort method here is the native Array .sort
				  	 */
						this._records.sort(so);

						this._reindex();
						return this._records;
				  };   
				  
				/**
				 * Save the current table.
				 */
				this.saveFile = function(url)
				  {
				    var flds = this.getFields();
				    var recs = this.getRecords();
				    var f = {};
				    var r = {};
				    var s = {};

            /**
             * Need to do some prepping for JSON
             */
            for(var x=0; x < flds.length; x++)
              {
                f[x] = {
                  name:   flds[x].name,
                  regex:  flds[x].regex.toString()
                };
              } 
             
            for(var x=0; x < recs.length; x++)
              {
                r[x] = {};
                for(var p in recs[x])
                  {
                    r[x][p] = recs[x][p];  
                  }  
              }
            
				    if(AXIS.Store)
				      {
				        if(url && AXIS.isString(url))
				          {
				            s.url = url;
				            s.overwrite = 'T';
				            s.content = JSON.stringify({
				              fields:   f,
				              records:  r
				            });

				            return AXIS.Store.update(s);
				          }
				      }  
				    return null;
				  };
			  
			  /**
			   * Load a table.
			   */
				this.loadFile = function(url)   	 
				  {
				    var b = {};
				    
				    if(AXIS.Store)
				      {
				        if(url && AXIS.isString(url))
				          {
				            b.url = url;
				            
    				        var r = AXIS.Store.read(b);
    				        
    				        if(r !== null)
    				          {
//    				            console.log(eval('(' + r + ')'));  
    				          }
    				      }
				      }  
				    return null;
				  };
				  
				this.deleteFile = function(b)
				  {
				    if(AXIS.Store)
				      {
				        
				      }  
				  }; 
      };

// End Table



    
    /*
     * Creates a table in memory.
     * @param 	{Object} def - The table definition
     * @return	{Object} - the table
     * 
     * The definition(object) is structured:
     *
     * {
     *		name 			{String}	: The table name
     *		[primary]	{String}	: The primary key field. If not set, will default to `id`
     *													(There must ALWAYS be a primary key). If the primary is sent
     * 													specified in this call as `id`, it will ALWAYS be an integer,
     *													regardless of what .regex is or is not set to.  NOTE: This field
     *													can only contain unique values -- this is strictly enforced.
     *    [autoinc]	{Boolean}	: Whether primary autoincrements. Defaults to false.
     *   	[fields]	{Array}		: Any additional fields (optional)
     *													[
     *														{
     *															name 			{String} 	: name of field
     *															[regex]		{String}	:	if strict control of field length, 
     *																										content, etc, is desired.
     *														}
     *													]
     *														NOTE: field ordering will follow the array order
     * }
     */
    this.createTable = function(ob)
      {
        var r     = ob || {};
        var nm    = r.name;

      	if(nm === undefined) 
      	  {
      	    new AXIS.Errors.DataCreateTableException('Data_TABLE_NO_NAME');
      	    return false;
      	  }
      	
      	if(AXIS.Regexes.DBFieldName.test(nm) === false)
      	  {
      	    new AXIS.Errors.DataCreateTableException('Data_TABLE_BAD_NAME');
      	    return false;
      	  }
      	
        var table = 
        	{
        		name:				nm,
        		primary:		r.primary || 'id',
        		autoinc:	  !!r.autoinc,
        		fields:			r.fields || [],
        		manifest:   r.manifest || {}
        	};
        
        this.Table.prototype = this;
        table = new this.Table(table);

        if(this._attachTable(table))
          {	
          	return table;
          }
        else
        	{
        		new AXIS.Errors.DataCreateTableException('Data_TABLE_ATTACH_FAIL');
        		return false;
        	}
      };
      
    /*
     * Get a reference to a Table object.
     * @param		{String} table - the name of the table
     * @return	{Object}
		 */
		this.getTable = function(table)
		  {
		  	return this.tables[table] || false;
		  };	
  };
  



























      		
/*********************************************************************************
*** EXAMPLES *********************************************************************


var people = [];
people.push( { name:'Bob' , age:15 , sex:'M' } );
people.push( { name:'Carol' , age:18 , sex:'F' } );
people.push( { name:'Sue' , age:33 , sex:'F' } );
people.push( { name:'Angie' , age:8 , sex:'F' } );
people.push( { name:'David' , age:12 , sex:'M' } );

var sortByName = AXIS.Data.sortBy({sex:1,name:1,age:1});
people.sort( sortByName );
    
people.foreach(function(){
	var a = arguments[0];
	var t = '';
	for(var p in a)
	  {
	  	t += p + ': ' + a[p] + '\n';
	  }
	return t;
});

alert(people);


var people = [];
people.push( { name:'Bob' , age:15 , sex:'M' } );
people.push( { name:'Carol' , age:18 , sex:'F' } );
people.push( { name:'Sue' , age:33 , sex:'F' } );
people.push( { name:'Angie' , age:8 , sex:'F' } );
people.push( { name:'David' , age:12 , sex:'M' } );


var sortByName = SortBy('name');
people.sort( sortByName );

 people is now:
 [
   {name:'Angie',age:8,sex:'F'},
   {name:'Bob',age:15,sex:'M'},
   {name:'Carol',age:18,sex:'F'},
   {name:'David',age:12,sex:'M'},
   {name:'Sue',age:33,sex:'F'}
 ]

var sortBySexThenAge = SortBy('sex','age');
people.sort( sortBySexThenAge );

 people is now:
 [
   {name:'Angie',age:8,sex:'F'},
   {name:'Carol',age:18,sex:'F'},
   {name:'Sue',age:33,sex:'F'},
   {name:'David',age:12,sex:'M'},
   {name:'Bob',age:15,sex:'M'}
 ]


people.sort( SortBy({sex:0,name:0}) );

 people is now:
 [
   {name:'David',age:12,sex:'M'},
   {name:'Bob',age:15,sex:'M'},
   {name:'Sue',age:33,sex:'F'},
   {name:'Carol',age:18,sex:'F'},
   {name:'Angie',age:8,sex:'F'}
 ]

people.sort( SortBy({name:0}) );

 people is now:
 [
   {name:'Sue',age:33,sex:'F'},
   {name:'David',age:12,sex:'M'},
   {name:'Carol',age:18,sex:'F'},
   {name:'Bob',age:15,sex:'M'},
   {name:'Angie',age:8,sex:'F'}
 ]
 
 		var tab = AXIS.Data.createTable({
			name: 'testTable',
			primary: 'first',
			fields: [{name: 'one'},{name:'two'},{name:'three', regex:'integer'},{name:'four', regex:'integer'}],
			manifest: {
			            class:          'DAV-RESPONSE',
			            constructedBy:  'AXIS#functionName',
			            href:           'http://sandro.sandro-dav.limewire.com:8080',
			            displayName:    'sandro'
			          }
		});
		

    tab.insertRecord([{
    	first: 'a0',
    	one: 'a1',
    	two: 'a2',
    	three: 5,
    	four: 5
    },
    {
    	first: 'b0',
    	one: 'b1',
    	two: 'b2',
    	three: 6,
    	four:  7
    },
    {
    	first: 'c0',
    	one: 'c1',
    	two: 'c2',
    	three: 4,
    	four: 4
    }]);
    
    tab.insertRecord({
    	first: 'x0',
    	one: 'x1',
    	two: 'x2',
    	three: 4,
    	four: 4
    },2);
    
    tab.addField({name: 'newfield',regex: 'varchar'});
    
    tab.sort({three:1,first:1});
    var nr = AXIS.Prototypes.extend(tab.getRecords());
    nr.stringify();
    alert(nr);
    
    var st = 'one:c1&two:c2|four>three|three>four';
    
  // alert(tab.deleteField('one'));
   var records = AXIS.Prototypes.extend(tab.getRecords()); 
   records.stringify();
  // alert(records);
   tab.deleteRecord(1);
   var records = AXIS.Prototypes.extend(tab.getRecords()); 
   records.stringify();
  // alert(records);
  
		var flds = AXIS.Prototypes.extend(tab.getFields());
    flds.stringify();
	//	alert(flds);
   
		var srch = tab.search(st);
		AXIS.Prototypes.extend(srch);
		srch.stringify();
	//	alert(srch);
		
    //var ak = 'This is now a very very long string with soososoossosososososososlooongworororrrds and others things like that';
    //AXIS.Prototypes.extend(ak);
    //alert(ak.wrap(10,'\n'));
   
		//var q = tab.deleteRecord(st);
	  
	   //alert(tab.deleteRecord(1));

		//q.OR.stringify();
		//q.AND.stringify();
		
		//alert(q.AND);
		//alert(q.OR);   

			*/