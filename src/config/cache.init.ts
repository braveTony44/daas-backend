import NodeCache from "node-cache";

export const cache = new NodeCache();
// cahced for certain time
// export const containerCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });