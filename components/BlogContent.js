/** Renders blog body — paragraphs separated by blank lines */
export default function BlogContent({ content, className = '' }) {
  if (!content) return null;
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());
  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-vd-text-sub text-base leading-relaxed whitespace-pre-line">
          {para.trim()}
        </p>
      ))}
    </div>
  );
}
