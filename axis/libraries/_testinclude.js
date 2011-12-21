(function(){

var f = function() {
  AXIS.register('Modules');
  AXIS.Modules.load({
   	provider: 'local',
   	module:   'Docs',
   	options:  {
   	            rootPath: '../../',
   	            groupURI: 'http://groups.google.com/group/limebits/post'
   	          }
  });
} 
  
if(AXIS.register('Modules') === null)
  {
    AXIS.includeScript({
      src: '/!lime/root/library/limebits/latest/axis/Modules.js', 
      onload: f
    });
  }
else
  {
    f();  
  }

})()
            