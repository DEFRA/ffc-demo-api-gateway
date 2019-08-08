[![Build Status](https://defradev.visualstudio.com/DEFRA_FutureFarming/_apis/build/status/DEFRA.mine-support-api-gateway?branchName=master)](https://defradev.visualstudio.com/DEFRA_FutureFarming/_build/latest?definitionId=583&branchName=master)

# Mine Support API Gateway

Digital service mock to claim public money in the event property subsides into mine shaft.  This service receives submitted applications from the web application and sends the user data to the user service and the claim data to the claim service via http.  A response is sent back to the web front end as confirmation.

# Environment variables

| Name                       | Description                  | Required | Default               | Valid                       | Notes |
|----------------------------|------------------------------|:--------:|-----------------------|-----------------------------|-------|
| NODE_ENV                   | Node environment             | no       | development           | development,test,production |       |
| PORT                       | Port number                  | no       | 3001                  |                             |       |
| MINE_SUPPORT_USER_SERVICE  | Url of service User service  | no       | http://localhost:3002 |                             |       |
| MINE_SUPPORT_CLAIM_SERVICE | Url of service Claim service | no       | http://localhost:3003 |                             |       |
| MINE_SUPPORT_REST_CLIENT_TIMEOUT_IN_MILLIS | Rest client timout | no | 5000                  |                             |       |

# Prerequisites

- Node v10+

# Running the application

The application is designed to run as a container via Docker Compose or Kubernetes (with Helm).

## Using Docker Compose

A set of convenience scripts are provided for local development and running via Docker Compose.

```
# Build service containers
scripts/build

# Start the service and attach to running containers (press `ctrl + c` to quit)
scripts/start

# Stop the service and remove Docker volumes and networks created by the start script
scripts/stop
```

Any arguments provided to the build and start scripts are passed to the Docker Compose `build` and `up` commands, respectively. For example:

```
# Build without using the Docker cache
scripts/build --no-cache

# Start the service without attaching to containers
scripts/start --detach
```

This service depends on an external Docker network named `mine-support` to communicate with other Mine Support services running alongside it. The start script will automatically create the network if it doesn't exist and the stop script will remove the network if no other containers are using it.

## Using Kubernetes

The service has been developed with the intention of running on Kubernetes in production.  A helm chart is included in the `.\helm` folder.

Running via Helm requires a local Postgres database to be installed and setup with the username and password defined in the [values.yaml](./helm/values.yaml). It is much simpler to develop using Docker Compose locally than to set up a local Kubernetes environment. See above for instructions.

To test Helm deployments locally, a [deploy](./deploy) script is provided.

```
# Build service containers
scripts/build

# Deploy to the current Helm context
scripts/deploy
```

### Accessing the pod

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

# How to run tests

A convenience script is provided to run automated tests in a containerised environment:

```
scripts/test
```

Alternatively, the same tests may be run locally via npm:

```
npm run test
```

# Build Pipeline

The [azure-pipelines.yaml](azure-pipelines.yaml) performs the following tasks:
- Runs unit tests
- Publishes test result
- Pushes containers to the registry tagged with the PR number or release version
- Deletes PR deployments, containers, and namepace upon merge

Builds will be deployed into a namespace with the format `mine-support-api-gateway-{identifier}` where `{identifier}` is either the release version, the PR number, or the branch name.

A detailed description on the build pipeline and PR work flow is available in the [Defra Confluence page](https://eaflood.atlassian.net/wiki/spaces/FFCPD/pages/1281359920/Build+Pipeline+and+PR+Workflow)

## Testing a pull request

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
        name: mine-support-api-gateway
```
then apply the patch:

`kubectl patch deployment --namespace default mine-support-api-gateway --patch "$(cat patch.yaml)"`

Once tested the patch can be rolled back, i.e.

`kubectl rollout undo --namespace default deployment/mine-support-api-gateway`
