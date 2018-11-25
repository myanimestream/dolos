import jQuery from "jquery";
import Raven from "raven-js";

jQuery(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
    Raven.captureMessage(thrownError || jqXHR.statusText, {
        extra: {
            type: ajaxSettings.type,
            url: ajaxSettings.url,
            data: ajaxSettings.data,
            status: jqXHR.status,
            error: thrownError || jqXHR.statusText,
            response: jqXHR.responseText.substring(0, 100)
        }
    });
});