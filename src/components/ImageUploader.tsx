import { useRef, useState } from 'react';
import { uploadImage, uploadImages } from '../api';
import { Spinner } from './ui';
import type { Img } from '../types';

interface BaseProps {
  label?: string;
}
type SingleProps = BaseProps & { multiple?: false; value?: Img; onChange: (img?: Img) => void };
type MultiProps = BaseProps & { multiple: true; value: Img[]; onChange: (imgs: Img[]) => void };

/**
 * Uploads image files to Cloudinary via the backend and returns {url, publicId}.
 * Falls back to pasting a URL when Cloudinary isn't configured (or by choice).
 */
export function ImageUploader(props: SingleProps | MultiProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlText, setUrlText] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      if (props.multiple) {
        const uploaded = await uploadImages(Array.from(files));
        props.onChange([...props.value, ...uploaded.map((u) => ({ url: u.url, publicId: u.publicId }))]);
      } else {
        const u = await uploadImage(files[0]);
        props.onChange({ url: u.url, publicId: u.publicId });
      }
    } catch (e) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Upload failed',
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const addUrl = () => {
    const url = urlText.trim();
    if (!url) return;
    if (props.multiple) props.onChange([...props.value, { url }]);
    else props.onChange({ url });
    setUrlText('');
  };

  const gallery = props.multiple ? props.value : props.value ? [props.value] : [];

  return (
    <div>
      {props.label && <p className="mb-2 text-sm font-medium text-charcoal/70">{props.label}</p>}

      <div className="flex flex-wrap gap-3">
        {gallery.map((img, i) => (
          <div key={img.url + i} className="relative h-24 w-20 overflow-hidden rounded-lg ring-1 ring-black/10">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() =>
                props.multiple
                  ? props.onChange(props.value.filter((_, idx) => idx !== i))
                  : props.onChange(undefined)
              }
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-24 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-brand/40 text-xs text-brand-deep hover:bg-brand-soft/30 disabled:opacity-50"
        >
          {busy ? <Spinner /> : <><span className="text-lg leading-none">＋</span>Upload</>}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        multiple={props.multiple}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {/* URL fallback (useful before Cloudinary is configured) */}
      <div className="mt-2 flex items-center gap-2">
        <input
          className="tf text-xs"
          placeholder="…or paste an image URL"
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
        />
        <button type="button" onClick={addUrl} className="shrink-0 text-xs font-medium text-brand-deep hover:underline">
          Add
        </button>
      </div>
    </div>
  );
}
