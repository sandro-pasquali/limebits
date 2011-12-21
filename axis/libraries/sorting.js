/*
	var list = new Array(3,7,4,12,2,44,3)
	message(list);
	selectionSort(list)
	message(' --> ' + list);
*/
AXIS.extend({
  name:       'selectionSort', 
  expects:    'Array',
  func:       function()
    {
  	  var i, minimum, tmp;
  	  for (i=0; i<this.length-1; i++) 
  	    {
  	      minimum = i;
  	      for(var j = i+1; j < this.length; j++) 
  	        {
  	          if(this[j] < this[minimum]) minimum = j;
  	        }
  	      tmp = this[i];
  	      this[i] = this[minimum];
  	      this[minimum] = tmp;
  	    }
  	}
});
	   

	    
/*
	var list = new Array(3,7,4,12,2,44,3)
	message(list);
	bubbleSort(list)
	message(' --> ' + list);
*/
AXIS.extend({
  name:       'bubbleSort',
  expects:    'Array',
  func:       function()
    {
  	  var i,hasSwapped = true //reset flag
  	  while (hasSwapped)
    	  {
    	    hasSwapped=false
    	    for(i=0;i<this.length-1;i++)
            {
      	      if(this[i] > this[i+1])
        	      { //wrong order?
        	        // exchange them
        	        var tmp=this[i]; this[i]=this[i+1]; this[i+1]=tmp;
        	        hasSwapped = true //we have swapped
        	      }
      	    }
    	  }
  	}
});

/*
	var list = new Array(3,7,4,12,2,44,3)
	message(list)
	heapSort(list)
	message(' --> ' + list)
*/
AXIS.extend({
  name:       'heapSort', 
  expects:    'Array',
  func:       function()
    {
      var T = this;
      
  	  var swap = function(pos1,pos2)
  	    {
  	      var tmp = T[pos1]
  	      T[pos1] = T[pos2]
  	      T[pos2] = tmp
  	    };
  	    
  	  var leftChild = function(i)
  	    {
  	      return 2*i + 1
  	    };
  	    
  	  var rightChild = function(i)
  	    {
  	      return 2*i + 2
  	    };
  	    
  	  var maxHeapify = function(i)
    	  {
    	    var largest;
    	    var left = leftChild(i);
    	    var right = rightChild(i);
    	    if(left <= heapSize && T[left] > T[i])
    	      {
    	        largest = left;
    	      } 
    	    else 
    	      {
    	        largest = i;
    	      }
    	      
    	    if(right <= heapSize && T[right] > T[largest]) 
    	      {
    	        largest = right;
    	      }
          
          if(largest != i)
            {
    	        swap(i,largest)
    	        maxHeapify(largest)
    	      }
    	  };
      
  	  var buildMaxHeap = function()
  	    {
  	      heapSize = T.length - 1;
  	      var i;
  	      var mid = Math.floor(heapSize/2);
  	      for(i = mid; i >= 0; i--) 
  	        {
  	          maxHeapify(i);
  	        }
  	    };
      
      
  	  buildMaxHeap();
  	  var i
  	  for(i = T.length - 1; i > 0; i--)
    	  {
    	    swap(0,i);
    	    heapSize -= 1;
    	    maxHeapify(0);
    	  }
  	}
});
	   
/*
	var list = new Array(3,7,4,12,2,44,3)
	message(list);
	insertionSort(list)
	message(' --> ' + list);
*/
AXIS.extend({
  name:       'insertionSort', 
  expects:    'Array',
  func:       function() 
    {
      var T = this;
    
      var insert = function(i)
        { //Insert arr[i] into the sublist
          var j,v = T[i]
          for(j=i-1; j>=0; j--) 
            {
              if(T[j] <= v) 
                {
                  break;
                }
              T[j+1] = T[j];
            }
          T[j+1] = v;
        }
        
      var i = 1;
      while (i<T.length) 
        {
          insert(i);
          i=i+1
        }
    }
});
  

/*
	var list = new Array(3,7,4,12,2,44,3)
	message(list);
	quickSort(list)
	message(' --> ' + list);
	*/
AXIS.extend({
  name:       'quickSort', 
  expects:    'Array',
  func:       function()
    {  
  	  var T = this;
  	  
      var q_sort = function(left, right)
        {
  	      var l_hold = left;
  	      var r_hold = right;
  	      var pivot = T[left];
          while(left < right) 
  	        {
  	          while((T[right]>=pivot) && (left<right)) 
  	            {
  	              right--;
  	            }
  	            
  	          if(left != right)
  	            {
  	              T[left] = T[right];
  	              left++;
  	            }
  	            
  	          while((T[left]<=pivot) && (left<right)) 
  	            {
  	              left++;
  	            }
  	            
  	          if(left != right) 
  	            {
  	              T[right] = T[left];
  	              right--;
  	            }
  	        }
          
          T[left] = pivot;
  	      pivot = left;
  	      left = l_hold;
  	      right = r_hold;
  	      
  	      if(left < pivot)
  	        {
  	          q_sort(T, left, pivot-1);
  	        }
  	        
  	      if(right > pivot) 
  	        {
  	          q_sort(T, pivot+1, right);
  	        }
  	    }
  	  
      q_sort(T, 0, T.length - 1);
    }
});
  

/*
	var list = new Array(3,7,4,12,2,44,3)
	message(list);
	mergeSort(list)
	message(' --> ' + list);
*/

AXIS.extend({
  name:       'mergeSort', 
  expects:    'Array',
  func:       function()
    {
      var T = this;
    
      var swap = function(i,j)
        {
          var tmp   = T[i]; 
          T[i]      = T[j]; 
          T[j]      = tmp;
        };
       
      var insert = function(begin, end, v)
        {
          while(begin+1<end && T[begin+1]<v) 
            {
              swap(begin, begin+1);
              ++begin;
            }
          T[begin]=v;
        };
       
      var merge = function(begin, beginRight, end)
    	  {
          for(;begin<beginRight; ++begin)
            {
      	      if(T[begin] > T[beginRight]) 
      	        {
      	          var v = T[begin];
      	          T[begin] = T[beginRight];
      	          insert(beginRight, end, v);
      	        }
      	    }
    	  };
    	  
      var msort = function(begin, end)
        {
          var size=end-begin;
          if(size<2) 
            {
              return;
            }
          var beginRight=begin+Math.floor(size/2);
          msort(begin, beginRight);
          msort(beginRight, end);
          merge(begin, beginRight, end);
        }
       
      msort(T, 0, T.length);
    }
});
	   
/*
	var list = new Array(3,7,4,12,2,44,3)
	message(list)
	countingSort(list,100) // Assumes the largest number<100
	message(' --> ' + list)
*/

AXIS.extend({
  name:       'countingSort',
  expects:    'Array',
  func:       function(max)
    {
      var i,k
  	  var A=new Array(max);
  	  for(i=0;i<max;i++)
  	    {
  	      A[i]=0
  	    }
  	  
  	  for(i=0;i<this.length;i++)
  	    {
  	      A[this[i]]++
  	    }
  	  
  	  i=0;
  	  for(k=0;k<max;k++)
  	    {
  	      while (A[k]-- > 0)
  	        {
  	          this[i++]=k;
  	        }
  	    }
  	}
});
	   

	    