import { useLocaleStore } from '@/lib/store';
import DOMPurify from 'dompurify';

interface RichTextSectionProps {
  config: {
    title_en?: string;
    title_bn?: string;
    content_en: string;
    content_bn?: string;
    align?: 'left' | 'center' | 'right';
    max_width?: 'md' | 'lg' | 'xl' | 'full';
  };
}

export function RichTextSection({ config }: RichTextSectionProps) {
  const { locale } = useLocaleStore();
  const safeConfig = config || { content_en: '' };

  const rawTitle = locale === 'bn'
    ? (safeConfig.title_bn || safeConfig.title_en || '')
    : (safeConfig.title_en || safeConfig.title_bn || '');

  const rawContent = locale === 'bn' 
    ? (safeConfig.content_bn || safeConfig.content_en || '') 
    : (safeConfig.content_en || safeConfig.content_bn || '');

  // If content does not have HTML tags, convert plain text newlines into paragraphs
  const hasHtml = /<[a-z][\s\S]*>/i.test(rawContent);
  const formattedContent = hasHtml
    ? rawContent
    : rawContent
        .split(/\n\s*\n/)
        .filter(p => p.trim().length > 0)
        .map(p => `<p class="mb-4 leading-relaxed">${p.replace(/\n/g, '<br />')}</p>`)
        .join('');

  const content = typeof window !== 'undefined' ? DOMPurify.sanitize(formattedContent) : '';

  const maxWidthClasses = {
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
    full: 'w-full',
  }[safeConfig.max_width || 'lg'] || 'max-w-5xl';

  const alignClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right',
  }[safeConfig.align || 'left'] || 'text-left';

  if (!content && !rawTitle) return null;

  return (
    <section className="py-12 bg-background">
      <div className={`container mx-auto px-4 ${maxWidthClasses}`}>
        {rawTitle && (
          <h2 className={`text-2xl sm:text-3xl font-black text-foreground mb-6 ${alignClasses}`}>
            {rawTitle}
          </h2>
        )}
        {content && (
          <div 
            className={`prose dark:prose-invert max-w-none text-foreground/90 ${alignClasses}`}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </section>
  );
}
