import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths bug in Vite/Webpack build
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom markers for complaints and workers
const getComplaintIcon = (priority) => {
  let color = '#3b82f6'; // blue (low/medium)
  if (priority === 'critical') color = '#ef4444'; // red
  if (priority === 'high') color = '#f97316'; // orange

  const svgHtml = `
    <svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="${color}" stroke="white" stroke-width="8" />
      <circle cx="50" cy="50" r="15" fill="white" />
    </svg>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const getWorkerIcon = (status) => {
  let color = '#10b981'; // green (available)
  if (status === 'busy') color = '#eab308'; // yellow
  if (status === 'offline') color = '#6b7280'; // grey

  const svgHtml = `
    <svg width="34" height="34" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="25" width="50" height="50" rx="10" fill="${color}" stroke="white" stroke-width="8" />
      <circle cx="50" cy="50" r="10" fill="white" />
    </svg>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

// Map panning watcher
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Map click detector
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

const InteractiveMap = ({ 
  center = [17.385044, 78.486671], 
  zoom = 13, 
  complaints = [], 
  workers = [], 
  onMapClick = null,
  selectedCoord = null,
  onComplaintSelect = null 
}) => {
  const [mapCenter, setMapCenter] = useState(center);

  useEffect(() => {
    if (selectedCoord) {
      setMapCenter([selectedCoord.lat, selectedCoord.lng]);
    }
  }, [selectedCoord]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border dark:border-slate-800 border-slate-200 shadow-inner relative min-h-[400px]">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={mapCenter} />
        
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {/* Selected placement marker pin */}
        {selectedCoord && (
          <Marker position={[selectedCoord.lat, selectedCoord.lng]}>
            <Popup>
              <div className="text-xs font-bold">Issue Reporting Location</div>
            </Popup>
          </Marker>
        )}

        {/* Complaint marker pins */}
        {complaints.map((c) => {
          if (!c.lat || !c.lng) return null;
          return (
            <Marker 
              key={c.id || c._id} 
              position={[c.lat, c.lng]} 
              icon={getComplaintIcon(c.priority)}
            >
              <Popup>
                <div className="p-1 min-w-[150px] text-xs">
                  <div className="flex justify-between items-center pb-1 mb-1 border-b">
                    <span className="font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">{c.category}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase ${
                      c.priority === 'critical' ? 'bg-red-500' : c.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>{c.priority}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-300 font-medium mb-2">{c.address}</p>
                  <p className="text-[10px] text-slate-400 font-semibold italic">Status: {c.status.replace('_', ' ')}</p>
                  {onComplaintSelect && (
                    <button 
                      onClick={() => onComplaintSelect(c)}
                      className="mt-2 w-full py-1 bg-brand-500 text-white font-bold rounded text-[10px] text-center uppercase tracking-wider"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Worker marker pins */}
        {workers.map((w) => {
          if (!w.lat || !w.lng) return null;
          return (
            <Marker 
              key={w.id || w._id} 
              position={[w.lat, w.lng]} 
              icon={getWorkerIcon(w.status)}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">Worker Pin</div>
                  <p className="text-slate-500 dark:text-slate-200 mt-1 font-semibold">Name: {w.User?.name || 'Technician'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Status: <span className="capitalize">{w.status}</span></p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Map Legend overlay info */}
      <div className="absolute bottom-4 left-4 z-40 bg-white/95 dark:bg-darkbg-800/95 p-3 rounded-xl border dark:border-slate-700 shadow-md text-[10px] space-y-1.5">
        <div className="font-bold border-b pb-1 dark:border-slate-700">MAP LEGEND</div>
        <div className="flex items-center gap-2 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          <span>Critical Severity</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          <span>High Severity</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span>Medium/Low</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
          <span>Worker (Available)</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <span className="w-3 h-3 rounded bg-yellow-500 inline-block" />
          <span>Worker (Busy)</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
