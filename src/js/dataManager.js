/*
--------------------------------------------------
dataManager.js
--------------------------------------------------

Purpose:

    Coordinate environmental data freshness,
    automatic updates, and update status.

Responsibilities:

    - Manage refresh policies.
    - Coordinate data updates.
    - Prevent duplicate requests.
    - Track data freshness.
    - Track update status.
    - Support automatic refresh.
    - Support manual refresh.
    - Handle application lifecycle.

This module should not:

    - Manipulate the DOM.
    - Format data for display.
    - Call external APIs directly.
    - Contain provider-specific API logic.
    - Decide how data is displayed.

IMPORTANT:

    This initial version establishes the
    architecture only.

    It does not yet fetch data or create
    automatic refresh timers.

*/


//--------------------------------------------------
// Data Manager State
//--------------------------------------------------

const dataManagerState = {

    initialized: false,

    paused: false,

    datasets: {}

};


//--------------------------------------------------
// Initialization
//--------------------------------------------------

function initializeDataManager() {

    if (dataManagerState.initialized)
        return;

    dataManagerState.initialized = true;

}


//--------------------------------------------------
// Refresh
//--------------------------------------------------

async function refreshData() {

    if (!dataManagerState.initialized)
        initializeDataManager();

    if (dataManagerState.paused)
        return;

    // Data refresh will be implemented
    // incrementally.


}


//--------------------------------------------------
// Refresh Individual Dataset
//--------------------------------------------------

async function refreshDataset(name) {

    if (!dataManagerState.initialized)
        initializeDataManager();

    if (dataManagerState.paused)
        return;

    // Dataset-specific refresh logic
    // will be added incrementally.


}


//--------------------------------------------------
// Status
//--------------------------------------------------

function getDataStatus(name) {

    return dataManagerState.datasets[name] ?? null;

}


function getAllDataStatus() {

    return {
        ...dataManagerState.datasets
    };

}


//--------------------------------------------------
// Lifecycle
//--------------------------------------------------

function pauseDataUpdates() {

    dataManagerState.paused = true;

}


function resumeDataUpdates() {

    dataManagerState.paused = false;

    refreshData();

}