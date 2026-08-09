interface ClientLogoProps {
  name: string;
  size?: number;
}

export function ClientLogo({ name, size = 48 }: ClientLogoProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-hover font-semibold text-white shadow-sm"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
