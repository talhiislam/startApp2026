export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Welcome to Startup Project</h1>
      <a href="/auth/login" className="text-blue-500 underline">Login</a>
    </main>
  );
}