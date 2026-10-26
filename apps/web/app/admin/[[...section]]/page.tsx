import { notFound, redirect } from "next/navigation";
import { supabase } from "../../../lib/auth";
export const dynamic = "force-dynamic";
export default async function Admin() {
  let allowed = false;
  try {
    const { data } = await (await supabase()).auth.getUser();
    if (!data.user) redirect("/login");
    allowed =
      (process.env.ADMIN_USER_IDS ?? "").split(",").includes(data.user.id) &&
      data.user.app_metadata?.nazu_admin === true;
  } catch {
    notFound();
  }
  if (!allowed) notFound();
  return (
    <main id="main" className="page-content">
      <h1>Operations console</h1>
      <div className="notice">
        Admin access authorized server-side. Operational actions and system
        metrics are not implemented. No privileged actions are exposed.
      </div>
    </main>
  );
}
