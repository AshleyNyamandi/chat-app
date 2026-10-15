import { aj } from "../lib/arcject.js";

export const arcjectProtect = async(req, res, next) => {

    const decision = await aj.protect(req, { requested: 5 }); // Deduct 5 tokens from the bucket

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
            message: "Too many requests"
        });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({
            message: "No bots allowed"
        });
      } else {
        return res.status(403).json({
            message: "Forbidden"
        })
      }
    } else if (decision.ip.isHosting()) {
        return res.status(403).json({
            message: "Forbidden"
        })
    } else if (decision.results.some(isSpoofedBot)) {
        return res.status(403).json({
            message: "Forbidden"
        })
    } else {
        next()
    }
}


