import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-card-gradient border border-border rounded-xl p-8 shadow-dramatic">
            <h1 className="text-2xl font-display font-bold text-foreground text-center mb-2">Reset Password</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {sent ? "Check your email for a password reset link." : "Enter your email to receive a password reset link."}
            </p>

            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="Email address"
                    className="w-full rounded-lg bg-secondary/80 border border-border pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-body text-sm"
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 font-medium text-sm hover:opacity-90 disabled:opacity-50">
                  {loading ? "Sending..." : "Send Reset Link"} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="text-center">
                <p className="text-sm text-primary bg-primary/10 rounded-lg px-3 py-3 mb-4">
                  A password reset link has been sent to <strong>{email}</strong>. Check your inbox.
                </p>
              </div>
            )}

            <Link to="/auth" className="flex items-center gap-2 justify-center mt-6 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
