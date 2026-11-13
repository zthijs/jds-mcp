export const SERVER_NAME = "jds-mcp";
export const SERVER_VERSION = "0.1.0";

export const USER_AGENT = `${SERVER_NAME}/${SERVER_VERSION}`;

export const SITE_URL = "https://www.autocentrumjds.nl/";
export const OCCASIONS_URL = `${SITE_URL}occasions/`;

/** Pages are cached briefly so a search → details → compare flow hits the site once per page. */
export const CACHE_TTL_MS = 5 * 60 * 1000;
export const REQUEST_TIMEOUT_MS = 15_000;
