const core = require('@actions/core');
const axios = require('axios');

const WF_NAME = core.getInput('workflowName');
const AWAIT_START_FLAG = core.getInput('awaitStartFlag');
const START_STATUS = core.getInput('startStatus');
const TIMEOUT_MSEC = core.getInput('timeoutSec') * 1000;
const API_PATH = '/repos/' + core.getInput('repos') + '/actions/runs';

const RETRY_COUNT = 10;
const INTERVAL_SEC = AWAIT_START_FLAG ? 1 : 3;

async function workflowIsRunning(config) {
  return AWAIT_START_FLAG
    ? await workflowExists(config, START_STATUS).catch(err => { throw err })
    : await workflowExists(config, 'queued').catch(err => { throw err })
    || await workflowExists(config, 'in_progress').catch(err => { throw err });
}

async function workflowExists(config, status) {

  config.params.status = status;
  const res = await request(config, RETRY_COUNT).catch(err => { throw err });

  const result = res.data.total_count != 0
    && (!WF_NAME || res.data.workflow_runs.some(wfr => wfr.name == WF_NAME));
  console.log('Successfully received API response.');
  console.log('The workflow run of ' + status + (result ? ' exists.' : ' doesnt exist.'));

  return result;
}

async function request(config, count) {

  const res = await axios.get(API_PATH, config).catch(err => { throw err });

  if (res.status != 200)
    console.log('The http status that is response of Github REST API is not success, it is ' + res.status + '.');
  else if (res.data.total_count != res.data.workflow_runs.length)
    console.log('The response of Github REST API contains a mismatch between [total_count:' + res.data.total_count + '] and [workflow_runs.length:' + res.data.workflow_runs.length + '].');
  else
    return res;

  if (count - 1 < 0)
    throw 'Github REST API did not return a valid response while retry count .';

  await sleep(0.5);
  return await request(config, count - 1).catch(err => { throw err });
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
    ? !(await workflowIsRunning(config).catch(err => { throw err }))
    : await workflowIsRunning(config).catch(err => { throw err }))
    && !timeoutFlag) {

    await sleep(INTERVAL_SEC)
    timeoutFlag = new Date() - start > TIMEOUT_MSEC;
  }

  if (timeoutFlag)
    core.setFailed('The workflow runs were not completed/started while timeoutSec.');
}

try {
  validate();
  run().catch(err => { throw err });
} catch (error) {
  core.setFailed(error.message);
}
