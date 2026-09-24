export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>PASTY</h1>
      <p>Backend base ready. Use /api/health, /api/gists, /api/rooms.</p>
      <ul>
        <li>
          <code>POST /api/gists</code> multipart: code, title, ttlHours, screenshots (max 5 images), files (max 5)
        </li>
        <li>
          <code>GET /api/gists?id=xxxx</code> or <code>GET /api/gists/[id]</code> read one, paged list via ?page&amp;limit
        </li>
        <li>
          <code>POST /api/rooms</code> JSON: name, ttlHours -&gt; 6-char code
        </li>
        <li>
          <code>GET /api/rooms/[code]</code> room + entries
        </li>
        <li>
          <code>POST /api/rooms/[code]/entries</code> multipart: code, title, screenshots, files
        </li>
      </ul>
    </main>
  );
}
