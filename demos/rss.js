/*	Simple Javascript RSS Reader Version 1.0
	Copyright (c) 2006 CS Truter
	Written by Christoff Truter
	email: Christoff@cstruter.com - (Please let me know if you intend to use the script) */

/* Replace all occurances of a string
  (Parameters) totalValue:'complete string' 
		oldValue:'value to be replaced' newValue:'value used for replace' */

function Replace(totalValue,oldValue,newValue)
{
	while(totalValue.indexOf(oldValue) > -1)
		totalValue=totalValue.replace(oldValue,newValue);
			return totalValue;
}

/* Get XML Node
   (Parameters) TagName:'XML Element' node:'Element row number' */

function getNode(TagName, node)
{
	var currentNode = (node == null) ? xmlDoc.getElementsByTagName(TagName) : 
					items[node].getElementsByTagName(TagName);
	if(currentNode.length > 0)
		return currentNode[0].firstChild.nodeValue;
}

/* Load XML Object
   (Parameters) rssFeed:'RSS File' Body:'Layer for RSS Body' Title:'Layer for RSS Title' */

function ReadRSS(rssFeed, Body, Title) 
{
	rssTitle = document.getElementById(Title);	
	rssBody = document.getElementById(Body);

	try
	{
		if (document.all)
		{
			var errorHappendHere = "Check Browser and security settings";
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		}
		else
		{
			var errorHappendHere = "Apparently one cant read remote xml via firefox, please copy the file to your server";
			xmlDoc = document.implementation.createDocument("","",null);
		}
	
		xmlDoc.async=false;
		xmlDoc.load(rssFeed);
	
		items=xmlDoc.getElementsByTagName('item');
		SetRSSTemplates();
	}
	
	catch(e)
	{
		rssTitle.innerHTML = 'Error occured';
		rssBody.innerHTML = 'Thrown Error:'+e.message+"<br/>Note: "+errorHappendHere;
	}
}

/* Set HTML Template
	Did it this way to make the look and feel of the feed easy customizable, dont like mixing
	layout with code. */

function SetRSSTemplates()
{
	if (rssBody)
	{
		var buffer = "";
		for(var i=0; i< items.length; i++) 
		{
			var output = (document.all) ? Replace(rssBody.innerHTML,"(::Link::)",getNode('link',i)) 
									   : Replace(rssBody.innerHTML,"%28::Link::%29",getNode('link',i));
			output = Replace(output,"(::Title::)",getNode('title',i));
			output = Replace(output,"(::Pubdate::)",getNode('pubDate',i));
			output = Replace(output,"(::Description::)",getNode('description',i));
			buffer+=output;
		}
		rssBody.innerHTML = buffer;
	}

	if (rssTitle)
	{
		var output = Replace(rssTitle.innerHTML,"(::Title::)",getNode('title'));
		output = (document.all) ? Replace(output,"(::Link::)",getNode('link'))
							   : Replace(output,"%28::Link::%29",getNode('link'));		
		output = Replace(output,"(::Description::)",getNode('description'));
		rssTitle.innerHTML = output;
	}
}
