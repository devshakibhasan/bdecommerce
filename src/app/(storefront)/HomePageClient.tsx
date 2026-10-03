'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SectionRenderer } from '@/components/cms/SectionRenderer';
import { PageSection } from '@/types';

interface HomePageClientProps {
  initialSections: PageSection[];
}

export function HomePageClient({ initialSections }: HomePageClientProps) {
  const { data: sections = initialSections } = useQuery<PageSection[]>({
    queryKey: ['cms-homepage-sections-v9'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/content/homepage');
        const list = res?.data?.sections || res?.sections;
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      } catch (err) {
        /* silenced fallback */
      }
      return initialSections;
    },
    initialData: initialSections,
    staleTime: 60 * 1000,
  });

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <SectionRenderer sections={sections} />
    </div>
  );
}
