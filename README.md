[![build](https://github.com/begyyal/act_await_wf_execution/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/begyyal/act_await_wf_execution/actions/workflows/build.yml)

# Overview

This is a Github Action.  
Wait for a workflow execution to complete.  

## Premise

- [Action's format including inputs.](https://github.com/begyyal/act_sequential_execution/blob/master/action.yml)

## Behavier

- The wait target is only which exists as `queued` or `in_progress` on a start of the Action,  
will not contains which appears after the start.

## Note

- There is a case that a response of Github REST API contains a mismatch  
between 'total_count' of the property and 'workflow_runs.length' despite the both less than page count.  
This happens frequently at `queued` or `in_progress`, and perhaps a bug in Github side, no way but to try again...  
Therefore, the calling api logic will retry in this case as well.  
[Here is the API documents.](https://docs.github.com/ja/rest/reference/actions#workflow-runs)
