/**
 * Cloud authentication module for KenyaAdvert.
 * Wraps the managed OAuth provider for Google/Apple sign-in.
 */
import { lovable } from "@/integrations/lovable";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const cloudAuth = {
  signInWithOAuth: (provider: "google" | "apple", opts?: SignInOptions) =>
    lovable.auth.signInWithOAuth(provider, opts),
};
