        getFolder: function(url) {
          return url.replace(/\/[^\/]*$/,'/');
        },

        getParent: function(url) {
            return url.replace(/\/[^\/]*\/?$/, '/');
        },