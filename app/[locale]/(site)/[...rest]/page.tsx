import { notFound } from "next/navigation";

// Unknown paths under a valid locale land here so the 404 renders inside the
// locale layout (header/footer) instead of the bare global 404.
export const dynamicParams = true;

export default function UnknownPath() {
  notFound();
}
