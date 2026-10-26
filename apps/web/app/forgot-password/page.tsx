import { Header, Footer } from "../../components/header";
import { AuthForm } from "../../components/auth-form";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="auth-card">
        <h1>Reset your password.</h1>
        <p>Your NAZU Cloud developer workspace.</p>
        <AuthForm mode="forgot-password" />
      </main>
      <Footer />
    </>
  );
}
