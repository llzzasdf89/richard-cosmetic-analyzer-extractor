#!/bin/bash

# 用时间戳或 git commit 作为版本号
VERSION=$(git rev-parse --short HEAD)
IMAGE="ccr.ccs.tencentyun.com/richard-lee/richard-cosmetic-analyzer-extractor:$VERSION"

# 构建并推送
docker buildx build \
  --platform linux/amd64 \
  -t $IMAGE \
  --push \
  . && \

# 更新服务器上的镜像版本并重启
ssh -i ./richard.pem ubuntu@13.230.129.167 \
  "cd ~/app && \
   sed -i 's|ccr.ccs.tencentyun.com/richard-lee/richard-cosmetic-analyzer-extractor:.*|$IMAGE|' compose.yml && \
   docker compose pull && \
   docker compose up -d"