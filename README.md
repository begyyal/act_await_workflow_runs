[![build](https://github.com/begyyal/act_await_wf_execution/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/begyyal/act_await_wf_execution/actions/workflows/build.yml)

# Overview

This is a Github Action.  
Wait for a workflow execution to complete or start.  

If you want to wait for the complete, no need to do anything.  
In case of the start, please input something to `awaitStartFlag`. 

## Premise

- [Action's format including inputs.](https://github.com/begyyal/act_sequential_execution/blob/master/action.yml)

## Note

- There is a case that a response of Github REST API contains a mismatch  
between 'total_count' of the property and 'workflow_runs.length'.  
This is perhaps a bug in Github side, no way but to try again...  
Therefore, the calling api logic will retry in this case as well.  
[Here is the API documents.](https://docs.github.com/ja/rest/reference/actions#workflow-runs)
