import { VercelRequest, VercelResponse } from "@vercel/node";
import { DemoResponse } from "../shared/api";

export default async (req: VercelRequest, res: VercelResponse) => {
  const response: DemoResponse = {
    message: "Hello from Vercel serverless function",
  };
  res.status(200).json(response);
};
