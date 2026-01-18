import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    await fetch(`${apiUrl}/auth/logout`, { method: "POST", headers: { cookie: req.headers.cookie || "" } });
  } catch {}
  res.writeHead(302, { Location: "/login" });
  res.end();
}
