import { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  const ping = process.env.PING_MESSAGE ?? "ping";
  res.status(200).json({ message: ping });
};
