#!/bin/bash
# Run this on the VPS to deploy the latest changes
cd /opt/coverscore-ai
git pull origin main
# OR if not using git, scp files after:
# scp src/data/question_bank.json root@163.245.210.111:/opt/coverscore-ai/src/data/
# scp src/config/domain.js root@163.245.210.111:/opt/coverscore-ai/src/config/
# scp src/config/scoring/index.js root@163.245.210.111:/opt/coverscore-ai/src/config/scoring/
# scp src/routes/webhook.js root@163.245.210.111:/opt/coverscore-ai/src/routes/
# scp src/services/whatsappFlow.js root@163.245.210.111:/opt/coverscore-ai/src/services/

# Restart container
docker restart coverscore-ai
docker logs coverscore-ai --tail 20
