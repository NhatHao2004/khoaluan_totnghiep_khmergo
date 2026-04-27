import { useState } from 'react';

export const useTemples = () => {
  const [temples, setTemples] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    // Stub implementation
  };

  return { temples, loading, error, refresh };
};
