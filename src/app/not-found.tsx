import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      {/* Big 404 */}
      <h1 className="mb-4 text-7xl font-bold text-[#00B894]">404</h1>

      {/* Message */}
      <h2 className="mb-3 text-2xl font-semibold text-[#2D3436]">
        Page Not Found
      </h2>
      <p className="mb-8 max-w-md text-[#636E72]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* CTA */}
      <Link href="/" passHref>
        <Button className="bg-[#0984E3] text-white hover:bg-[#086FCC]">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
