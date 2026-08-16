import CampusExplorer from "@/components/campus/explorer";
import DecorEllipse from "@/components/site/ellipse";

export default function MapSection() {
  return (
    <section id="map" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
      <DecorEllipse className="orbit pointer-events-none absolute left-[-8%] top-[10%] h-[55%] w-[50%] text-fg/15" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— Find your way</p>
        <h2 className="mt-4 font-serif text-[16vw] font-bold leading-[0.85] text-fg lg:text-[11vw]">
          Campus Map
        </h2>

        <CampusExplorer className="mt-10" />
      </div>
    </section>
  );
}
