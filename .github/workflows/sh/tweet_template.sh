#!/bin/bash

tag_name=$1
url="https://github.com/marketplace/actions/await-workflow-runs"

LF=$'\\n'
text="act_await_wf_runs updated to ${tag_name}${LF}${url}${LF}#GithubActions"

echo -n "{\"text\":\"${text}\"}"