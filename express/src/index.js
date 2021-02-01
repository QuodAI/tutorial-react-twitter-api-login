const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3000;
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const oauthCallback=process.env.FRONTEND_URL;

//our in-memory secrets database.
//Can be a key-value store or a relational database
let tokens = {};

const _oauth = new (require('oauth').OAuth)(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    CONSUMER_KEY, // consumer key
    CONSUMER_SECRET, // consumer secret
    '1.0',
    oauthCallback,
    'HMAC-SHA1'
);

//convert oauth methods to promises so we can use async/await syntax
//and keep our code sexier
const oauth ={
  getOAuthRequestToken: () => { 
    return new Promise((resolve, reject) => {
      _oauth.getOAuthRequestToken((error, oauth_token, oauth_token_secret, results) => {
        if(error) {
          reject(error);  
        } else {
          resolve({oauth_token, oauth_token_secret, results});  
        }
      });
    });
  },
  
  getOAuthAccessToken: (oauth_token, oauth_token_secret, oauth_verifier) => { 
    return new Promise((resolve, reject) => {
      _oauth.getOAuthAccessToken(oauth_token, oauth_token_secret, oauth_verifier, (error, oauth_access_token, oauth_access_token_secret, results) => {
        if(error) {
          reject(error);  
        } else {
          resolve({oauth_access_token, oauth_access_token_secret, results});  
        }
      });
    });
  },
  
  getProtectedResource: (url, method, oauth_access_token, oauth_access_token_secret) => {
     return new Promise((resolve, reject) => {
      _oauth.getProtectedResource(url, method, oauth_access_token, oauth_access_token_secret,  (error, data, response) => {
        if(error) {
          reject(error);  
        } else {
          resolve({data, response});  
        }
      });
    });   
  }
  
};


app.use(cors({
  origin: oauthCallback,
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

//OAuth Step 1
app.post('/twitter/oauth/request_token', async (req, res) => {
  
  const {oauth_token, oauth_token_secret} = await oauth.getOAuthRequestToken();
  res.cookie('oauth_token', oauth_token , {
    maxAge: 15 * 60 * 1000, // 15 minutes
    secure: true,
    sameSite: 'none',
  });
  tokens[oauth_token] = { oauth_token_secret };
  res.json({ oauth_token });
  
});
  

//OAuth Step 3
app.post('/twitter/oauth/access_token', async (req, res) => {
  const {oauth_token: req_oauth_token, oauth_verifier} = req.body;
  const oauth_token = req.cookies.oauth_token;
  const oauth_token_secret = tokens[oauth_token].oauth_token_secret;
  
  if (oauth_token !== req_oauth_token) {
    res.status(403).json({message: "Request tokens do not match"});
    return;
  }
  
  try {
    const {oauth_access_token, oauth_access_token_secret} = await oauth.getOAuthAccessToken(oauth_token, oauth_token_secret, oauth_verifier);
    tokens[oauth_token] = { ...tokens[oauth_token], oauth_access_token, oauth_access_token_secret };
    res.json({success: true});
    return;
  } catch(error) {
    res.status(403).json({message: "Missing access token"});
  } 
  
});

//Authenticated resource access
app.get("/twitter/users/profile_banner", async (req, res) => {
  
  try {
    const oauth_token = req.cookies.oauth_token;
    const { oauth_access_token, oauth_access_token_secret } = tokens[oauth_token]; 
    const response = await oauth.getProtectedResource("https://api.twitter.com/1.1/account/verify_credentials.json", "GET", oauth_access_token, oauth_access_token_secret);
    res.json(JSON.parse(response.data));
    return;
  } catch(error) {
    res.status(403).json({message: "Missing, invalid, or expired tokens"});
  } 
  
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})