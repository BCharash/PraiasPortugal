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

    This implementation establishes the request
    safety architecture.

    It does not yet fetch data or create
    automatic refresh timers.

*/


//--------------------------------------------------
// Dataset Definitions
//--------------------------------------------------

const DATASETS = {

    weather: {
        name: "weather"
    },

    marine: {
        name: "marine"
    },

    tides: {
        name: "tides"
    },

    alerts: {
        name: "alerts"
    }

};


//--------------------------------------------------
// Data Manager State
//--------------------------------------------------

const dataManagerState = {

    initialized: false,

    paused: false,

    datasets: {}

};


//--------------------------------------------------
// Create Initial Dataset Status
//--------------------------------------------------

function createDatasetStatus() {

    const status = {};

    Object.keys(DATASETS).forEach(name => {

        status[name] = {

            lastUpdated: null,

            nextUpdate: null,

            status: "unknown",

            refreshing: false,

            error: null

        };

    });

    return status;

}


//--------------------------------------------------
// Initialization
//--------------------------------------------------

function initializeDataManager() {

    if (dataManagerState.initialized)
        return;

    dataManagerState.datasets =
        createDatasetStatus();

    dataManagerState.initialized = true;

}


//--------------------------------------------------
// Request Safety
//--------------------------------------------------

function canRefreshDataset(name) {

    if (!DATASETS[name])
        return false;

    if (dataManagerState.paused)
        return false;

    const dataset =
        dataManagerState.datasets[name];

    if (!dataset)
        return false;

    if (dataset.refreshing)
        return false;

    return true;

}


//--------------------------------------------------
// Begin Request
//--------------------------------------------------

function beginDatasetRefresh(name) {

    if (!canRefreshDataset(name))
        return false;

    dataManagerState.datasets[name].refreshing =
        true;

    dataManagerState.datasets[name].status =
        "updating";

    dataManagerState.datasets[name].error =
        null;

    return true;

}


//--------------------------------------------------
// Complete Request
//--------------------------------------------------

function completeDatasetRefresh(
    name,
    success,
    error = null
) {

    const dataset =
        dataManagerState.datasets[name];

    if (!dataset)
        return;

    dataset.refreshing = false;

    if (success) {

        dataset.lastUpdated =
            Date.now();

        dataset.status =
            "fresh";

        dataset.error =
            null;

    } else {

        dataset.status =
            "error";

        dataset.error =
            error;

    }

}


//--------------------------------------------------
// Refresh All Required Data
//--------------------------------------------------

async function refreshData() {

    if (!dataManagerState.initialized)
        initializeDataManager();

    if (dataManagerState.paused)
        return;

    // Dataset refresh logic will be
    // implemented incrementally.

}


//--------------------------------------------------
// Refresh Individual Dataset
//--------------------------------------------------

async function refreshDataset(name) {

    if (!dataManagerState.initialized)
        initializeDataManager();

    if (!canRefreshDataset(name))
        return false;

    if (!beginDatasetRefresh(name))
        return false;

    // Actual dataset service calls will be
    // connected incrementally.

    // For now, immediately release the
    // request guard without making a request.

    completeDatasetRefresh(
        name,
        false,
        "Dataset service not connected"
    );

    return false;

}


//--------------------------------------------------
// Status
//--------------------------------------------------

function getDataStatus(name) {

    if (!dataManagerState.initialized)
        initializeDataManager();

    return dataManagerState.datasets[name] ?? null;

}


function getAllDataStatus() {

    if (!dataManagerState.initialized)
        initializeDataManager();

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