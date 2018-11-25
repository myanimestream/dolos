import jQuery from "jquery";

(function (jQuery) {
    jQuery.postJSON = function (url, data) {
        return jQuery.ajax({
            type: "POST",
            contentType: "application/json",
            url,
            data: JSON.stringify(data)
        });
    }
}(jQuery));
