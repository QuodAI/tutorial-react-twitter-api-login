This is the codebase for the tutorial entitled "How to integrate Twitter Login into your React app". 

Note that because of the requirements of the OAuth 1.0a protocol that the Twitter authentication follows, we cannot implement a pure React solution 
(two reasons: React's inability to securely hide a secret, and due to the Same Origin policy). You will see an Express component in this codebase.    

## Live Demo

You can follow the link to view the [Live Demo](https://pensive-snyder-a1edac.netlify.app/)

## Quick Start

```
ngrok http 8080                                         # 8080 - default port of create-react-app

export FRONTEND_URL=https://xxxxxxx.ngrok.io            # ngrok URL for callback
export HOST=localhost                                   # as per create-react-app proxy requirements
export DANGEROUSLY_DISABLE_HOST_CHECK=true              # See https://github.com/facebook/create-react-app/issues/2271
export CONSUMER_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXX        # aka API KEY, Get from Twitter Development Portal  
export CONSUMER_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXX     # aka API SECRET, Get from Twitter Development Portal 

cd react && npm start
cd express && npm start
```

## Unauthenticated
![Unauthenticated](https://assets.klaudsol.com/tutorial-react-twitter-api-login/banner1.png)

## Authenticated
![Authenticated](https://assets.klaudsol.com/tutorial-react-twitter-api-login/banner2.png)
