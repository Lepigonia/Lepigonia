// Legacy alias used by /login. The logic (rate limit, password, optional 2FA, session) lives in one place only.
import { POST as adminLogin } from "../../admin/login/route";

export async function POST(request) {
  return adminLogin(request);
}