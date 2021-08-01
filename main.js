const core = require('@actions/core');
const axios = require('axios');

const RETRY_COUNT = 3;
const INTERVAL_SEC = 3;

const WF_NAME = core.getInput('workflowName');
const TIMEOUT_MSEC = core.getInput('timeoutSec') * 1000;
const API_PATH = '/repos/' + core.getInput('repos') + '/actions/runs';

async function workflowIsRunning(config) {
  return await workflowExists(config, 'queued')
    || await workflowExists(config, 'in_progress');
}

async function workflowExists(config, status) {
  config.params.status = status;
  const res = await request(config, RETRY_COUNT);
  return res.data.total_count != 0
    && (!WF_NAME || res.data.workflow_runs.some(wfr => wfr.name == WF_NAME));
}

async function request(config, count) {

  const res = await axios.get(API_PATH, config);
  if (res.status != 200)
    if (count - 1 < 0)
      throw 'Github API did not return 200.';
    else
      return await request(config, count - 1);

  return res;
}

function sleep(sec) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

async function run() {

  const config = {
    baseURL: 'https://api.github.com/',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: 'token ' + core.getInput('token')
    },
    params: {
      status: ''
    }
  };

  let timeoutFlag = false;
  const start = new Date();
  while (await workflowIsRunning(config) && !timeoutFlag) {
    await sleep(INTERVAL_SEC)
    timeoutFlag = new Date() - start > TIMEOUT_MSEC;
  }

  if (timeoutFlag)
    core.setFailed('The workflow runs were not completed while timeoutSec.');
}

try {
  run();
} catch (error) {
  core.setFailed(error.message);
}
