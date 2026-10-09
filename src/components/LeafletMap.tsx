import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { apiService, PoskoItem } from '../services/api';

export interface LocationInfo {
  lat: number;
  lng: number;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  poskoName: string;
}

interface LeafletMapProps {
  operational?: boolean;
  hideCard?: boolean;
  selectedPoskoId?: number;
  onSelectPosko?: (posko: PoskoItem) => void;
  showRoute?: boolean;
  pickLocation?: boolean;
  initialLat?: number;
  initialLng?: number;
  onLocationPicked?: (info: LocationInfo) => void;
}

export function LeafletMap({
  operational = false,
  hideCard = false,
  selectedPoskoId,
  onSelectPosko,
  showRoute = false,
  pickLocation = false,
  initialLat = -7.3300, // Default to Surabaya coordinates
  initialLng = 112.7250,
  onLocationPicked,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const citizenMarkerRef = useRef<L.Marker | null>(null);

  const [citizenPos, setCitizenPos] = useState<[number, number]>([initialLat, initialLng]);
  const [activeAddress, setActiveAddress] = useState<string>("Mendeteksi titik lokasi...");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  const [poskos, setPoskos] = useState<PoskoItem[]>([
    {
      id: 1,
      kode_posko: 'PSK-01',
      nama_posko: 'Posko BPBD Provinsi Jawa Timur (Komando Wilayah)',
      penanggung_jawab_nama: 'Siti Rahma',
      telepon: '+62 812 8899 1102',
      desa: 'Gayungan / Siwalankerto',
      kecamatan: 'Gayungan',
      kabupaten: 'Kota Surabaya',
      provinsi: 'Jawa Timur',
      latitude: -7.3305,
      longitude: 112.7255,
      kapasitas_kk: 250,
      kk_terdata: 120,
      status_operasional: 'Aktif',
    },
    {
      id: 2,
      kode_posko: 'PSK-02',
      nama_posko: 'Posko Induk 01 - Balai Desa Sukamaju (BPBD Wilayah)',
      penanggung_jawab_nama: 'Bambang Sudirja',
      telepon: '+62 813 5566 7788',
      desa: 'Desa Sukamaju',
      kecamatan: 'Cibadak',
      kabupaten: 'Kabupaten Sukabumi',
      provinsi: 'Jawa Barat',
      latitude: -6.9174639,
      longitude: 106.9298281,
      kapasitas_kk: 200,
      kk_terdata: 87,
      status_operasional: 'Aktif',
    },
    {
      id: 3,
      kode_posko: 'PSK-03',
      nama_posko: 'Posko Induk BPBD DKI Jakarta',
      penanggung_jawab_nama: 'Rahmat Hidayat',
      telepon: '+62 817 9900 1122',
      desa: 'Menteng',
      kecamatan: 'Menteng',
      kabupaten: 'Kota Jakarta Pusat',
      provinsi: 'DKI Jakarta',
      latitude: -6.1865,
      longitude: 106.8340,
      kapasitas_kk: 300,
      kk_terdata: 150,
      status_operasional: 'Aktif',
    },
  ]);

  const [activePosko, setActivePosko] = useState<PoskoItem>(poskos[0]);

  // Robust regional fallback resolver
  const resolveFallbackLocation = useCallback((lat: number, lng: number): LocationInfo => {
    // East Java
    if (lat < -6.8 && lat > -8.9 && lng > 111.0 && lng < 115.0) {
      const isGayungan = Math.hypot(lat - (-7.3300), lng - 112.7250) < 0.04;
      const isWonokromo = Math.hypot(lat - (-7.3000), lng - 112.7400) < 0.05;
      const isRungkut = Math.hypot(lat - (-7.3200), lng - 112.7800) < 0.06;
      const isGubeng = Math.hypot(lat - (-7.2700), lng - 112.7550) < 0.05;

      const desa = isGayungan ? "Gayungan / Siwalankerto" : isWonokromo ? "Wonokromo" : isRungkut ? "Rungkut Menanggal" : isGubeng ? "Gubeng" : "Surabaya";
      const kecamatan = isGayungan ? "Gayungan" : isWonokromo ? "Wonokromo" : isRungkut ? "Rungkut" : isGubeng ? "Gubeng" : "Kec. Kota";
      const kabupaten = "Kota Surabaya";
      const provinsi = "Jawa Timur";
      const poskoName = "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)";

      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        poskoName,
      };
    }

    // West Java & Sukabumi
    if (lat < -6.4 && lat > -7.8 && lng > 106.4 && lng < 108.8) {
      const isCibadak = Math.hypot(lat - (-6.9174639), lng - 106.9298281) < 0.15;
      const isBandung = Math.hypot(lat - (-6.9175), lng - 107.6191) < 0.2;

      const desa = isCibadak ? "Desa Sukamaju" : isBandung ? "Kel. Braga" : "Wilayah Jawa Barat";
      const kecamatan = isCibadak ? "Cibadak" : isBandung ? "Sumur Bandung" : "Kecamatan Setempat";
      const kabupaten = isCibadak ? "Kabupaten Sukabumi" : isBandung ? "Kota Bandung" : "Jawa Barat";
      const provinsi = "Jawa Barat";
      const poskoName = isCibadak ? "Posko Induk 01 - Balai Desa Sukamaju (BPBD Wilayah)" : `Posko BPBD ${kabupaten} (Jawa Barat)`;

      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        poskoName,
      };
    }

    // DKI Jakarta
    if (lat < -6.0 && lat > -6.4 && lng > 106.6 && lng < 107.1) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        desa: "Kel. Menteng",
        kecamatan: "Menteng",
        kabupaten: "Kota Jakarta Pusat",
        provinsi: "DKI Jakarta",
        poskoName: "Posko Induk BPBD DKI Jakarta",
      };
    }

    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      desa: "Wilayah Warga Terdampak",
      kecamatan: "Kecamatan Setempat",
      kabupaten: "Kabupaten/Kota Terkait",
      provinsi: "Indonesia",
      poskoName: "Posko Induk BPBD Wilayah",
    };
  }, []);

  const onLocationPickedRef = useRef(onLocationPicked);
  onLocationPickedRef.current = onLocationPicked;

  // Multi-Engine Accurate Reverse Geocoding
  const updateCitizenLocation = useCallback(async (lat: number, lng: number) => {
    setCitizenPos([lat, lng]);

    const fallback = resolveFallbackLocation(lat, lng);
    const initialText = `${fallback.desa}, Kec. ${fallback.kecamatan}, ${fallback.kabupaten}`;
    setActiveAddress(initialText);

    let resolved = false;

    // 1. BigDataCloud Reverse Geocoder (High speed, specific to ID)
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`;
      const res = await fetch(bdcUrl);
      if (res.ok) {
        const data = await res.json();
        const prov = data.principalSubdivision || fallback.provinsi;
        const kab = data.city || data.localityInfo?.administrative?.[2]?.name || data.localityInfo?.administrative?.[1]?.name || fallback.kabupaten;
        const kec = data.localityInfo?.administrative?.[3]?.name || data.locality || fallback.kecamatan;
        const desa = data.localityInfo?.administrative?.[4]?.name || data.locality || kec;

        const info: LocationInfo = {
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          desa: (desa || fallback.desa).replace(/Kelurahan\s+/i, "Kel. ").replace(/Desa\s+/i, "Desa "),
          kecamatan: (kec || fallback.kecamatan).replace(/Kecamatan\s+/i, ""),
          kabupaten: (kab || fallback.kabupaten),
          provinsi: (prov || fallback.provinsi),
          poskoName: (prov.includes("Jawa Barat") || kab.includes("Sukabumi") || kec.includes("Cibadak"))
            ? "Posko Induk 01 - Balai Desa Sukamaju (BPBD Wilayah)"
            : (prov.includes("Jawa Timur") || kab.includes("Surabaya")) 
              ? "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)" 
              : `Posko BPBD ${kab} (${prov})`,
        };

        setActiveAddress(`${info.desa}, Kec. ${info.kecamatan}, ${info.kabupaten}`);
        onLocationPickedRef.current?.(info);
        resolved = true;
      }
    } catch (e) {
      console.log('BigDataCloud error, trying Nominatim...', e);
    }

    // 2. OpenStreetMap Nominatim Fallback
    if (!resolved) {
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetch(nomUrl, { headers: { 'Accept-Language': 'id, en' } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const road = addr.road ? `${addr.road}, ` : "";
            const desa = addr.suburb || addr.village || addr.quarter || addr.neighbourhood || addr.residential || fallback.desa;
            const kec = addr.city_district || addr.subdistrict || addr.district || addr.municipality || fallback.kecamatan;
            const kab = addr.city || addr.town || addr.regency || addr.county || fallback.kabupaten;
            const prov = addr.state || addr.province || fallback.provinsi;

            const info: LocationInfo = {
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              desa: `${road}${desa}`.replace(/Kelurahan\s+/i, "Kel. ").replace(/Desa\s+/i, "Desa "),
              kecamatan: (kec || fallback.kecamatan).replace(/Kecamatan\s+/i, ""),
              kabupaten: (kab || fallback.kabupaten),
              provinsi: (prov || fallback.provinsi),
              poskoName: (prov.includes("Jawa Barat") || kab.includes("Sukabumi") || kec.includes("Cibadak"))
                ? "Posko Induk 01 - Balai Desa Sukamaju (BPBD Wilayah)"
                : (prov.includes("Jawa Timur") || kab.includes("Surabaya")) 
                  ? "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)" 
                  : `Posko BPBD ${kab} (${prov})`,
            };

            setActiveAddress(`${info.desa}, Kec. ${info.kecamatan}, ${info.kabupaten}`);
            onLocationPickedRef.current?.(info);
            resolved = true;
          }
        }
      } catch (e) {
        console.log('Nominatim lookup error', e);
      }
    }

    if (!resolved) {
      onLocationPickedRef.current?.(fallback);
    }
  }, [resolveFallbackLocation]);

  // Handle GPS button click with multi-tier detection (Browser GPS -> Free IP Geolocation)
  const handleGPSButtonClick = useCallback(() => {
    setIsLocating(true);

    const tryIPLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const lat = data.latitude;
            const lng = data.longitude;
            setIsLocating(false);
            updateCitizenLocation(lat, lng);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
            }
            return;
          }
        }
      } catch (e) {}

      // Fallback coordinate to current initial coordinates
      setIsLocating(false);
      updateCitizenLocation(initialLat, initialLng);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([initialLat, initialLng], 15, { animate: true, duration: 1.0 });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setIsLocating(false);
          updateCitizenLocation(lat, lng);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
          }
        },
        () => {
          tryIPLocation();
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      tryIPLocation();
    }
  }, [updateCitizenLocation]);

  // Search places in Indonesia via Photon / OSM Geocoder
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchDropdown(true);

    try {
      const q = encodeURIComponent(`${searchQuery}, Indonesia`);
      const url = `https://photon.komoot.io/api/?q=${q}&limit=5&lang=default`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          setSearchResults(data.features);
        } else {
          // Try Nominatim
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=id&limit=5`;
          const nomRes = await fetch(nomUrl);
          const nomData = await nomRes.json();
          if (nomData && nomData.length > 0) {
            setSearchResults(nomData.map((item: any) => ({
              geometry: { coordinates: [parseFloat(item.lon), parseFloat(item.lat)] },
              properties: { name: item.display_name, city: item.name }
            })));
          } else {
            setSearchResults([]);
          }
        }
      }
    } catch (err) {
      console.log('Search error', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (feature: any) => {
    const coords = feature.geometry.coordinates; // [lng, lat]
    const lng = coords[0];
    const lat = coords[1];

    setShowSearchDropdown(false);
    setSearchQuery(feature.properties?.name || searchQuery);

    updateCitizenLocation(lat, lng);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
    }
  };

  // Fetch poskos from API
  useEffect(() => {
    let isMounted = true;
    apiService.getPoskos()
      .then((res) => {
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setPoskos(res.data);
          if (selectedPoskoId) {
            const found = res.data.find(p => p.id === selectedPoskoId);
            if (found) setActivePosko(found);
          } else {
            setActivePosko(res.data[0]);
          }
        }
      })
      .catch((err) => console.log('Using offline mock poskos', err));

    return () => {
      isMounted = false;
    };
  }, [selectedPoskoId]);

  // Initial setup on render (runs strictly once to prevent flickering)
  const hasInitializedGeoRef = useRef(false);
  useEffect(() => {
    if (pickLocation && !hasInitializedGeoRef.current) {
      hasInitializedGeoRef.current = true;
      updateCitizenLocation(initialLat, initialLng);
    }
  }, [pickLocation, initialLat, initialLng, updateCitizenLocation]);

  // Dynamic sync if initial coordinates change externally (e.g. from GPS auto-detect or case selection)
  const lastSyncCoordsRef = useRef<string>('');
  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      const key = `${Number(initialLat).toFixed(5)},${Number(initialLng).toFixed(5)}`;
      if (lastSyncCoordsRef.current && lastSyncCoordsRef.current !== key) {
        setCitizenPos([initialLat, initialLng]);
        if (citizenMarkerRef.current) {
          citizenMarkerRef.current.setLatLng([initialLat, initialLng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([initialLat, initialLng], 15, { animate: true, duration: 1.0 });
        }
      }
      lastSyncCoordsRef.current = key;
    }
  }, [initialLat, initialLng]);

  // Initialize Leaflet Map (Mount & Cleanup lifecycle)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove legacy leaflet id if container is reused
    if ((mapContainerRef.current as any)._leaflet_id && !mapInstanceRef.current) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    if (!mapInstanceRef.current) {
      const startLat = Number.isFinite(Number(initialLat)) ? Number(initialLat) : -7.3300;
      const startLng = Number.isFinite(Number(initialLng)) ? Number(initialLng) : 112.7250;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const markerLayer = L.layerGroup().addTo(map);
      markersRef.current = markerLayer;
      mapInstanceRef.current = map;

      if (pickLocation) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          if (e?.latlng && Number.isFinite(e.latlng.lat) && Number.isFinite(e.latlng.lng)) {
            updateCitizenLocation(e.latlng.lat, e.latlng.lng);
          }
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Update markers & layers whenever data / position changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerLayer = markersRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    // Posko Marker Icon (Clean elevated badge with pointer stem)
    const createPoskoIcon = (label: string, isSelected: boolean, isNearCase: boolean) => {
      return L.divIcon({
        className: 'custom-posko-marker',
        html: `
          <div style="
            position: relative;
            background: ${isSelected ? '#013220' : '#1b4332'};
            color: #ffffff;
            border: 1.5px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            white-space: nowrap;
            transform: translate(-50%, ${isNearCase ? '-140%' : '-100%'});
            margin-top: ${isNearCase ? '-20px' : '-8px'};
            z-index: ${isSelected ? 600 : 300};
          ">
            <span style="font-size: 12px;">🏛️</span>
            <span>${label}</span>
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid ${isSelected ? '#013220' : '#1b4332'};
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
    };

    // Render Posko Markers only on general/overview map, NOT in operational case detail view
    if (!operational && Array.isArray(poskos)) {
      poskos.forEach((posko) => {
        const lat = Number(posko?.latitude);
        const lng = Number(posko?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const isSelected = activePosko?.id === posko.id;
        const marker = L.marker([lat, lng], {
          icon: createPoskoIcon(posko.kode_posko || 'POSKO', isSelected, false),
          zIndexOffset: isSelected ? 500 : 200,
        });

        marker.bindPopup(`
          <div style="font-size: 12px; line-height: 1.4;">
            <strong style="color: #013220; display: block; margin-bottom: 2px;">${posko.nama_posko || 'Posko BPBD'}</strong>
            <div><b>Wilayah:</b> ${posko.desa || '-'}, Kec. ${posko.kecamatan || '-'}</div>
          </div>
        `);

        marker.on('click', () => {
          setActivePosko(posko);
          onSelectPosko?.(posko);
        });

        marker.addTo(markerLayer);
      });
    }

    // Google Maps Style Blue Dot / Pin with Pulse (Form Pelaporan)
    if (pickLocation) {
      const cLat = Number(citizenPos?.[0]);
      const cLng = Number(citizenPos?.[1]);
      if (Number.isFinite(cLat) && Number.isFinite(cLng)) {
        const googlePinIcon = L.divIcon({
          className: 'google-maps-location-pin',
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: grab;">
              <div style="
                position: absolute;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                background: rgba(26, 115, 232, 0.28);
                animation: gmap-pulse 2s infinite ease-out;
              "></div>
              <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #1a73e8;
                border: 3.5px solid #ffffff;
                box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                z-index: 2;
              "></div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const citizenMarker = L.marker([cLat, cLng], {
          icon: googlePinIcon,
          draggable: true,
          zIndexOffset: 1000,
        });

        citizenMarker.on('dragend', () => {
          const pos = citizenMarker.getLatLng();
          if (pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng)) {
            updateCitizenLocation(pos.lat, pos.lng);
          }
        });

        citizenMarker.bindPopup(`
          <div style="font-size: 12px; max-width: 200px;">
            <strong style="color: #1a73e8; font-size: 13px;">📍 Titik Lokasi Anda</strong><br>
            <div style="margin: 4px 0; font-weight: 600; color: #222;">${activeAddress}</div>
            <small style="color: #2e774f;">✓ Koordinat disinkronkan ke formulir</small>
          </div>
        `);

        citizenMarker.addTo(markerLayer);
        citizenMarkerRef.current = citizenMarker;
      }
    } else if (operational) {
      const oLat = Number(initialLat);
      const oLng = Number(initialLng);
      if (Number.isFinite(oLat) && Number.isFinite(oLng)) {
        const casePinIcon = L.divIcon({
          className: 'case-location-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
              <div style="
                background: #d9383a;
                color: #ffffff;
                padding: 4px 10px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 700;
                box-shadow: 0 4px 12px rgba(217, 56, 58, 0.45);
                border: 1.5px solid #ffffff;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 3px;
              ">
                <span>📍</span>
                <span>Titik Laporan</span>
              </div>
              <div style="
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #d9383a;
                border: 3px solid #ffffff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              "></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const caseMarker = L.marker([oLat, oLng], {
          icon: casePinIcon,
          zIndexOffset: 1000,
        });

        caseMarker.bindPopup(`
          <div style="font-size: 12px; line-height: 1.4;">
            <strong style="color: #cf1322; font-size: 13px;">📍 Titik Lokasi Kebutuhan Warga</strong><br>
            <small style="color: #555;">Koordinat: ${oLat.toFixed(5)}, ${oLng.toFixed(5)}</small>
          </div>
        `);

        caseMarker.addTo(markerLayer);
        map.setView([oLat, oLng], 15);
      }
    }

    // Route if active delivery mission
    if (showRoute) {
      const routePoints: [number, number][] = [
        [-6.9385, 106.9100],
        [-6.9290, 106.9200],
        [-6.9174639, 106.9298281],
      ];

      L.polyline(routePoints, {
        color: '#013220',
        weight: 4,
        dashArray: '6, 6',
        opacity: 0.85,
      }).addTo(markerLayer);

      const truckIcon = L.divIcon({
        className: 'truck-marker',
        html: `<div style="font-size: 20px;">🚚</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([-6.9290, 106.9200], { icon: truckIcon })
        .bindPopup('<b>Armada Tangki BPBD</b>')
        .addTo(markerLayer);
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

  }, [poskos, activePosko, operational, showRoute, pickLocation, citizenPos, activeAddress, initialLat, initialLng, updateCitizenLocation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* SEARCH BAR (Google Maps Style) */}
      {pickLocation && (
        <div style={{ position: 'relative', width: '100%' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Ketik nama jalan, desa, kelurahan, kecamatan, atau kota..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #c2d4c5',
                  fontSize: '0.88rem',
                  outline: 'none',
                  background: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  color: '#1a3320',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              style={{
                padding: '10px 18px',
                background: '#013220',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              {isSearching ? 'Mencari...' : 'Cari Titik'}
            </button>
          </form>

          {/* SEARCH AUTOCOMPLETE DROPDOWN */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              border: '1px solid #d4dfd6',
              zIndex: 2000,
              overflow: 'hidden',
              maxHeight: '220px',
              overflowY: 'auto',
            }}>
              {searchResults.map((item, idx) => {
                const name = item.properties?.name || item.properties?.city || 'Lokasi Terpilih';
                const state = item.properties?.state || item.properties?.country || 'Indonesia';
                return (
                  <div
                    key={idx}
                    onClick={() => selectSearchResult(item)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#013220',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f7f3')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    <span>📍</span>
                    <div>
                      <strong style={{ display: 'block' }}>{name}</strong>
                      <small style={{ color: '#6a7369' }}>{state}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MAP CONTAINER */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        border: '1.5px solid #d4dfd6', 
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)' 
      }}>
        {/* MAP CANVAS */}
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: operational ? '380px' : '340px', background: '#e5e3df' }} 
        />

        {/* GOOGLE MAPS FLOATING "MY LOCATION" GPS BUTTON (Top Right) */}
        {pickLocation && (
          <button
            type="button"
            title="Deteksi Lokasi GPS Saya Saat Ini"
            onClick={handleGPSButtonClick}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#ffffff',
              color: '#1a73e8',
              border: 'none',
              boxShadow: '0 3px 12px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isLocating ? (
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="7" />
                <line x1="12" y1="1" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="23" />
                <line x1="1" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="23" y2="12" />
                <circle cx="12" cy="12" r="2.5" fill="#1a73e8" />
              </svg>
            )}
          </button>
        )}

        {/* FLOATING MINI LOCATION BADGE (Top Left) */}
        {pickLocation && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            padding: '6px 14px',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#013220',
            border: '1px solid #d4dfd6',
            maxWidth: 'calc(100% - 75px)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#1a73e8', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {activeAddress}</span>
          </div>
        )}

        {/* DEDICATED ZOOM IN (+) AND ZOOM OUT (-) CONTROLS */}
        <div style={{
          position: 'absolute',
          top: pickLocation ? '64px' : '14px',
          right: '14px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
          border: '1.5px solid rgba(1,50,32,0.18)',
          overflow: 'hidden',
        }}>
          <button
            type="button"
            title="Perbesar Peta (Zoom In +)"
            aria-label="Zoom In"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              mapInstanceRef.current?.zoomIn();
            }}
            style={{
              width: '38px',
              height: '38px',
              border: 'none',
              background: '#ffffff',
              color: '#013220',
              fontSize: '22px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #e2ded4',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            +
          </button>
          <button
            type="button"
            title="Perkecil Peta (Zoom Out -)"
            aria-label="Zoom Out"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              mapInstanceRef.current?.zoomOut();
            }}
            style={{
              width: '38px',
              height: '38px',
              border: 'none',
              background: '#ffffff',
              color: '#013220',
              fontSize: '24px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            −
          </button>
        </div>

        {/* OVERLAY CARD FOR POSKO */}
        {!hideCard && activePosko && (
          <div className="leaflet-overlay-card">
            <div className="overlay-card-header">
              <span className="overlay-posko-badge">
                <i className="status-live-dot" /> {activePosko.kode_posko}
              </span>
              <span className="overlay-status-tag">{activePosko.status_operasional}</span>
            </div>
            <h3>{activePosko.nama_posko}</h3>
            <div className="overlay-meta">
              <span><b>{activePosko.kk_terdata}</b> KK Terdata</span>
              <span>Kapasitas: <b>{activePosko.kapasitas_kk}</b> KK</span>
            </div>
            <small className="overlay-location">{activePosko.desa}, Kec. ${activePosko.kecamatan}</small>
          </div>
        )}
      </div>

      {pickLocation && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#2e774f', fontWeight: 600, padding: '0 4px' }}>
          <span>✓</span>
          <span>Titik lokasi telah otomatis tersinkronisasi ke bidang formulir di atas (Provinsi, Kab/Kota, Kecamatan, Desa, dan Posko BPBD).</span>
        </div>
      )}
    </div>
  );
}
