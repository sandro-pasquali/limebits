$AXIS.Modules.yahoo.TestSuite.__init = function(ops)
  {      
    /**
     * Now create and return the API for adding/running tests.  This is a simple
     * interface to the YUI test suite.  It mainly simplifies the scaffolding,
     * while allowing the developer to use the existing (and excellent!) YUI test
     * framework.
     *
     * @see  http://developer.yahoo.com/yui/yuitest/
     */
     
    /**
     * Check for output display size requests
     */
    var d = ops.display || {};
    if(d.width)
      {
        var w = AXIS.CSS.findRule('.yui-skin-sam .yui-log');
        w.style.width = d.width;
      }
    if(d.height)
      {
        var h = AXIS.CSS.findRule('.yui-skin-sam .yui-log .yui-log-bd');
        h.style.height = d.height;
      }     
    
    /**
     * Create output console
     */
    new YAHOO.tool.TestLogger(ops.outputTargetId || document.body);
    
    var TestSuite = function(tname) 
      {
        this.name     = tname || 'TEST';
        
        /** 
         * @see http://developer.yahoo.com/yui/yuitest/#assertions
         */
        this.Assert       = YAHOO.util.Assert;
        
        /** 
         * @see http://developer.yahoo.com/yui/yuitest/#useractions
         */
        this.UserAction   = YAHOO.util.UserAction;
        
        /** 
         * @see http://developer.yahoo.com/yui/yuitest/#running-tests
         */
        this.TestRunner   = YAHOO.tool.TestRunner;

        /**
         * @see http://developer.yahoo.com/yui/yuitest/#testsuites
         */
        this.Suite    = new YAHOO.tool.TestSuite(this.name);
        
        /**
         * @see http://developer.yahoo.com/yui/yuitest/#testcases
         */
        this.add      = function(tOb) 
          {
            var ts = new YAHOO.tool.TestCase(tOb);
            this.Suite.add(ts);
          };
      
        this.run      = function() 
          {
            this.TestRunner.add(this.Suite);
            this.TestRunner.run();
          };
      };

    return new TestSuite(d.suiteName || 'Test Suite');
  }