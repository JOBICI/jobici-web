'use client';

import { useParams } from 'next/navigation';
import PublicProfile from '@/components/PublicProfile';

export default function AutoEntrepreneurProfilePage() {
  const { id } = useParams<{ id: string }>();
  return <PublicProfile id={id} />;
}
