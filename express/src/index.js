const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http');

const app = express();
const port = 3000;
const oauthCallback=process.env.FRONTEND_URL;
const oauth = require('./lib/oauth-promise')(oauthCallback);
const COOKIE_NAME = 'oauth_token';

//our in-memory secrets database.
//Can be a key-value store or a relational database
let tokens = {};


app.use(bodyParser.json());
app.use(cookieParser());

const router = express.Router();

router.get('/', (req, res) => {
  res.json({message: "Hello, world"});  
});

//OAuth Step 1
router.post('/twitter/oauth/request_token', async (req, res) => {
  
  const {oauth_token, oauth_token_secret} = await oauth.getOAuthRequestToken();
  
  res.cookie(COOKIE_NAME, oauth_token , {
    maxAge: 15 * 60 * 1000, // 15 minutes
    secure: true,
    httpOnly: true,
    sameSite: true,
  });
  
  tokens[oauth_token] = { oauth_token_secret };
  res.json({ oauth_token });
  
});
  

//OAuth Step 3
router.post('/twitter/oauth/access_token', async (req, res) => {
  
  
  try {
    const {oauth_token: req_oauth_token, oauth_verifier} = req.body;
    const oauth_token = req.cookies[COOKIE_NAME];
    const oauth_token_secret = tokens[oauth_token].oauth_token_secret;
    
    if (oauth_token !== req_oauth_token) {
      res.status(403).json({message: "Request tokens do not match"});
      return;
    }
    
    const {oauth_access_token, oauth_access_token_secret} = await oauth.getOAuthAccessToken(oauth_token, oauth_token_secret, oauth_verifier);
    tokens[oauth_token] = { ...tokens[oauth_token], oauth_access_token, oauth_access_token_secret };
    res.json({success: true});
    
  } catch(error) {
    res.status(403).json({message: "Missing access token"});
  } 
  
});

//Authenticated resource access
router.get("/twitter/users/profile_banner", async (req, res) => {
  
  try {
    const oauth_token = req.cookies[COOKIE_NAME];
    const { oauth_access_token, oauth_access_token_secret } = tokens[oauth_token]; 
    const response = await oauth.getProtectedResource("https://api.twitter.com/1.1/account/verify_credentials.json", "GET", oauth_access_token, oauth_access_token_secret);
    res.json(JSON.parse(response.data));
  } catch(error) {
    res.status(403).json({message: "Missing, invalid, or expired tokens"});
  } 
  
});

router.post("/twitter/logout", async (req, res) => {
  
  try {
    const oauth_token = req.cookies[COOKIE_NAME];
    delete tokens[oauth_token];
    res.cookie(COOKIE_NAME, {}, {maxAge: -1});
    res.json({success: true});
  } catch(error) {
    res.status(403).json({message: "Missing, invalid, or expired tokens"});
  } 
  
});


if (process.env.REACT_APP_SERVERLESS) {
  //as per Netlify lambda conventions
  app.use('/.netlify/functions/index', router);
  module.exports = app;
  module.exports.handler = serverless(app);
} else {
  app.use('/api', router);
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
}