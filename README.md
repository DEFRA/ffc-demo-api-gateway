[![Build status](https://defradev.visualstudio.com/DEFRA_FutureFarming/_apis/build/status/defra-ff-mine-support-api-gateway)](https://defradev.visualstudio.com/DEFRA_FutureFarming/_build/latest?definitionId=561)

# Mine Support API Gateway
Digital service mock to claim public money in the event property subsides into mine shaft.  This service receives submitted applications from the web application and sends the user data to the user service and the claim data to the claim service via http.  A response is sent back to the web front end as confirmation.

# Environment variables
|Name|Description|Required|Default|Valid|Notes|
|---|---|:---:|---|---|---|
|NODE_ENV|Node environment|no|development|development,test,production||
|PORT|Port number|no|3001|||
|MINE_SUPPORT_USER_SERVICE|Url of service User service|no|http://localhost:3002|||
|MINE_SUPPORT_CLAIM_SERVICE|Url of service Claim service|no|http://localhost:3003|||
|MINE_SUPPORT_REST_CLIENT_TIMEOUT_IN_MILLIS|Rest client timout|no|5000|||

# Prerequisites
Node v10+

# Running the application
The application is ready to run:

`$ node index.js`

Alternatively the project can be run in a container through the docker-compose.yaml file.

# Kubernetes
The service has been developed with the intention of running in Kubernetes.  A helm chart is included in the `.\helm` folder.

# How to run tests
Unit tests are written in Lab and can be run with the following command:

`npm run test`
