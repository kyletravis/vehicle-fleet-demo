function collectPages(url, collector, callback, errorCallback, page) {
	var header = $("meta[name='_csrf_header']").attr("content");
	var token = $("meta[name='_csrf']").attr("content");
	
	page = page ? page : 0;
	
	$.ajax({
		beforeSend: function(xhrObj){
			xhrObj.setRequestHeader("Content-Type","application/json");
	        xhrObj.setRequestHeader(header, token);
	    },
	    crossDomain: 'true',
	    url: url + '?page=' + page + '&size=1000',
	    success: function(result) {
	    	console.log("Loaded page: " + page + " from " + url);
	    	collector(result._embedded);
	    	if (result.page && typeof result.page.totalPages === 'number' && page < result.page.totalPages-1) {
	    		collectPages(url, collector, callback, errorCallback, page+1);
	    	} else if (result._links && result._links.next) {
	    		collectPages(url, collector, callback, errorCallback, page+1);	    		
	    	} else {
	    		callback()
	    	}
	    },
	    error: function(xhr, error){
	    	callback();
	    	if (errorCallback && errorCallback.call) {
	    		errorCallback();
	    	}
	    },
	    dataType: 'json'
	});
}