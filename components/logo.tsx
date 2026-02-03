"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
  asLink?: boolean;
}

export function Logo({
  className,
  onClick,
  size = "small",
  asLink = true,
}: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use dark.png for light mode, light.png for dark mode
  const logoSrc =
    !mounted || theme === "light"
      ? "/(((o)))(dark).png"
      : "/(((o)))(light).png";

  const sizeMap = {
    small: { width: 73, height: 32 },
    medium: { width: 146, height: 64 },
    large: { width: 256, height: 152 },
  };

  const dimensions = sizeMap[size];

  const imageElement = (
    <Image
      alt="(((O)))"
      className="transition-opacity hover:opacity-100"
      height={dimensions.height}
      src={logoSrc}
      width={dimensions.width}
    />
  );

  if (asLink) {
    return (
      <Link className={className} href="/" onClick={onClick}>
        {imageElement}
      </Link>
    );
  }

  return <div className={className}>{imageElement}</div>;
}
