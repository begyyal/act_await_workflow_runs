const core = require('@actions/core');
const axios = require('axios');

const WF_NAME = core.getInput('workflowName');
const TIMEOUT_MSEC = core.getInput('timeoutSec') * 1000;
const API_PATH = '/repos/' + core.getInput('repos') + '/actions/runs';

const RETRY_COUNT = 10;
const INTERVAL_SEC = 3;

async function getWorkflowIds(status) {
  const res = await request(API_PATH, newConf(status), RETRY_COUNT).catch(err => { throw err });
  return res.data.workflow_runs
    .filter(wfr => !WF_NAME || wfr.name == WF_NAME)
    .map(wfr => wfr.id);
}

async function checkCompletion(ids) {
  return (await Promise
    .all(ids.map(id => getWorkflowStatus(id)))
    .catch(err => { throw err }))
    .every(s => s == 'completed');
}

async function getWorkflowStatus(id) {
  const path = API_PATH + '/' + id;
  const res = await request(path, newConf(), RETRY_COUNT).catch(err => { throw err });
  return res.status;
}

async function request(path, config, count) {

  const res = await axios.get(path, config).catch(err => { throw err });

  if (res.status != 200)
    console.log('The http status that is response of Github REST API is not success, it is ' + res.status + '.');
  else if (res.data.total_count && res.data.total_count != res.data.workflow_runs.length)
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

function newConf(status) {
  const params = status ? { status: status } : {};
  return {
    baseURL: 'https://api.github.com/',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: 'token ' + core.getInput('token')
    },
    params: params
  };
}

async function run() {

  const ids = (await Promise
    .all(['queued', 'in_progress'].map(s => getWorkflowIds(s)))
    .catch(err => { throw err }))
    .flatMap();
  if (ids.length == 0)
    return;

  let timeoutFlag = false;
  const start = new Date();

  while (!(await checkCompletion(ids).catch(err => { throw err })) && !timeoutFlag) {
    await sleep(INTERVAL_SEC)
    timeoutFlag = new Date() - start > TIMEOUT_MSEC;
  }

  if (timeoutFlag)
    core.setFailed('The workflow runs were not completed/started while timeoutSec.');
}

try {
  run().catch(err => { throw err });
} catch (error) {
  core.setFailed(error.message);
}
