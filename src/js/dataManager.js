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
    - Construct provider API requests.
    - Contain provider-specific API logic.
    - Decide how data is displayed.

The Application Service remains responsible
for communicating with its external provider.

*/


//--------------------------------------------------
// Dataset Definitions
//--------------------------------------------------

const DATASETS = {

    weather: {
        name: "weather",
        service: getCurrentWeather
    },

    marine: {
        name: "marine",
        service: getCurrentMarineConditions
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

    initialDelay:
        60 * 1000,

    maximumDelay:
        30 * 60 * 1000

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

            error: null,

            data: null

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

    dataset.refreshing =
        true;

    dataset.pendingRefresh =
        false;

    dataset.status =
        "updating";

    dataset.error =
        null;

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
        Math.pow(
            2,
            failureCount - 1
        );

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
    data = null,
    error = null
) {

    const dataset =
        dataManagerState.datasets[name];

    if (!dataset)
        return;

    dataset.refreshing =
        false;

    if (success) {

        dataset.data =
            data;

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

    }

    else {

        dataset.failureCount +=
            1;

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
// Request Pending Refresh
//--------------------------------------------------

function requestPendingRefresh(name) {

    const dataset =
        dataManagerState.datasets[name];

    if (!dataset)
        return;

    dataset.pendingRefresh =
        true;

}


//--------------------------------------------------
// Check Pending Refresh
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

async function refreshData(beach) {

    if (!dataManagerState.initialized)
        initializeDataManager();

    if (dataManagerState.paused)
        return;

    if (!beach)
        return;

    await refreshDataset(
        "weather",
        beach
    );

}


//--------------------------------------------------
// Refresh Individual Dataset
//--------------------------------------------------

async function refreshDataset(
    name,
    beach
) {

    if (!dataManagerState.initialized)
        initializeDataManager();

    if (!DATASETS[name])
        return false;

    const dataset =
        dataManagerState.datasets[name];

    //--------------------------------------------------
    // If already updating, remember the request.
    //--------------------------------------------------

    if (dataset.refreshing) {

        requestPendingRefresh(name);

        return false;

    }

    //--------------------------------------------------
    // Check normal safety rules.
    //--------------------------------------------------

    if (!canRefreshDataset(name))
        return false;

    //--------------------------------------------------
    // A service-backed dataset requires a beach.
    //--------------------------------------------------

    const service =
        DATASETS[name].service;

    if (!service)
        return false;

    if (!beach)
        return false;

    //--------------------------------------------------
    // Begin request.
    //--------------------------------------------------

    if (!beginDatasetRefresh(name))
        return false;

    try {

        const data =
            await service(beach);

        completeDatasetRefresh(
            name,
            true,
            data
        );

        return true;

    }

    catch (error) {

        completeDatasetRefresh(
            name,
            false,
            null,
            error
        );

        return false;

    }

}


//--------------------------------------------------
// Retrieve Stored Data
//--------------------------------------------------

function getDatasetData(name) {

    if (!dataManagerState.initialized)
        initializeDataManager();

    const dataset =
        dataManagerState.datasets[name];

    if (!dataset)
        return null;

    return dataset.data;

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

    dataManagerState.paused =
        true;

}


function resumeDataUpdates() {

    dataManagerState.paused =
        false;

}