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
    safety, pending-refresh, and failure/backoff
    architecture.

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
// Retry Policy
//--------------------------------------------------

const RETRY_POLICY = {

    initialDelay: 60 * 1000,

    maximumDelay: 30 * 60 * 1000

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

            retryAt: null,

            status: "unknown",

            refreshing: false,

            pendingRefresh: false,

            failureCount: 0,

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

    //--------------------------------------------------
    // Do not retry before the retry time.
    //--------------------------------------------------

    if (
        dataset.retryAt !== null &&
        Date.now() < dataset.retryAt
    ) {

        return false;

    }

    return true;

}


//--------------------------------------------------
// Begin Request
//--------------------------------------------------

function beginDatasetRefresh(name) {

    if (!canRefreshDataset(name))
        return false;

    const dataset =
        dataManagerState.datasets[name];

    dataset.refreshing = true;

    dataset.pendingRefresh = false;

    dataset.status = "updating";

    dataset.error = null;

    return true;

}


//--------------------------------------------------
// Calculate Retry Delay
//--------------------------------------------------

function getRetryDelay(failureCount) {

    if (failureCount <= 0)
        return RETRY_POLICY.initialDelay;

    const delay =
        RETRY_POLICY.initialDelay *
        Math.pow(2, failureCount - 1);

    return Math.min(
        delay,
        RETRY_POLICY.maximumDelay
    );

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

        dataset.nextUpdate =
            null;

        dataset.retryAt =
            null;

        dataset.status =
            "fresh";

        dataset.failureCount =
            0;

        dataset.error =
            null;

    } else {

        dataset.failureCount += 1;

        const retryDelay =
            getRetryDelay(
                dataset.failureCount
            );

        dataset.retryAt =
            Date.now() + retryDelay;

        dataset.status =
            "error";

        dataset.error =
            error;

    }

}


//--------------------------------------------------
// Request a Pending Refresh
//--------------------------------------------------

function requestPendingRefresh(name) {

    const dataset =
        dataManagerState.datasets[name];

    if (!dataset)
        return;

    dataset.pendingRefresh = true;

}


//--------------------------------------------------
// Check for Pending Refresh
//--------------------------------------------------

function hasPendingRefresh(name) {

    const dataset =
        dataManagerState.datasets[name];

    if (!dataset)
        return false;

    return dataset.pendingRefresh;

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

    //--------------------------------------------------
    // If a request is already running, remember
    // that another refresh was requested.
    //--------------------------------------------------

    if (
        dataManagerState.datasets[name] &&
        dataManagerState.datasets[name].refreshing
    ) {

        requestPendingRefresh(name);

        return false;

    }

    //--------------------------------------------------
    // Check normal request safety rules.
    //--------------------------------------------------

    if (!canRefreshDataset(name))
        return false;

    //--------------------------------------------------
    // Begin the request.
    //--------------------------------------------------

    if (!beginDatasetRefresh(name))
        return false;

    //--------------------------------------------------
    // Actual dataset service calls will be
    // connected incrementally.
    //--------------------------------------------------

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