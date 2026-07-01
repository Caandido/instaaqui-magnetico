// Logo da marca: pin de localização verde ("Aqui") + wordmark.

export function BrandLogo({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pin =
    size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const text =
    size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";
  // Pin sempre com um brilho verde; nas telas grandes ele pulsa e flutua.
  const pinAnim =
    size === "lg" ? "animate-glow animate-floaty" : "brand-glow";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-tight ${text} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${pin} ${pinAnim} text-brand-500`}
        aria-hidden="true"
      >
        <path
          d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 10.5A2.5 2.5 0 1 1 12 7.5a2.5 2.5 0 0 1 0 5z"
          fill="currentColor"
        />
      </svg>
      <span>
        InstaAqui <span className="text-brand-400">Magnético</span>
      </span>
    </span>
  );
}
