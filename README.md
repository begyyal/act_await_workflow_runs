[![build](https://github.com/begyyal/act_await_wf_execution/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/begyyal/act_await_wf_execution/actions/workflows/build.yml)

# Overview

This is a Github Action.  
Wait for workflow executions to complete.  

## Premise

- [Action's format including inputs.](https://github.com/begyyal/act_sequential_execution/blob/master/action.yml)

## Behavier

- The wait targets is only which exist as `queued` or `in_progress` on a start of the Action,  
will not contains which appears after the start.
