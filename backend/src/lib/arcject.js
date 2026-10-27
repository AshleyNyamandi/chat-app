// import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/node";
// import { isSpoofedBot } from "@arcjet/inspect";
// import { ARCJET_KEY } from "./env.js";

// export const aj = arcjet({
//   key: ARCJET_KEY, 
//   rules: [ 
//     shield({ mode: "LIVE" }),
//     detectBot({
//       mode: "LIVE", 
//       allow: [
//         "CATEGORY:SEARCH_ENGINE", 
//       ],
//     }),
//     tokenBucket({
//       mode: "LIVE",
//       refillRate: 5, // Refill 5 tokens per interval
//       interval: 10, // Refill every 10 seconds
//       capacity: 10, // Bucket capacity of 10 tokens
//     }),
//   ],
// });
