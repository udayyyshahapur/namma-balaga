// src/app/families/[id]/claim/page.tsx

import ClaimContainer from "@containers/family/claim"

export default function Page({ params }: { params: { id: string } }) {
  const familyId = Number(params.id);
  return <ClaimContainer familyId={familyId} />;
}
