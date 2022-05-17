[![build](https://github.com/begyyal/act_await_workflow_runs/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/begyyal/act_await_workflow_runs/actions/workflows/build.yml)

# Overview

This is a Github Action.  
Wait for workflow runs specified at inputs to complete.  

## Format

- [Action's format including inputs.](https://github.com/begyyal/act_await_workflow_runs/blob/master/action.yml)

## Behavier

- The wait targets are only which exist as `queued` or `in_progress` on a start of the Action, will not contains anything appears after the start.
- If subject workflow is the same as the wait target, it releases a run which has a oldest run_number sequentially.
