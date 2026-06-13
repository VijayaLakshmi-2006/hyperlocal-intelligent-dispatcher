export const getAgentSearchRadiusMeters = () =>
  Number(process.env.AGENT_SEARCH_RADIUS_METERS || 5000);

export const getOnlineAgentWindowMinutes = () =>
  Number(process.env.ONLINE_AGENT_WINDOW_MINUTES || 15);

export const isValidCoordinate = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const normalizeAddressLocation = (location, fallbackAddress = "") => {
  const source = location || {};
  const latitude = source.latitude ?? source.lat;
  const longitude = source.longitude ?? source.lng;
  const address = source.address || fallbackAddress || "";

  if (!address.trim()) {
    return {
      error: "Address is required",
    };
  }

  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return {
      value: {
        address: address.trim(),
        latitude: null,
        longitude: null,
      },
    };
  }

  if (!isValidCoordinate(latitude, longitude)) {
    return {
      error: "Latitude and longitude must be valid coordinates",
    };
  }

  return {
    value: {
      address: address.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
    },
  };
};

export const toGeoPoint = (location) => {
  if (!location || !isValidCoordinate(location.latitude, location.longitude)) {
    return undefined;
  }

  return {
    type: "Point",
    coordinates: [Number(location.longitude), Number(location.latitude)],
  };
};

export const haversineDistanceMeters = (from, to) => {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getOnlineSinceDate = () =>
  new Date(Date.now() - getOnlineAgentWindowMinutes() * 60 * 1000);
