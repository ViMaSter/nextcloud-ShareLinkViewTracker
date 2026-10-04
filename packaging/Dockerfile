FROM alpine:3.23 AS unpack
COPY dist/*.tar.gz /tmp/app.tar.gz
RUN mkdir /app && tar -xzf /tmp/app.tar.gz -C /app

FROM scratch
LABEL org.opencontainers.image.source="https://github.com/ViMaSter/nextcloud-ShareLinkViewTracker"
COPY --from=unpack /app/sharelinkviewtracker /sharelinkviewtracker