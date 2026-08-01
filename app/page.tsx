'use client'; // Required to use useEffect and useRouter

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // This waits until the component safely mounts, preventing hook mismatch errors
    router.push('/userinterface/home');
  }, [router]);

  return null; // Render nothing safely while redirecting
}