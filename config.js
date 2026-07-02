(function () {
    const localHosts = ["localhost", "127.0.0.1"];
    const localBackend = "http://127.0.0.1:5000";
    const localDeliveryBackend = "http://127.0.0.1:5050";
    const productionBackend = "https://maggy-bazaar-backend.onrender.com";
    const productionDeliveryBackend = "https://mb-delivery-backend.onrender.com";
    const isLocal = localHosts.includes(window.location.hostname);
    const configuredBase = window.API_BASE_URL || "";
    const configuredDeliveryBase = window.DELIVERY_API_BASE_URL || "";

    window.API_BASE_URL = configuredBase || (isLocal ? localBackend : productionBackend);
    window.DELIVERY_API_BASE_URL = configuredDeliveryBase || (isLocal ? localDeliveryBackend : productionDeliveryBackend);

    window.apiPath = function apiPath(path) {
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;
        return `${window.API_BASE_URL}${normalizedPath}`;
    };

    window.deliveryApiPath = function deliveryApiPath(path) {
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;
        return `${window.DELIVERY_API_BASE_URL}${normalizedPath}`;
    };
})();