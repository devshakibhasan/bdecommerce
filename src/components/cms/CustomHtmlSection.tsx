import DOMPurify from 'dompurify';

interface CustomHtmlSectionProps {
  config: {
    html: string;
    container?: boolean;
    padding?: string;
  };
}

export function CustomHtmlSection({ config }: CustomHtmlSectionProps) {
  if (!config?.html) return null;

  const content = (
    <div 
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: typeof window !== 'undefined' ? DOMPurify.sanitize(config.html) : '' }}
      className={`custom-html-wrapper ${config.padding || 'py-8'}`}
    />
  );

  if (config.container !== false) {
    return (
      <div className="container mx-auto px-4">
        {content}
      </div>
    );
  }

  return content;
}
