# deploy.sh
#!/bin/bash
#注意需要构建为amd64架构的才行，服务器用的是ubuntu
docker buildx build \
  --platform linux/amd64 \
  -t ccr.ccs.tencentyun.com/richard-lee/richard-cosmetic-analyzer-extractor:v1.0.0 \
  --push \
  . && \
ssh ubuntu@124.220.221.150 "cd /app && docker compose pull && docker compose up -d"