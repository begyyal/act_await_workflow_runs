const core = require('@actions/core');
const axios = require('axios');

const WF_NAME = core.getInput('workflowName');
const TIMEOUT_MSEC = core.getInput('timeoutSec') * 1000;
const API_PATH = '/repos/' + core.getInput('repos') + '/actions/runs';
const INTERVAL_SEC = core.getInput('intervalSec');

const RETRY_COUNT = 3;
const STR = {
  completed: 'completed',
  queued: 'queued',
  in_progress: 'in_progress'
};

function owata_(promise) {
  return promise.catch(err => {
    core.setFailed(err.message);
    process.exit(-1);
  });
}

async function getWorkflowIds() {

  // completed以外でのフィルタリングを嫌気してのこれ
  // https://github.com/begyyal/act_await_wf_execution/issues/1
  let runs, allRuns = [], count = 1;
  do {
    runs = (await owata_(request(API_PATH, newConf(count++), RETRY_COUNT)))
      .data.workflow_runs
      .filter(wfr => wfr.status != STR.completed && (!WF_NAME || wfr.name == WF_NAME));
    Array.prototype.push.apply(allRuns, runs);
  } while (runs.length == 30);

  return runs.map(wfr => wfr.id);
}

async function checkCompletion(ids) {
  return (await Promise
    .all(ids.map(id => owata_(getWorkflowStatus(id)))))
    .every(s => s == STR.completed);
}

async function getWorkflowStatus(id) {
  const path = API_PATH + '/' + id;
  const res = await owata_(request(path, newConf(), RETRY_COUNT));
  console.log(id + ' - ' + res.data.status);
  return res.data.status;
}

async function request(path, config, count) {

  const res = await owata_(axios.get(path, config));

  if (res.status == 200)
    return res;
  else if (count - 1 < 0)
    throw 'Github REST API did not return a valid response while retry count .';

  console.log('The http status that is response of Github REST API is not success, it is ' + res.status + '.');
  await sleep(1);

  return await owata_(request(path, config, count - 1));
}

function sleep(sec) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

function newConf(page) {

  const conf = {
    baseURL: 'https://api.github.com/',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: 'token ' + core.getInput('token')
    }
  };

  if (page)
    conf.params = { page: page };

  return conf;
}

async function run() {

  const ids = await owata_(getWorkflowIds());
  if (ids.length == 0)
    return;

  let timeoutFlag = false;
  const start = new Date();

  while (!(await owata_(checkCompletion(ids))) && !timeoutFlag) {
    await sleep(INTERVAL_SEC);
    timeoutFlag = new Date() - start > TIMEOUT_MSEC;
  }

  if (timeoutFlag)
    core.setFailed('The workflow runs were not completed/started while timeoutSec.');
}

owata_(run());
