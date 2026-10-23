"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="login">
      <section className="panel">
        <h1>Não foi possível carregar os dados</h1>
        <p>Confira a disponibilidade do banco e tente novamente.</p>
        <button onClick={reset}>Tentar novamente</button>
      </section>
    </main>
  );
}
