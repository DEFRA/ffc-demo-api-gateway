[![Build Status](https://defradev.visualstudio.com/DEFRA_FutureFarming/_apis/build/status/DEFRA.mine-support-api-gateway?branchName=master)](https://defradev.visualstudio.com/DEFRA_FutureFarming/_build/latest?definitionId=583&branchName=master)

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

# Running the application in Containers
The service has been developed with the intention of running in Kubernetes. A helm chart is included in the `.\helm` folder.
A utility script is provided to aid in deploying to a local cluster.

First build the container so it is available in the local Docker registry

 `./scripts/build-image`
 
 Then deploy to the current Helm context

 `./scripts/deploy-local`

It is much quicker to use the provided [docker-compose.yaml](./docker-compose.yaml) file for development. At the moment the compose file only contains the mine-support api, not stubs or images for other required services.

The docker-compose file can be launched via `./bin/start-compose`. This will start a nodemon session watching for changes in `.js` files.

For the volume mounts to work correct via WSL the application needs to be run from `/c/...` rather than `/mnt/c/..`.

You may need to create a directory at `/c` then mount it via `sudo mount --bind /mnt/c /c` to be able to change to `/c/..`

# How to run tests
Unit tests are written in Lab and can be run with the following command:

`npm run test`

Alternatively the `docker-compose-test.yaml` used by the continuous integration build may be run via the script `./scripts/test-compose`.

# Build Pipeline

The [azure-pipelines.yaml](azure-pipelines.yaml) performs the following tasks:
- Runs unit tests
- Publishes test result
- Pushes containers to the registry tagged with the PR number or release version
- Deletes PR deployments, containers, and namepace upon merge

Builds will be deployed into a namespace with the format `mine-support-{identifier}` where `{identifier}` is either the release version, the PR number, or the branch name.

A detailed description on the build pipeline and PR work flow is available in the [Defra Confluence page](https://eaflood.atlassian.net/wiki/spaces/FFCPD/pages/1281359920/Build+Pipeline+and+PR+Workflow)


# Testing Locally

The mine-support-api-gateway is not exposed via an endpoint within Kubernetes.

The deployment may be accessed by forwarding a port from a pod.
First find the name of the pod by querying the namespace, i.e.

`kubectl get pods --namespace mine-support-api-gateway-pr2`

This will list the full name of all the pods in the namespace. Forward the pods exposed port 3001
to a local port using the name returned from the previous command, i.e.

`kubectl port-forward --namespace mine-support-api-gateway-pr2 mine-support-api-gateway-8b666f545-g477t  3001:3001`

Once the port is forwarded a tool such as [Postman](https://www.getpostman.com/) can be used to access the API at http://localhost:3001/claim.
Sample valid JSON that can be posted is:
```
{ 
  "claimId": "MINE123",
  "propertyType": "business",
  "accessible": false,
  "dateOfSubsidence": "2019-07-26T09:54:19.622Z",
  "mineType": ["gold"],
  "email": "test@email.com"
}
```
 Alternatively curl can be used locally to send a request to the end point, i.e.

```
curl  -i --header "Content-Type: application/json" \
  --request POST \
  --data '{ "claimId": "MINE123", "propertyType": "business",  "accessible": false,   "dateOfSubsidence": "2019-07-26T09:54:19.622Z",  "mineType": ["gold"],  "email": "test@email.com" }' \
  http://localhost:3001/claim
```

# Testing 'In Situ'

A PR can also be tested by reconfiguring the mine-gateway service to use the URL of the PR rather than the current release in the development cluster. Create a `patch.yaml` file containing the desired URL:
```
apiVersion: extensions/v1beta1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - env:
        - name: MINE_SUPPORT_API_GATEWAY
          value: http://mine-support-api-gateway.mine-support-api-gateway-pr2
        name: mine-support
```
then apply the patch:

`kubectl patch deployment --namespace mine-support mine-support --patch "$(cat patch.yaml)"`
