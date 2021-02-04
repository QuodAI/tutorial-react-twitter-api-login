import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import { useState, useEffect } from 'react';
import queryString from 'query-string';

const apiPath = process.env.REACT_APP_SERVERLESS ? '/.netlify/functions/index' : '/api';

function App() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState();
  const [imageUrl, setImageUrl] = useState();
  const [status, setStatus] = useState();
  const [url, setUrl] = useState();
  
  const login = () => {
    (async () => {
      
      try {
        //OAuth Step 1
        const response = await axios({
          url: `${apiPath}/twitter/oauth/request_token`, 
          method: 'POST'
        });
        
        const { oauth_token } = response.data;
        //Oauth Step 2
        window.location.href = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`;
      } catch (error) {
        console.error(error); 
      }
      
    })();
  }
  
  const logout = () => {
    (async () => {
      try {
        await axios({
          url: `${apiPath}/twitter/logout`, 
          method: 'POST'
        });
        setIsLoggedIn(false);
      } catch (error) {
        console.error(error); 
      }
    })();
  }
  
  useEffect(() => {
    (async() => {
      
        const {oauth_token, oauth_verifier} = queryString.parse(window.location.search);  
        
        if (oauth_token && oauth_verifier) {
         try {
            //Oauth Step 3
            await axios({
              url: `${apiPath}/twitter/oauth/access_token`,  
              method: 'POST',
              data: {oauth_token, oauth_verifier}
            });
         } catch (error) {
          console.error(error); 
         }
        }
        
        try {
          //Authenticated Resource Access
          const {data: {name, profile_image_url_https, status, entities}} = await axios({
            url: `${apiPath}/twitter/users/profile_banner`,
            method: 'GET'
          });
          
          setIsLoggedIn(true);
          setName(name);
          setImageUrl(profile_image_url_https);
          setStatus(status.text);
          setUrl(entities.url.urls[0].expanded_url);
         } catch (error) {
          console.error(error); 
         }
        
      
    })();
  }, []);
  
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {!isLoggedIn &&
          <img className='signin-btn' onClick={login} alt='Twitter login button' src='https://assets.klaudsol.com/twitter.png' />
        }
        
        { isLoggedIn &&
          <div>
            <div><img alt='User profile' src={imageUrl}/></div> 
            <div>Name: {name}</div>
            <div>URL: {url}</div>
            <div>Status: {status}</div>
            <button className='signout-btn' onClick={logout}>Sign Out</button>
          </div>
        }
      </header>
    </div>
  );
}

export default App;
