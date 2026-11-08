/* Provider civil time plus its explicit fixed offset -> an unambiguous instant.
 * Existing civil strings remain unchanged for current application consumers.
 */
(() => {
    "use strict";

    function parseConditionTime(value, utcOffsetSeconds) {
        if (typeof value !== "string" || !Number.isInteger(utcOffsetSeconds) ||
            Math.abs(utcOffsetSeconds) > 14 * 3600) return null;

        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
        if (!match) return null;
        const [year, month, day, hour, minute, second] = match.slice(1).map(part => Number(part || 0));
        const civil = new Date(0);
        civil.setUTCFullYear(year, month - 1, day);
        civil.setUTCHours(hour, minute, second, 0);
        if (civil.getUTCFullYear() !== year || civil.getUTCMonth() !== month - 1 ||
            civil.getUTCDate() !== day || civil.getUTCHours() !== hour ||
            civil.getUTCMinutes() !== minute || civil.getUTCSeconds() !== second) return null;
        return civil.getTime() - utcOffsetSeconds * 1000;
    }

    window.weatherTime = {parseConditionTime};
})();
