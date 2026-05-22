import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DriverMap = ({ driverLocation, patientLocation }) => {

  if (!driverLocation) return null;

  const route = patientLocation
    ? [
      [driverLocation.lat, driverLocation.lng],
      [patientLocation.lat, patientLocation.lng]
    ]
    : [];

  return (
    <MapContainer
      center={[driverLocation.lat, driverLocation.lng]}
      zoom={13}
      style={{ height: "350px", width: "100%", marginTop: "20px" }}
    >
      <TileLayer
        attribution="OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Driver */}
      <Marker position={[driverLocation.lat, driverLocation.lng]} />

      {/* Patient */}
      {patientLocation && (
        <Marker position={[patientLocation.lat, patientLocation.lng]} />
      )}

      {/* Route */}
      {route.length === 2 && (
        <Polyline positions={route} />
      )}
    </MapContainer>
  );
};

export default DriverMap;