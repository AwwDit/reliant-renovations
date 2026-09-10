import Image from "next/image";

export function BrandLogo({
  className,
  width,
  height,
  preload = false,
}: {
  className: string;
  width: number;
  height: number;
  preload?: boolean;
}) {
  return (
    <>
      <Image
        src="/images/brand/reliant-color-transparent.png"
        alt="Reliant Renovations Inc."
        width={width}
        height={height}
        preload={preload}
        className={`${className} theme-logo-light`}
      />
      <Image
        src="/images/brand/reliant-white-transparent.png"
        alt="Reliant Renovations Inc."
        width={width}
        height={height}
        className={`${className} theme-logo-dark`}
      />
    </>
  );
}
