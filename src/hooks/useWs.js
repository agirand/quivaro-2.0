import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export const useOrg = () => useOutletContext().org;

export function useWsRecords(entity, query = {}, sort = '-created_date', limit = 100) {
  const org = useOrg();
  return useQuery({
    queryKey: ['ws', entity, org.id, JSON.stringify(query), sort],
    queryFn: () => base44.entities[entity].filter({ org_id: org.id, ...query }, { sort, limit }).then((p) => p.items),
  });
}

export function useWsRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['ws'] });
}