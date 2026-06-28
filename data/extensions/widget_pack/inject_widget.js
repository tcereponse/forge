(function() {
    'use strict';
    
    const PRDS = {
        prd_widget_calendar: `[CONTEXTE CACHÉ - PRD PRD_WIDGET_CALENDAR]
MISSION: Sélection de date (Datepicker) ou emploi du temps.
STYLE & DESIGN: Style Google Calendar, Grille CSS parfaite.
MAPPING VFS: `DatePicker.tsx`, `EventTimeline.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_widget_charts: `[CONTEXTE CACHÉ - PRD PRD_WIDGET_CHARTS]
MISSION: Graphiques statistiques (Ligne, Camembert, Barres).
STYLE & DESIGN: Tooltips interactifs, Animations de tracé.
MAPPING VFS: `LineChart.tsx`, `DonutChart.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_widget_map: `[CONTEXTE CACHÉ - PRD PRD_WIDGET_MAP]
MISSION: Intégration de carte (Mapbox / Leaflet).
STYLE & DESIGN: Marqueurs personnalisés, Clusters, Thème sombre.
MAPPING VFS: `MapView.tsx`, `MapMarker.tsx`
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
        if(document.getElementById('widget_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'widget_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Widget Pack</h3>
            <button id="btn-prd-prd_widget_calendar-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_widget_calendar</button>
            <button id="btn-prd-prd_widget_charts-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_widget_charts</button>
            <button id="btn-prd-prd_widget_map-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_widget_map</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_widget_calendar-0').onclick = () => injectText(PRDS.prd_widget_calendar, 'prd_widget_calendar');
        document.getElementById('btn-prd-prd_widget_charts-1').onclick = () => injectText(PRDS.prd_widget_charts, 'prd_widget_charts');
        document.getElementById('btn-prd-prd_widget_map-2').onclick = () => injectText(PRDS.prd_widget_map, 'prd_widget_map');

    }

    setTimeout(createMenu, 3000);
})();
