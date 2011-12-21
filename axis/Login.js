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
 * @requires  WebDAV
 * @requires  Cookies
 * @requires  User
 */
function Login()
  {
    /**
     * @constructor
     */
    this.__construct = function()
      {
        this.forceLogin       = false;
        this.redirReturnTo    = window.location.href;
        this.authCookie       = false;
        this._authState       = null;
        this._loginFrameWindow = {};
        this._returnTo        = location.protocol + "//" + location.host + "/!lime/root/logout";
        this._baseHomePath    = "http://limebits.com/apps/finder/#folder=/home/";
        
        AXIS.Errors.registerCode('LB_LOGOUT_INVALID_SIGNOUT', "Couldn't log out of all domains");

        this.onAuthUpdate = AXIS.CustomEvent.create();
        
        this.beforeLogout = AXIS.CustomEvent.create();
        
        /*
         * Fetch site/user login data and store. Note that this is
         * synchronous.
         */     
        var resp = AXIS.WebDAV.GET({
                  			method:       'GET',
                     	  url:          '/!lime/root/lib/site.json',
                     	  asynch:				false,
                     	  callId:       'LOGIN_FETCH_DATA'
                     	});

        AXIS._siteData = eval('('+resp.responseText+')');

        if(AXIS.settings('noLogin') === false)
          {
            AXIS.onDOMReady.subscribe({
              callback: function() {
                this._createAutoLoginFrame();
                this.login();
              },
              scope: this
            });
          }
      };

    this._authStateUpdate = function(state)
      {
        if (state === this._authState)
          return;

        this._authState = state;

        this.onAuthUpdate.fire(state);
      }
      
    /*
     * The login/auth check, executed on every page
     */
    this.login = function()
      {    //alert('logging in');
        
       	/*
       	 * This is a non-cached resource. Ensures that we have the latest cookies.
       	 */
    		AXIS.WebDAV.GET({
    			method:       'GET',
       	  url:          '/!lime/root/logout',
       	  asynch:       false,
       	  callId:       'LOGIN_CHECK'
       	});
       	
        if(AXIS.Cookies.read('auth') && !AXIS.Cookies.read('user'))
	        {
	          AXIS.Cookies.erase('auth');
	        }
       
        // return if already logged in
        if(AXIS.User.isLoggedIn())
          {
            return this._authStateUpdate(AXIS.Cookies.read('user'));
          }

        AXIS.Login.setAuthCookie(
          function()
            {
              AXIS.Login._submitAutoLoginFrame();
            });                 

        return true;
      };
    
    this.logout = function()
      {
        AXIS.Login.beforeLogout.fire({
          args: [] 
        });

        if (location.protocol + "//" + location.host + "/" == AXIS._siteData.hosts.limebits)
          {
            AXIS.Login._submitAutoLogoutFrame();
          }
        else
          {
            AXIS.Cookies.erase('auth');
            AXIS.Cookies.erase('user');
            this._authStateUpdate(false);
          }
      };

    this.setAuthCookie = function(cb)
      {
        this.authCookie = AXIS.Cookies.read('auth');
        if(!this.authCookie) 
          {
            AXIS.WebDAV.GET(
              {
                method:       'GET',
                url:          '/!lime/root/authonly',          	    
           	on401:        function(r)
           	  {
           	    AXIS.Login.authCookie = AXIS.Cookies.read('auth');
           	    //alert(r.responseText);
           	  },
           	callback:     function(r)
                  {
           	    AXIS.Login.authCookie = AXIS.Cookies.read('auth');
                    cb();
                  },
           	asynch:       false, 
           	callId:       'GET_AUTH_COOKIE'
              }
            );
          }
      };

    /**
     * Creates the autologin frame in DOM
     *
     * @see #_loadFrameHandler
     */
    this._createAutoLoginFrame = function()
      {
        try
          {
            var loginFrame = document.createElement('iframe');
            loginFrame.style.display = 'none';
            var frm = document.body.appendChild(loginFrame);
    
            if (frm.contentDocument && frm.contentDocument.defaultView)
              this._loginFrameWindow = frm.contentDocument.defaultView;
            else
              this._loginFrameWindow = frm.contentWindow;
            this._loginFrameEl = frm;
    
            this._loginFrameWindow.location.replace("about:blank");
    
            AXIS.attachEvent('load',this._loadFrameHandler,frm);
          }
        catch(e){}
      };
     
    /**
     * When the login frame (referenced by #_loginFrameWindow; @see #_createAutoLoginFrame)
     * has its src changed, this is the handler fired when given src is loaded.
     *
     * @private
     * @see #_createAutoLoginFrame
     */
    this._loadFrameHandler = function()
      {
        var loc   = AXIS.Login._loginFrameWindow.location;
        var hsh;
        
        try 
          {
            hsh   = loc.hash;
            if (hsh === undefined || loc.pathname != '/!lime/root/logout')
              throw "error";
          } catch(e) { return; }
            
        hsh       = hsh.split('#')[1] || false;
        
        //alert('loc: ' + loc + ' - ' + 'hash: ' + hsh);
        
        var cook  = AXIS.Cookies.read('user');

        switch(hsh)
          {
          case false:
            if (cook)
              {
                AXIS.Login._authStateUpdate(cook);
                break;
              }
          case 'noauth':
          case 'noallow':
            // TODO: look into handling no_allow with a modal iframe popup

            if(AXIS.Login.forceLogin)
              {
                AXIS.Login._redirectToAccess();
              }
            else
              {
                AXIS.Login._authStateUpdate(false);
              }
            break;
          case "signout":
            AXIS.Cookies.erase('auth');
            AXIS.Cookies.erase('user');
            AXIS.Login._authStateUpdate(false);
            break;
          case "nosignout":
            new AXIS.Errors.LoginException('LB_LOGOUT_INVALID_SIGNOUT');
            break;
          default:
            break;
          }
      };
    
    /**
     * Submits the login frame created with #_createAutoLoginFrame
     *
     * @see #_loadFrameHandler
     */
    this._submitAutoLoginFrame = function() 
      {
        //alert('submitting frame');
        AXIS.Login._loginFrameWindow.location.replace(AXIS._siteData.hosts.secure + 'secure/auth_validator.html#auth_cookie=' + AXIS.Login.authCookie  + '&return_to=' + escape(AXIS.Login._returnTo));
      };

    this._redirectToAccess = function(join)
      {
        AXIS.Login.authCookie = AXIS.Cookies.read('auth');
        top.location = AXIS._siteData.hosts.secure + 'secure/access.html#auth_cookie=' + AXIS.Login.authCookie + (join ? ('&sign_up=' + join) : '') + (AXIS.Login.redirReturnTo ? ('&return_to=' + escape(AXIS.Login.redirReturnTo)) : '');
      }
         
    this._submitAutoLogoutFrame = function() 
      {
        AXIS.Login.authCookie = AXIS.Cookies.read('auth');
        AXIS.Login._loginFrameWindow.location.replace(AXIS._siteData.hosts.secure + 'secure/auth_validator.html#logout=1&www_auth_cookie=' + AXIS.Login.authCookie + '&return_to=' + escape(AXIS.Login._returnTo));
      }

    /*
     * @return    {String} full path to user home folder
     */
    this.homePath = function()
      {
        return this._baseHomePath + AXIS.User.isLoggedIn();
      };
  };
