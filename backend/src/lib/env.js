import dotenv from "dotenv";

dotenv.config()

export const {
    PORT,
    MONGO_URI,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    RESEND_API_KEY,
    EMAIL_FROM,
    EMAIL_FROM_NAME,
    CLIENT_URL,
    SUPABASE_SERVICE_ROLE, 
    SUPABASE_URL,
    ARCJET_KEY,
    NODE_ENV 
} = process.env;