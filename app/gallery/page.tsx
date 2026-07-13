const photos = Array.from({ length: 9 }, (_, i) => i + 1);

export default function GalleryPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Gallery</h1>
      <p className="mt-4 text-neutral-600">
        Photos from past orientation events. Real images will replace these
        placeholders.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.map((n) => (
          <div
            key={n}
            className="flex aspect-square items-center justify-center rounded-lg bg-neutral-200 text-neutral-400"
          >
            Photo {n}
          </div>
        ))}
      </div>
    </main>
  );
}
