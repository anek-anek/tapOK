import { redirect } from 'next/navigation';

export default async function EditDropPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/drops/${id}`);
}
