// Composant serveur : injecte un bloc de données structurées JSON-LD
// (schema.org) dans le HTML pour les résultats enrichis Google.
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
