const core = require('@actions/core');
const axios = require('axios');

const WF_NAME = core.getInput('workflowName');
const AWAIT_START_FLAG = core.getInput('awaitStartFlag');
const START_STATUS = core.getInput('startStatus');
const TIMEOUT_MSEC = core.getInput('timeoutSec') * 1000;
const API_PATH = '/repos/' + core.getInput('repos') + '/actions/runs';

const RETRY_COUNT = 3;
const INTERVAL_SEC = AWAIT_START_FLAG ? 1 : 3;

async function workflowIsRunning(config) {
  return AWAIT_START_FLAG
    ? await workflowExists(config, START_STATUS)
    : await workflowExists(config, 'queued')
    || await workflowExists(config, 'in_progress');
}

async function workflowExists(config, status) {

  config.params.status = status;
  const res = await request(config, RETRY_COUNT);

  const result = res.data.total_count != 0
    && (!WF_NAME || res.data.workflow_runs.some(wfr => wfr.name == WF_NAME));
  console.log('Successfully received API response.');
  console.log('The workflow run of ' + status + (result ? ' exists.' : ' doesnt exist.'));

  return result;
}

async function request(config, count) {

  const res = await axios.get(API_PATH, config);

  if (res.status != 200)
    console.log('The http status that is response of Github REST API is not success, it is ' + res.status + '.');
  else if (res.data.total_count != res.data.workflow_runs.length)
    console.log('The response of Github REST API contains a mismatch between [total_count:' + res.data.total_count + '] and [workflow_runs.length:' + res.data.workflow_runs.length + '].');
  else
    return res;

  if (count - 1 < 0) {
    throw 'Github REST API did not return a valid response while retry count .';
  }

  await sleep(1);
  return await request(config, count - 1);
}

function sleep(sec) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

function validate() {
  if (AWAIT_START_FLAG && !['queued', 'in_progress'].some(s => s == START_STATUS))
    throw 'The start status of arguments is invalid.';
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

  while ((AWAIT_START_FLAG
    ? !(await workflowIsRunning(config))
    : await workflowIsRunning(config))
    && !timeoutFlag) {

    await sleep(INTERVAL_SEC)
    timeoutFlag = new Date() - start > TIMEOUT_MSEC;
  }

  if (timeoutFlag)
    core.setFailed('The workflow runs were not completed/started while timeoutSec.');
}

try {
  validate();
  run();
} catch (error) {
  core.setFailed(error.message);
}
