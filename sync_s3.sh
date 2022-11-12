#!/bin/bash
aws s3 --profile hannesvz sync . s3://crypconvo.randomcrap.co.za/ --acl public-read --exclude ".git/*" --exclude "*.swp" --exclude "README.md" --exclude "sync_s3.sh"
