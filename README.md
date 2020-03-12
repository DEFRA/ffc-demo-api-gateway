[![Known Vulnerabilities](https://snyk.io//test/github/DEFRA/ffc-demo-api-gateway/badge.svg?targetFile=package.json)](https://snyk.io//test/github/DEFRA/ffc-demo-api-gateway?targetFile=package.json)

# FFC Demo API Gateway

Digital service mock to claim public money in the event property subsides into mine shaft.  This service receives submitted applications from the web application and sends the user data to the user service and the claim data to the claim service via http.  A response is sent back to the web front end as confirmation.

## Prerequisites

AWS credentials with access to the container registry where FFC parent images are stored.

Either:
- Docker
- Docker Compose

Or:
- Kubernetes
- Helm

Or:
- Node 10

## Environment variables

The following environment variables are required by the application container. Values for development are set in the Docker Compose configuration. Default values for production-like deployments are set in the Helm chart and may be overridden by build and release pipelines.

| Name                       | Description                    | Required | Default               | Valid                       | Notes |
|----------------------------|--------------------------------|:--------:|-----------------------|-----------------------------|-------|
| NODE_ENV                   | Node environment               | no       | development           | development,test,production |       |
| PORT                       | Port number                    | no       | 3001                  |                             |       |
| FFC_DEMO_USER_SERVICE      | Url of service User service    | no       | http://localhost:3002 |                             |       |
| FFC_DEMO_CLAIM_SERVICE     | Url of service Claim service   | no       | http://localhost:3003 |                             |       |
| FFC_DEMO_REST_CLIENT_TIMEOUT_IN_MILLIS | Rest client timout | no       | 5000                  |                             |       |

## How to run tests

A convenience script is provided to run automated tests in a containerised environment. This will rebuild images before running tests via docker-compose, using a combination of `docker-compose.yaml` and `docker-compose.test.yaml`. The command given to `docker-compose run` may be customised by passing arguments to the test script.

```
# Run all tests
scripts/test

# Run only unit tests
scripts/test --build	scripts/test npm run test:unit
```

Alternatively, the same tests may be run locally via npm:

```
# Run tests without Docker
npm run test
```

### Test watcher

A more convenient way to run tests in development is to use a file watcher to automatically run tests each time associated files are modified. For this purpose, the default docker-compose configuration mounts all app, test and git files into the main `app` container, enabling the test watcher to be run as shown below. The same approach may be used to execute arbitrary commands in the running app.

```
# Run unit test file watcher
docker-compose exec app npm run test:unit-watch

# Run all tests
docker-compose exec app npm test

# Open an interactive shell in the app container
docker-compose exec app sh
```

### Why docker-compose.test.yaml exists

Given that tests can be run in the main app container during development, it may not be obvious why `docker-compose.test.yaml` exists. It's main purpose is for CI pipelines, where tests need to run in a container without any ports forwarded from the host machine.

## Running the application

The application is designed to run in containerised environments, using Docker Compose in development and Kubernetes in production.

- A Helm chart is provided for production deployments to Kubernetes.

### Build container image

Container images are built using Docker Compose, with the same images used to run the service with either Docker Compose or Kubernetes.

By default, the start script will build (or rebuild) images so there will rarely be a need to build images manually. However, this can be achieved through the Docker Compose [build](https://docs.docker.com/compose/reference/build/) command:

```
# Authenticate with FFC container image registry (requires pre-configured AWS credentials on your machine)
aws ecr get-login --no-include-email | sh

# Build container images
docker-compose build
```

### Start and stop the service

Use Docker Compose to run service locally.

`docker-compose up`

Additional Docker Compose files are provided for scenarios such as linking to other running services.

Link to other services:
```
docker-compose -f docker-compose.yaml -f docker-compose.link.yaml up
```

### Test the service

The service binds to a port on the host machine so it can be tested manually by sending HTTP requests to the bound port using a tool such as [Postman](https://www.getpostman.com) or `curl`.

```
# Send a sample request to the /claim endpoint
curl  -i --header "Content-Type: application/json" \
  --request POST \
  --data '{ "claimId": "MINE123", "propertyType": "business",  "accessible": false,   "dateOfSubsidence": "2019-07-26T09:54:19.622Z",  "mineType": ["gold"],  "email": "test@email.com" }' \
  http://localhost:3001/claim
```

Sample valid JSON for the `/claim` endpoint is:

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

### Link to sibling services

To test interactions with sibling services in the FFC demo application, it is necessary to connect each service to an external Docker network, along with shared dependencies such as message queues. The most convenient approach for this is to start the entire application stack from the [`ffc-demo-development`](https://github.com/DEFRA/ffc-demo-development) repository.

It is also possible to run a limited subset of the application stack, using the [`start`](./scripts/start) script's `--link` flag to join each service to the shared Docker network. See the [`ffc-demo-development`](https://github.com/DEFRA/ffc-demo-development) Readme for instructions.

### Deploy to Kubernetes

For production deployments, a helm chart is included in the `.\helm` folder. This service connects to an AMQP 1.0 message broker, using credentials defined in [values.yaml](./helm/ffc-demo-api-gateway/values.yaml), which must be made available prior to deployment.

Scripts are provided to test the Helm chart by deploying the service, along with an appropriate message broker, into the current Helm/Kubernetes context.

```
# Deploy to current Kubernetes context
scripts/helm/install

# Remove from current Kubernetes context
scripts/helm/delete
```

#### Accessing the pod

By default, the service is not exposed via an endpoint within Kubernetes.

Access may be granted by forwarding a local port to the deployed pod:

```
# Forward local port to the Kubernetes deployment
kubectl port-forward --namespace=ffc-demo deployment/ffc-demo-api-gateway 3001:3001
```

Once the port is forwarded, the service can be accessed and tested in the same way as described in the "Test the service" section above.

#### Probes

The service has both an Http readiness probe and an Http liveness probe configured to receive at the below end points.

Readiness: `/healthy`
Liveness: `/healthz`

## Dependency management

Dependencies should be managed within a container using the development image for the app. This will ensure that any packages with environment-specific variants are installed with the correct variant for the contained environment, rather than for the host system which may differ between development and production.

Since dependencies are built into the container image, a full build should always be run immediately after any dependency change.

The following example will update dependencies via NPM, rebuild the container image and replace running containers and volumes:

```
# Run NPM update in a new container
docker-compose run --rm --no-deps app npm update

# Rebuild and restart the service
docker-compose up --build --force-recreate
```

## Build Pipeline

The [azure-pipelines.yaml](azure-pipelines.yaml) performs the following tasks:
- Runs unit tests
- Publishes test result
- Pushes containers to the registry tagged with the PR number or release version
- Deletes PR deployments, containers, and namepace upon merge

Builds will be deployed into a namespace with the format `ffc-demo-api-gateway-{identifier}` where `{identifier}` is either the release version, the PR number, or the branch name.

A detailed description on the build pipeline and PR work flow is available in the [Defra Confluence page](https://eaflood.atlassian.net/wiki/spaces/FFCPD/pages/1281359920/Build+Pipeline+and+PR+Workflow)

### Testing a pull request

A PR can also be tested by reconfiguring the api-gateway service to use the URL of the PR rather than the current release in the development cluster. Create a `patch.yaml` file containing the desired URL:

```
apiVersion: extensions/v1beta1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - env:
        - name: FFC_DEMO_API_GATEWAY
          value: http://ffc-demo-api-gateway.ffc-demo-api-gateway-pr2
        name: ffc-demo-api-gateway
```
then apply the patch:

`kubectl patch deployment --namespace default ffc-demo-api-gateway --patch "$(cat patch.yaml)"`

Once tested the patch can be rolled back, i.e.

`kubectl rollout undo --namespace default deployment/ffc-demo-api-gateway`

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.


