import React, { useRef, useEffect } from "react";
import { X, Download } from "lucide-react";

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (imageUrl) {
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [imageUrl]);

  if (!imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `loopin-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <dialog
      ref={dialogRef}
      className="lightbox-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="lightbox-wrapper">
        <div className="lightbox-toolbar">
          <button
            type="button"
            className="lightbox-btn"
            onClick={handleDownload}
            title="Download image"
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            className="lightbox-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Expanded chat upload"
          className="lightbox-image"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </dialog>
  );
};
