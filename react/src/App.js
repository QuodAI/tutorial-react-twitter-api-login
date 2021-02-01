import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import { useState, useEffect } from 'react';
import queryString from 'query-string';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

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
          url: `${backendUrl}/twitter/oauth/request_token`, 
          method: 'POST',
          withCredentials: true
        });
        
        const { oauth_token } = response.data;
        //Oauth Step 2
        window.location.href = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`;
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
              url: `${backendUrl}/twitter/oauth/access_token`,  
              method: 'POST',
              data: {oauth_token, oauth_verifier}, 
              withCredentials: true
            });
         } catch (error) {
          console.error(error); 
         }
        }
        
        try {
          //Authenticated Resource Access
          const {data: {name, profile_image_url_https, status, entities}} = await axios({
            url: `${backendUrl}/twitter/users/profile_banner`,
            method: 'GET',
            withCredentials: true
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
          <a className='btn-primary' onClick={login}>
            <img src='https://assets.klaudsol.com/twitter.png' />
          </a>
        }
        
        { isLoggedIn &&
          <div>
            <div><img src={imageUrl}/></div> 
            <div>Name: {name}</div>
            <div>URL: {url}</div>
            <div>Status: {status}</div>
          </div>
        }
      </header>
    </div>
  );
}

export default App;
