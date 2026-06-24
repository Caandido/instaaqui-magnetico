"use client";

import { useRef } from "react";
import { setActiveOrg } from "@/app/actions/org";
import type { OrgSummary } from "@/lib/org";

export function WorkspaceSwitcher({
  orgs,
  activeId,
}: {
  orgs: OrgSummary[];
  activeId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  if (orgs.length === 0) return null;

  return (
    <form ref={formRef} action={setActiveOrg} className="flex items-center gap-2">
      <label className="text-xs text-gray-500">Workspace:</label>
      <select
        name="orgId"
        defaultValue={activeId}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
        disabled={orgs.length === 1}
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </form>
  );
}
