"use client";
import Image from "@/components/site-image";
import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ArrowLeft, ArrowRight, ArrowsOut } from "@phosphor-icons/react";
import type { ProjectImage } from "@/lib/types";
export function ProjectGallery({
  images,
  title,
}: {
  images: ProjectImage[];
  title: string;
}) {
  const [index, setIndex] = useState(0),
    [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const move = (amount: number) =>
    setIndex((i) => (i + amount + images.length) % images.length);
  if (!images.length) return null;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="case-gallery">
        {images.map((photo, i) => (
          <Dialog.Trigger asChild key={`${photo.src}-${i}`}>
            <button
              className={`gallery-photo gallery-photo-${i}`}
              onClick={(e) => {
                opener.current = e.currentTarget;
                setIndex(i);
              }}
              aria-label={`Open photo ${i + 1}: ${photo.alt}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={i === 0 ? "100vw" : "(max-width: 767px) 100vw, 50vw"}
                priority={i === 0}
              />
              <span className="expand-image">
                <ArrowsOut size={22} />
              </span>
            </button>
          </Dialog.Trigger>
        ))}
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="lightbox-overlay" />
        <Dialog.Content
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            opener.current?.focus();
          }}
          className="lightbox"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") move(-1);
            if (e.key === "ArrowRight") move(1);
          }}
        >
          <Dialog.Title className="sr-only">{title} gallery</Dialog.Title>
          <Dialog.Description className="sr-only">
            Use the previous and next buttons or arrow keys to browse. Escape
            closes the gallery.
          </Dialog.Description>
          <Dialog.Close
            className="icon-button lightbox-close"
            aria-label="Close gallery"
          >
            <X size={28} />
          </Dialog.Close>
          <div className="lightbox-image">
            <Image
              src={images[index].src}
              alt={images[index].alt}
              fill
              sizes="90vw"
              className="contain-image"
            />
          </div>
          <div className="lightbox-controls">
            <button
              className="icon-button"
              onClick={() => move(-1)}
              aria-label="Previous photo"
            >
              <ArrowLeft size={24} />
            </button>
            <span aria-live="polite">
              {index + 1} / {images.length}
            </span>
            <button
              className="icon-button"
              onClick={() => move(1)}
              aria-label="Next photo"
            >
              <ArrowRight size={24} />
            </button>
          </div>
          <p className="lightbox-caption">{images[index].alt}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
