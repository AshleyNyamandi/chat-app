import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeEmail = (email, name, clientURL) => {
const { data, error } = await resendClient.emails.send({
    from:  `${sender.name} ${sender.email}`,
    to: email,
    subject: "Welcome to chat Nymd",
    html: createWelcomeEmailTemplate(sender.email, clientURL),
  });       
  if (error) {
    return res.status(400).json({ error });
  }

  res.status(200).json({ data });
 
}