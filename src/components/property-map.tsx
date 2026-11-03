'use client';
import { APIProvider,Map,Marker } from '@vis.gl/react-google-maps';

export default function PropertyMap({latitude,longitude}:{latitude:number;longitude:number}){
  const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if(!key) return <div className="grid h-80 place-items-center rounded-2xl border border-[var(--line)] text-sm text-muted">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map.</div>;

  return (
    <div className="h-80 overflow-hidden rounded-2xl border border-[var(--line)]">
      <APIProvider apiKey={key}>
        <Map defaultCenter={{lat:latitude,lng:longitude}} defaultZoom={15} mapId="nestora-map" disableDefaultUI>
          <Marker position={{lat:latitude,lng:longitude}} />
        </Map>
      </APIProvider>
    </div>
  );
}
