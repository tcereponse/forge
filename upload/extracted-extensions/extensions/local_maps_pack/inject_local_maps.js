(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_map_explorer: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_MAP_EXPLORER]
MISSION: Écran map explorateur (scroll + map).
STYLE & DESIGN: Bottom sheet listing.
MAPPING VFS: MapScreen.tsx, PlaceSheet.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_location_picker: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_LOCATION_PICKER]
MISSION: Sélecteur de localisation.
STYLE & DESIGN: Pin draggable.
MAPPING VFS: LocationPicker.tsx, MapPin.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_route_preview: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_ROUTE_PREVIEW]
MISSION: Preview d’itinéraire (voiture, marche).
STYLE & DESIGN: Polyline + steps.
MAPPING VFS: RouteMap.tsx, RouteSteps.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_nearby_discover: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_NEARBY_DISCOVER]
MISSION: Découverte “à proximité”.
STYLE & DESIGN: Cards, distance badges.
MAPPING VFS: NearbyList.tsx, DistanceBadge.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_geofencing_zones: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GEOFENCING_ZONES]
MISSION: Gestion zones géo (geofences).
STYLE & DESIGN: Draw zones on map.
MAPPING VFS: ZoneEditor.tsx, ZoneList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_checkin_screen: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHECKIN_SCREEN]
MISSION: Check‑in/out géolocalisé.
STYLE & DESIGN: Big button, status.
MAPPING VFS: CheckinButton.tsx, CheckinStatus.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_store_locator: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_STORE_LOCATOR]
MISSION: Localisateur de magasins mobile.
STYLE & DESIGN: List + map toggle.
MAPPING VFS: StoreListMobile.tsx, StoreMapToggle.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_ride_status: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_RIDE_STATUS]
MISSION: Suivi course (type VTC).
STYLE & DESIGN: Map + bottom status card.
MAPPING VFS: RideStatus.tsx, DriverCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_weather_overlay: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_WEATHER_OVERLAY]
MISSION: Overlay météo contextuelle.
STYLE & DESIGN: Top banner, icons.
MAPPING VFS: WeatherBanner.tsx, WeatherDetail.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_geo_permissions: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GEO_PERMISSIONS]
MISSION: UI permission emplacement.
STYLE & DESIGN: Explanations, CTA.
MAPPING VFS: GeoPermissionScreen.tsx, PermissionCard.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FF0055; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('local_maps_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'local_maps_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Local & Maps Pack</h3>
            <button id="btn-prd-prd_mobile_map_explorer-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_map_explorer</button>
            <button id="btn-prd-prd_mobile_location_picker-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_location_picker</button>
            <button id="btn-prd-prd_mobile_route_preview-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_route_preview</button>
            <button id="btn-prd-prd_mobile_nearby_discover-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_nearby_discover</button>
            <button id="btn-prd-prd_mobile_geofencing_zones-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_geofencing_zones</button>
            <button id="btn-prd-prd_mobile_checkin_screen-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_checkin_screen</button>
            <button id="btn-prd-prd_mobile_store_locator-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_store_locator</button>
            <button id="btn-prd-prd_mobile_ride_status-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_ride_status</button>
            <button id="btn-prd-prd_mobile_weather_overlay-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_weather_overlay</button>
            <button id="btn-prd-prd_mobile_geo_permissions-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_geo_permissions</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_map_explorer-0').onclick = () => injectText(PRDS.prd_mobile_map_explorer, 'prd_mobile_map_explorer');
        document.getElementById('btn-prd-prd_mobile_location_picker-1').onclick = () => injectText(PRDS.prd_mobile_location_picker, 'prd_mobile_location_picker');
        document.getElementById('btn-prd-prd_mobile_route_preview-2').onclick = () => injectText(PRDS.prd_mobile_route_preview, 'prd_mobile_route_preview');
        document.getElementById('btn-prd-prd_mobile_nearby_discover-3').onclick = () => injectText(PRDS.prd_mobile_nearby_discover, 'prd_mobile_nearby_discover');
        document.getElementById('btn-prd-prd_mobile_geofencing_zones-4').onclick = () => injectText(PRDS.prd_mobile_geofencing_zones, 'prd_mobile_geofencing_zones');
        document.getElementById('btn-prd-prd_mobile_checkin_screen-5').onclick = () => injectText(PRDS.prd_mobile_checkin_screen, 'prd_mobile_checkin_screen');
        document.getElementById('btn-prd-prd_mobile_store_locator-6').onclick = () => injectText(PRDS.prd_mobile_store_locator, 'prd_mobile_store_locator');
        document.getElementById('btn-prd-prd_mobile_ride_status-7').onclick = () => injectText(PRDS.prd_mobile_ride_status, 'prd_mobile_ride_status');
        document.getElementById('btn-prd-prd_mobile_weather_overlay-8').onclick = () => injectText(PRDS.prd_mobile_weather_overlay, 'prd_mobile_weather_overlay');
        document.getElementById('btn-prd-prd_mobile_geo_permissions-9').onclick = () => injectText(PRDS.prd_mobile_geo_permissions, 'prd_mobile_geo_permissions');

    }

    setTimeout(createMenu, 3000);
})();
