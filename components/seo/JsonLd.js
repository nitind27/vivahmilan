/**
 * Renders JSON-LD structured data for search engines.
 * Safe to use in Server Components (root layout).
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
