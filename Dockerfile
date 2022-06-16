FROM node:16-alpine AS node

FROM node AS node-with-gyp
RUN apk add g++ make python3

FROM node-with-gyp AS builder
WORKDIR /squid
ENV KAR_WSS wss://karura-rpc.dwellir.com
ADD package.json .
ADD package-lock.json .
RUN npm ci
ADD tsconfig.json .
ADD src src
RUN npm run build

FROM node-with-gyp AS deps
ENV KAR_WSS wss://karura-rpc.dwellir.com
WORKDIR /squid
ADD package.json .
ADD package-lock.json .
RUN npm ci --production

FROM node AS squid
WORKDIR /squid
COPY --from=deps /squid/package.json .
COPY --from=deps /squid/package-lock.json .
COPY --from=deps /squid/node_modules node_modules
COPY --from=builder /squid/lib lib
ADD db db
ADD schema.graphql .
# TODO: use shorter PROMETHEUS_PORT
ENV PROCESSOR_PROMETHEUS_PORT 3000
ENV DB_NAME squid
ENV DB_PASS squid
ENV DB_PORT 23798
ENV KAR_WSS wss://karura-rpc.dwellir.com
EXPOSE 3000
EXPOSE 4000


FROM squid AS processor
ENV KAR_WSS wss://karura-rpc.dwellir.com
CMD ["npm", "run", "processor:start"]


FROM squid AS query-node
ENV KAR_WSS wss://karura-rpc.dwellir.com
CMD ["npm", "run", "query-node:start"]
