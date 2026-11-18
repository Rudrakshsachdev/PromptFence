import { redirect } from 'next/navigation';

/** `/security` has no content of its own (breadcrumb parent); send it to the workspace. */
export default function SecurityIndexPage() {
  redirect('/security/researcher');
}
