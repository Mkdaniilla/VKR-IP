import type { NextApiRequest, NextApiResponse } from "next";
import { getApiUrl } from "../../lib/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiUrl = getApiUrl();
  try {
    await fetch(`${apiUrl}/auth/logout`, { method: "POST", headers: { cookie: req.headers.cookie || "" } });
  } catch { }
  res.writeHead(302, { Location: "/login" });
  res.end();
}
