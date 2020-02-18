ARG PARENT_VERSION=1.0.0-node12.16.0
ARG PORT=3001
ARG PORT_DEBUG=9229
ARG REGISTRY=562955126301.dkr.ecr.eu-west-2.amazonaws.com

# Development
FROM ${REGISTRY}/ffc-node-development:${PARENT_VERSION} AS development
ARG PARENT_VERSION
ARG REGISTRY
LABEL uk.gov.defra.ffc.parent-image=${REGISTRY}/ffc-node-development:${PARENT_VERSION}
ARG PORT
ENV PORT ${PORT}
ARG PORT_DEBUG
EXPOSE ${PORT} ${PORT_DEBUG}
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node server/ ./app/server/
COPY --chown=node:node index.js/ ./app/index.js
CMD [ "npm", "run", "start:watch" ]

# Production
FROM ${REGISTRY}/ffc-node:${PARENT_VERSION} AS production
ARG PARENT_VERSION
ARG REGISTRY
LABEL uk.gov.defra.ffc.parent-image=${REGISTRY}/ffc-node:${PARENT_VERSION}
ARG PORT
ENV PORT ${PORT}
EXPOSE ${PORT}
COPY --from=development /home/node/package*.json ./
COPY --from=development /home/node/app/ ./app/
COPY --from=development /home/node/index.js/ ./app/index.js
RUN npm ci
CMD [ "node", "index.js" ]
