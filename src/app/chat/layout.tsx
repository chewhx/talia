import Header from "@/components/header/header";
import { ReactNode } from "react";

export default function Layout({ children }: { readonly children: ReactNode }) {
  return <Header>{children}</Header>;
}
